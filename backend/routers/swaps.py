from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_service
from auth import get_current_user
from schemas import SwapRequestCreate

router = APIRouter(prefix="/swap-requests", tags=["Swap Requests"])

# Used on every read so the frontend gets faculty names and slot details
# instead of bare UUIDs — RequestCard renders request.requester?.full_name,
# request.requester_slot?.section, etc.
SWAP_REQUEST_SELECT = (
    "*, "
    "requester:profiles!requester_id(id, full_name), "
    "target:profiles!target_id(id, full_name), "
    "requester_slot:timetable_slots!requester_slot_id(section, day_of_week, period_number), "
    "target_slot:timetable_slots!target_slot_id(section, day_of_week, period_number)"
)


@router.post("")
def create_swap_request(payload: SwapRequestCreate, current_user: dict = Depends(get_current_user)):
    """A faculty member proposes swapping one of their class hours with someone else's."""
    if payload.target_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You can't propose a swap with yourself")

    requester_slot = (
        supabase_service.table("timetable_slots")
        .select("id, faculty_id")
        .eq("id", payload.requester_slot_id)
        .single()
        .execute()
        .data
    )
    if not requester_slot or requester_slot["faculty_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="That slot doesn't belong to you")

    target_slot = (
        supabase_service.table("timetable_slots")
        .select("id, faculty_id")
        .eq("id", payload.target_slot_id)
        .single()
        .execute()
        .data
    )
    if not target_slot or target_slot["faculty_id"] != payload.target_id:
        raise HTTPException(status_code=403, detail="That slot doesn't belong to the selected faculty member")

    data = {
        "requester_id": current_user["id"],
        "requester_slot_id": payload.requester_slot_id,
        "target_id": payload.target_id,
        "target_slot_id": payload.target_slot_id,
    }
    result = supabase_service.table("swap_requests").insert(data).execute()
    return {"data": result.data}


@router.get("/me")
def get_my_swap_requests(current_user: dict = Depends(get_current_user)):
    """Swaps you proposed, or swaps someone proposed to you."""
    uid = current_user["id"]
    result = (
        supabase_service.table("swap_requests")
        .select(SWAP_REQUEST_SELECT)
        .or_(f"requester_id.eq.{uid},target_id.eq.{uid}")
        .order("created_at", desc=True)
        .execute()
    )
    return {"data": result.data}


@router.patch("/{swap_id}/accept")
def accept_swap(swap_id: str, current_user: dict = Depends(get_current_user)):
    """
    Only the person who was asked to swap can accept it.
    Accepting actually rewrites the timetable: the two slots
    trade which faculty member teaches them.
    """
    swap = (
        supabase_service.table("swap_requests").select("*").eq("id", swap_id).single().execute().data
    )
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if swap["target_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the requested faculty member can accept this swap")
    if swap["status"] != "pending":
        raise HTTPException(status_code=400, detail="This swap request is no longer pending")

    supabase_service.table("timetable_slots").update(
        {"faculty_id": swap["target_id"]}
    ).eq("id", swap["requester_slot_id"]).execute()

    supabase_service.table("timetable_slots").update(
        {"faculty_id": swap["requester_id"]}
    ).eq("id", swap["target_slot_id"]).execute()

    result = (
        supabase_service.table("swap_requests")
        .update({"status": "accepted", "resolved_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", swap_id)
        .execute()
    )
    return {"data": result.data, "message": "Swap accepted — timetable updated"}


@router.patch("/{swap_id}/reject")
def reject_swap(swap_id: str, current_user: dict = Depends(get_current_user)):
    swap = (
        supabase_service.table("swap_requests").select("*").eq("id", swap_id).single().execute().data
    )
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if swap["target_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the requested faculty member can reject this swap")
    if swap["status"] != "pending":
        raise HTTPException(status_code=400, detail="This swap request is no longer pending")

    result = (
        supabase_service.table("swap_requests")
        .update({"status": "rejected", "resolved_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", swap_id)
        .execute()
    )
    return {"data": result.data}


@router.patch("/{swap_id}/cancel")
def cancel_swap(swap_id: str, current_user: dict = Depends(get_current_user)):
    """The requester can withdraw their own swap request while it's still pending."""
    swap = (
        supabase_service.table("swap_requests").select("*").eq("id", swap_id).single().execute().data
    )
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if swap["requester_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the person who proposed this swap can cancel it")
    if swap["status"] != "pending":
        raise HTTPException(status_code=400, detail="This swap request is no longer pending")

    result = (
        supabase_service.table("swap_requests")
        .update({"status": "cancelled", "resolved_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", swap_id)
        .execute()
    )
    return {"data": result.data}