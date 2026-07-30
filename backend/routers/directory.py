from fastapi import APIRouter, Depends
from database import supabase_service
from auth import get_current_user

router = APIRouter(prefix="/directory", tags=["Directory"])


@router.get("/faculty")
def list_faculty(current_user: dict = Depends(get_current_user)):
    """Every faculty account - used for dropdowns (swap requests, timetable assignment, etc.)"""
    result = (
        supabase_service.table("profiles")
        .select("id, full_name, email, department_id, role")
        .eq("role", "faculty")
        .execute()
    )
    return {"data": result.data}


@router.get("/departments")
def list_departments(current_user: dict = Depends(get_current_user)):
    result = supabase_service.table("departments").select("*").execute()
    return {"data": result.data}


@router.get("/subjects")
def list_subjects(current_user: dict = Depends(get_current_user)):
    result = supabase_service.table("subjects").select("*").execute()
    return {"data": result.data}
