from fastapi import APIRouter, Depends
from database import supabase_service
from auth import require_admin
from schemas import FacultySubjectAssign

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/faculty-subjects")
def assign_faculty_subject(payload: FacultySubjectAssign, admin: dict = Depends(require_admin)):
    """Records that a faculty member is qualified to teach a subject.
    This is what the substitute engine checks when finding candidates."""
    result = supabase_service.table("faculty_subjects").insert(payload.model_dump()).execute()
    return {"data": result.data}
