"""
Substitute Allocation Engine
============================
Given an approved leave request, this figures out every real class
it disrupts, then scores every qualified, available faculty member
against each disrupted class to recommend the best substitute —
with a transparent, explainable breakdown of *why*.

Scoring factors (out of ~100 points):
  - Subject match quality   (up to 50) - do they actually teach this subject?
  - Same department          (20)       - departmental continuity
  - Current availability     (up to 20) - lower existing weekly load scores higher
  - Fairness                 (up to 10) - spreads substitution duty around,
                                          instead of always picking the same person

Hard filters (before scoring even happens):
  - Must be qualified to teach the subject at all
  - Must not already be teaching something else at that exact day+period
  - Must not already be substituting somewhere else at that exact date+period
  - Must not themselves be on approved leave that date
"""

from datetime import date, timedelta
from collections import defaultdict


def _daterange(start: date, end: date):
    for n in range((end - start).days + 1):
        yield start + timedelta(days=n)


def get_affected_slots(supabase_service, leave_request: dict) -> list[dict]:
    """
    Turns a leave request's date range into a concrete list of
    (calendar date, timetable slot) pairs that actually need covering.
    Weekly recurring timetable + specific leave dates -> real disruptions.
    """
    start = date.fromisoformat(leave_request["start_date"])
    end = date.fromisoformat(leave_request["end_date"])
    faculty_id = leave_request["faculty_id"]

    slots = (
        supabase_service.table("timetable_slots")
        .select("*")
        .eq("faculty_id", faculty_id)
        .execute()
        .data
    )

    slots_by_day = defaultdict(list)
    for s in slots:
        slots_by_day[s["day_of_week"]].append(s)

    affected = []
    for d in _daterange(start, end):
        weekday = d.weekday()  # Monday=0 ... Sunday=6
        if weekday == 6:
            continue  # no classes on Sunday
        our_day = weekday + 1  # our schema: 1=Mon ... 6=Sat
        for slot in slots_by_day.get(our_day, []):
            affected.append({"date": d.isoformat(), "slot": slot})

    return affected


def find_best_substitute(
    supabase_service, slot: dict, target_date: str, on_leave_faculty_ids: set
) -> dict | None:
    """Scores every valid candidate for one disrupted class slot."""
    subject_id = slot["subject_id"]
    day_of_week = slot["day_of_week"]
    period_number = slot["period_number"]
    original_faculty_id = slot["faculty_id"]
    department_id = slot["department_id"]

    # 1. Who is even qualified to teach this subject?
    qualified = (
        supabase_service.table("faculty_subjects")
        .select("faculty_id, proficiency")
        .eq("subject_id", subject_id)
        .execute()
        .data
    )
    qualified = [q for q in qualified if q["faculty_id"] != original_faculty_id]
    if not qualified:
        return None

    # 2. Who already has a class at this exact day+period?
    busy_slots = (
        supabase_service.table("timetable_slots")
        .select("faculty_id")
        .eq("day_of_week", day_of_week)
        .eq("period_number", period_number)
        .execute()
        .data
    )
    busy_ids = {b["faculty_id"] for b in busy_slots}

    # 3. Who is already covering a different class at this exact date+period?
    busy_substitute_rows = (
        supabase_service.table("substitute_allocations")
        .select("substitute_faculty_id, timetable_slots(day_of_week, period_number)")
        .eq("slot_date", target_date)
        .execute()
        .data
    )
    busy_substitute_ids = set()
    for row in busy_substitute_rows:
        ts = row.get("timetable_slots")
        if ts and ts.get("period_number") == period_number and ts.get("day_of_week") == day_of_week:
            if row.get("substitute_faculty_id"):
                busy_substitute_ids.add(row["substitute_faculty_id"])

    candidates = [
        q for q in qualified
        if q["faculty_id"] not in busy_ids
        and q["faculty_id"] not in busy_substitute_ids
        and q["faculty_id"] not in on_leave_faculty_ids
    ]
    if not candidates:
        return None

    # 4. Score what's left
    scored = []
    for c in candidates:
        fid = c["faculty_id"]

        profile = (
            supabase_service.table("profiles")
            .select("department_id")
            .eq("id", fid)
            .single()
            .execute()
            .data
        )

        weekly_load = (
            supabase_service.table("timetable_slots")
            .select("id", count="exact")
            .eq("faculty_id", fid)
            .execute()
        )
        load_count = weekly_load.count or 0

        recent_subs = (
            supabase_service.table("substitute_allocations")
            .select("id", count="exact")
            .eq("substitute_faculty_id", fid)
            .execute()
        )
        recent_sub_count = recent_subs.count or 0

        proficiency_score = 50 if c["proficiency"] == "primary" else 25
        dept_score = 20 if profile and profile.get("department_id") == department_id else 0
        availability_score = max(0, 20 - load_count)
        fairness_score = max(0, 10 - recent_sub_count * 2)

        total = proficiency_score + dept_score + availability_score + fairness_score

        scored.append({
            "faculty_id": fid,
            "score": total,
            "reason": {
                "subject_match": c["proficiency"],
                "same_department": dept_score > 0,
                "current_weekly_load": load_count,
                "recent_substitutions": recent_sub_count,
                "breakdown": {
                    "proficiency_score": proficiency_score,
                    "department_score": dept_score,
                    "availability_score": availability_score,
                    "fairness_score": fairness_score,
                },
            },
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[0]


def allocate_substitutes_for_leave(supabase_service, leave_request: dict) -> list[dict]:
    """
    The main entry point: run the whole engine for every slot an
    approved leave disrupts, and save the results.
    """
    affected = get_affected_slots(supabase_service, leave_request)
    if not affected:
        return []

    all_dates = {a["date"] for a in affected}

    # Rough global check: who else is on approved leave on any of these dates?
    on_leave_faculty_ids = set()
    approved_leaves = (
        supabase_service.table("leave_requests")
        .select("faculty_id, start_date, end_date")
        .eq("status", "approved")
        .execute()
        .data
    )
    for lv in approved_leaves:
        lv_start = date.fromisoformat(lv["start_date"])
        lv_end = date.fromisoformat(lv["end_date"])
        for d_str in all_dates:
            d = date.fromisoformat(d_str)
            if lv_start <= d <= lv_end:
                on_leave_faculty_ids.add(lv["faculty_id"])
                break

    records = []
    for item in affected:
        slot = item["slot"]
        target_date = item["date"]
        best = find_best_substitute(supabase_service, slot, target_date, on_leave_faculty_ids)

        records.append({
            "leave_request_id": leave_request["id"],
            "timetable_slot_id": slot["id"],
            "slot_date": target_date,
            "original_faculty_id": slot["faculty_id"],
            "substitute_faculty_id": best["faculty_id"] if best else None,
            "allocation_score": best["score"] if best else None,
            "allocation_reason": best["reason"] if best else {"error": "No qualified and available substitute found"},
            "status": "auto_assigned",
        })

    inserted = supabase_service.table("substitute_allocations").insert(records).execute()
    return inserted.data