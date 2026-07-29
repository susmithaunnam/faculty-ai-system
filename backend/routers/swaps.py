from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from database import supabase_service
from auth import get_current_user
from schemas import SwapRequestCreate

router = APIRouter(prefix="/swap-requests", tags=["Swap Requests"])


@router.post("")
def create_swap_request(payload: SwapRequestCreate, current_user: dict = Depends(get_current_user)):
    """A faculty member proposes swapping one of their class hours with someone else's."""
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
        .select("*")
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

    result = (
        supabase_service.table("swap_requests")
        .update({"status": "rejected", "resolved_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", swap_id)
        .execute()
    )
    return {"data": result.data}