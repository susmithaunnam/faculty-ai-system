from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_service
from auth import require_admin, get_current_user
from schemas import SubstituteOverride
from substitute_engine import allocate_substitutes_for_leave

router = APIRouter(prefix="/substitute-allocations", tags=["Substitute Allocation"])


@router.post("/generate/{leave_id}")
def generate_substitutes(leave_id: str, admin: dict = Depends(require_admin)):
    """
    Runs the scoring engine for every class an already-approved leave
    disrupts, and stores a recommended substitute (with reasoning)
    for each one.
    """
    leave = (
        supabase_service.table("leave_requests").select("*").eq("id", leave_id).single().execute().data
    )
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave["status"] != "approved":
        raise HTTPException(status_code=400, detail="Leave must be approved before allocating substitutes")

    existing = (
        supabase_service.table("substitute_allocations")
        .select("id")
        .eq("leave_request_id", leave_id)
        .execute()
        .data
    )
    if existing:
        raise HTTPException(status_code=400, detail="Substitutes have already been generated for this leave")

    results = allocate_substitutes_for_leave(supabase_service, leave)
    return {"data": results}


@router.get("/today")
def get_today_allocations(current_user: dict = Depends(get_current_user)):
    """Daily dashboard: which classes today have a substitute covering them."""
    today = date.today().isoformat()
    result = (
        supabase_service.table("substitute_allocations")
        .select("*")
        .eq("slot_date", today)
        .execute()
    )
    return {"data": result.data}


@router.get("/leave/{leave_id}")
def get_allocations_for_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    """All substitute assignments generated for one leave request."""
    result = (
        supabase_service.table("substitute_allocations")
        .select("*")
        .eq("leave_request_id", leave_id)
        .execute()
    )
    return {"data": result.data}


@router.patch("/{allocation_id}/confirm")
def confirm_allocation(allocation_id: str, admin: dict = Depends(require_admin)):
    result = (
        supabase_service.table("substitute_allocations")
        .update({"status": "confirmed"})
        .eq("id", allocation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return {"data": result.data}


@router.patch("/{allocation_id}/override")
def override_allocation(allocation_id: str, payload: SubstituteOverride, admin: dict = Depends(require_admin)):
    """Admin manually assigns a different substitute than the engine picked."""
    result = (
        supabase_service.table("substitute_allocations")
        .update({
            "substitute_faculty_id": payload.new_substitute_faculty_id,
            "status": "manual_override",
        })
        .eq("id", allocation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return {"data": result.data}
