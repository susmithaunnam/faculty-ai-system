from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from routers import leave, timetable, swaps

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


@app.get("/")
def home():
    return {"message": "Faculty AI System Running 🚀"}


@app.get("/test-db")
def test_database():
    response = supabase.table("profiles").select("*").execute()
    return {"data": response.data}