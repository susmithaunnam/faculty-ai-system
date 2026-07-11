from database import supabase

def find_best_substitute(faculty_id):

    # Find the subject taught by the faculty on leave
    faculty_subject = (
        supabase.table("faculty_subjects")
        .select("*")
        .eq("faculty_id", faculty_id)
        .execute()
        .data
    )

    if not faculty_subject:
        return None

    subject_id = faculty_subject[0]["subject_id"]

    # Find all faculty teaching the same subject
    candidates = (
        supabase.table("faculty_subjects")
        .select("*")
        .eq("subject_id", subject_id)
        .execute()
        .data
    )

    # Don't recommend the same faculty who is on leave
    candidates = [c for c in candidates if c["faculty_id"] != faculty_id]

    if not candidates:
        return {"message": "No substitute available"}

    best = candidates[0]

    user = (
        supabase.table("users")
        .select("*")
        .eq("id", best["faculty_id"])
        .execute()
        .data
    )[0]

    return {
        "faculty_id": user["id"],
        "faculty_name": user["name"],
        "subject_id": subject_id
    }