from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_service
from auth import get_current_user, require_admin
from schemas import LeaveRequestCreate

router = APIRouter(prefix="/leave-requests", tags=["Leave Requests"])


@router.post("")
def create_leave_request(payload: LeaveRequestCreate, current_user: dict = Depends(get_current_user)):
    """A faculty member applies for leave."""
    data = {
        "faculty_id": current_user["id"],
        "start_date": str(payload.start_date),
        "end_date": str(payload.end_date),
        "reason": payload.reason,
    }
    result = supabase_service.table("leave_requests").insert(data).execute()
    return {"data": result.data}


@router.get("/me")
def get_my_leave_requests(current_user: dict = Depends(get_current_user)):
    """A faculty member views their own leave history."""
    result = (
        supabase_service.table("leave_requests")
        .select("*")
        .eq("faculty_id", current_user["id"])
        .order("applied_at", desc=True)
        .execute()
    )
    return {"data": result.data}


@router.get("")
def get_all_leave_requests(status: str | None = None, admin: dict = Depends(require_admin)):
    """Admin views all leave requests, optionally filtered by status."""
    query = supabase_service.table("leave_requests").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("applied_at", desc=True).execute()
    return {"data": result.data}


@router.patch("/{leave_id}/approve")
def approve_leave(leave_id: str, admin: dict = Depends(require_admin)):
    result = (
        supabase_service.table("leave_requests")
        .update({
            "status": "approved",
            "reviewed_by": admin["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", leave_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return {"data": result.data}
    # NOTE: this does not yet auto-find a substitute — that's Phase 3,
    # where approving a leave will trigger the scoring engine for
    # every affected timetable slot.


@router.patch("/{leave_id}/reject")
def reject_leave(leave_id: str, admin: dict = Depends(require_admin)):
    result = (
        supabase_service.table("leave_requests")
        .update({
            "status": "rejected",
            "reviewed_by": admin["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", leave_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return {"data": result.data}