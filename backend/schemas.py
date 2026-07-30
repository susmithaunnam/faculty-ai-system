from pydantic import BaseModel
from datetime import date
from typing import Optional


class LeaveRequestCreate(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None


class TimetableSlotCreate(BaseModel):
    department_id: str
    section: str
    subject_id: str
    faculty_id: str
    day_of_week: int      # 1 = Monday ... 6 = Saturday
    period_number: int    # 1 through 8
    start_time: str       # e.g. "09:00"
    end_time: str          # e.g. "09:50"
    room: Optional[str] = None


class SwapRequestCreate(BaseModel):
    requester_slot_id: str
    target_id: str
    target_slot_id: str


class SubstituteOverride(BaseModel):
    new_substitute_faculty_id: str


class FacultySubjectAssign(BaseModel):
    faculty_id: str
    subject_id: str
    proficiency: str = "primary"   # "primary" or "secondary"