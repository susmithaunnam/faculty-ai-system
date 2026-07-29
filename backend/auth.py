from fastapi import Header, HTTPException, Depends
from database import supabase_service
 
 
def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Every protected endpoint depends on this. It reads the
    'Authorization: Bearer <token>' header the frontend sends,
    confirms with Supabase that the token is real and not expired,
    then looks up that person's profile (name, role, department).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
 
    token = authorization.replace("Bearer ", "")
 
    try:
        user_response = supabase_service.auth.get_user(token)
        user = user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
 
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
 
    profile = (
        supabase_service.table("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .execute()
        .data
    )
 
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this account")
 
    return profile
 
 
def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Use this instead of get_current_user on admin-only routes."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user