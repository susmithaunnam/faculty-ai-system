from fastapi import APIRouter, Depends
from database import supabase_service
from auth import get_current_user, require_admin
from schemas import TimetableSlotCreate

router = APIRouter(prefix="/timetable", tags=["Timetable"])


@router.get("/me")
def get_my_timetable(current_user: dict = Depends(get_current_user)):
    """A faculty member's own weekly schedule."""
    result = (
        supabase_service.table("timetable_slots")
        .select("*")
        .eq("faculty_id", current_user["id"])
        .order("day_of_week")
        .order("period_number")
        .execute()
    )
    return {"data": result.data}


@router.get("/section/{section}")
def get_section_timetable(
    section: str,
    current_user: dict = Depends(get_current_user)
):
    """The class timetable for one section, e.g. CSE-AIML-2A."""
    result = (
        supabase_service.table("timetable_slots")
        .select("*")
        .eq("section", section)
        .order("day_of_week")
        .order("period_number")
        .execute()
    )
    return {"data": result.data}


@router.get("")
def get_all_timetable(admin: dict = Depends(require_admin)):
    """Admin views the entire college timetable."""
    result = (
        supabase_service.table("timetable_slots")
        .select("*")
        .execute()
    )
    return {"data": result.data}


@router.get("/faculty/{faculty_id}")
def get_faculty_timetable(
    faculty_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    View another faculty member's timetable.
    Used when requesting timetable swaps.
    """
    result = (
        supabase_service.table("timetable_slots")
        .select("*")
        .eq("faculty_id", faculty_id)
        .order("day_of_week")
        .order("period_number")
        .execute()
    )

    return {"data": result.data}


@router.post("")
def create_timetable_slot(
    payload: TimetableSlotCreate,
    admin: dict = Depends(require_admin)
):
    """Admin adds a class to the timetable."""
    result = (
        supabase_service.table("timetable_slots")
        .insert(payload.model_dump())
        .execute()
    )

    return {"data": result.data}