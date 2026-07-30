from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from auth import get_current_user
from routers import leave, timetable, swaps, substitutes, directory, admin

app = FastAPI(title="Smart Faculty Leave Management System")

# Lets the frontend (running on a different port/domain) call this API.
# Tighten allow_origins to your real frontend URL before final deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leave.router)
app.include_router(timetable.router)
app.include_router(swaps.router)
app.include_router(substitutes.router)
app.include_router(directory.router)
app.include_router(admin.router)


@app.get("/")
def home():
    return {"message": "Faculty AI System Running 🚀"}


@app.get("/test-db")
def test_database():
    response = supabase.table("profiles").select("*").execute()
    return {"data": response.data}


@app.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Tells the frontend who's logged in and what role they have."""
    return {"data": current_user}