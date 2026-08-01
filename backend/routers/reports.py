from collections import defaultdict
from fastapi import APIRouter, Depends
from database import supabase_service
from auth import require_admin

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def get_reports_summary(admin: dict = Depends(require_admin)):
    """
    One call that powers the whole analytics dashboard. Pulls the raw
    tables and aggregates in Python rather than via SQL views, matching
    how the rest of this backend builds lookups (see Timetable.jsx's
    client-side maps for the same pattern, just done server-side here
    since several sections need the same base data joined together).
    """
    leave_requests = supabase_service.table("leave_requests").select(
        "id, faculty_id, status, applied_at"
    ).execute().data

    faculty = supabase_service.table("profiles").select(
        "id, full_name, department_id, max_weekly_hours"
    ).eq("role", "faculty").execute().data

    departments = supabase_service.table("departments").select("id, name").execute().data

    allocations = supabase_service.table("substitute_allocations").select(
        "id, substitute_faculty_id, allocation_score, status"
    ).execute().data

    timetable_slots = supabase_service.table("timetable_slots").select(
        "faculty_id"
    ).execute().data

    faculty_by_id = {f["id"]: f for f in faculty}
    dept_name_by_id = {d["id"]: d["name"] for d in departments}

    # ---- Total leave requests + approved vs rejected -----------------
    leave_summary = {"total": len(leave_requests), "pending": 0, "approved": 0, "rejected": 0}
    for lr in leave_requests:
        status = lr["status"]
        if status in leave_summary:
            leave_summary[status] += 1

    # ---- Faculty with most leaves -------------------------------------
    per_faculty = defaultdict(lambda: {"total": 0, "approved": 0, "rejected": 0})
    for lr in leave_requests:
        row = per_faculty[lr["faculty_id"]]
        row["total"] += 1
        if lr["status"] in ("approved", "rejected"):
            row[lr["status"]] += 1

    leave_by_faculty = []
    for faculty_id, counts in per_faculty.items():
        f = faculty_by_id.get(faculty_id)
        leave_by_faculty.append({
            "faculty_id": faculty_id,
            "full_name": f["full_name"] if f else "Unknown",
            "department": dept_name_by_id.get(f["department_id"]) if f else None,
            **counts,
        })
    leave_by_faculty.sort(key=lambda r: r["total"], reverse=True)
    leave_by_faculty = leave_by_faculty[:10]

    # ---- Department-wise statistics ------------------------------------
    per_department = defaultdict(lambda: {"total": 0, "approved": 0, "rejected": 0})
    for lr in leave_requests:
        f = faculty_by_id.get(lr["faculty_id"])
        dept_name = dept_name_by_id.get(f["department_id"]) if f else "Unassigned"
        row = per_department[dept_name or "Unassigned"]
        row["total"] += 1
        if lr["status"] in ("approved", "rejected"):
            row[lr["status"]] += 1

    leave_by_department = [
        {"department": dept, **counts} for dept, counts in per_department.items()
    ]
    leave_by_department.sort(key=lambda r: r["total"], reverse=True)

    # ---- Monthly trend ---------------------------------------------------
    per_month = defaultdict(lambda: {"total": 0, "approved": 0, "rejected": 0})
    for lr in leave_requests:
        month = (lr.get("applied_at") or "")[:7]  # "YYYY-MM"
        if not month:
            continue
        row = per_month[month]
        row["total"] += 1
        if lr["status"] in ("approved", "rejected"):
            row[lr["status"]] += 1

    monthly_trend = [
        {"month": month, **counts} for month, counts in sorted(per_month.items())
    ]

    # ---- AI substitute allocation success rate -----------------------
    total_allocations = len(allocations)
    matched = [a for a in allocations if a["substitute_faculty_id"]]
    scores = [a["allocation_score"] for a in allocations if a["allocation_score"] is not None]

    substitute_stats = {
        "total_allocations": total_allocations,
        "matched": len(matched),
        "unmatched": total_allocations - len(matched),
        "success_rate": round(len(matched) / total_allocations * 100, 1) if total_allocations else 0,
        "avg_score": round(sum(scores) / len(scores), 1) if scores else None,
    }

    # ---- Workload distribution ------------------------------------------
    # Weekly classes taught per faculty member, as a % of their max_weekly_hours.
    classes_per_faculty = defaultdict(int)
    for slot in timetable_slots:
        if slot["faculty_id"]:
            classes_per_faculty[slot["faculty_id"]] += 1

    workload = []
    for f in faculty:
        weekly_classes = classes_per_faculty.get(f["id"], 0)
        max_hours = f.get("max_weekly_hours") or 20
        workload.append({
            "faculty_id": f["id"],
            "full_name": f["full_name"],
            "department": dept_name_by_id.get(f["department_id"]),
            "weekly_classes": weekly_classes,
            "max_weekly_hours": max_hours,
            "load_pct": round(weekly_classes / max_hours * 100, 1) if max_hours else 0,
        })
    workload.sort(key=lambda r: r["load_pct"], reverse=True)

    return {
        "data": {
            "leave_summary": leave_summary,
            "leave_by_faculty": leave_by_faculty,
            "leave_by_department": leave_by_department,
            "monthly_trend": monthly_trend,
            "substitute_stats": substitute_stats,
            "workload": workload,
        }
    }