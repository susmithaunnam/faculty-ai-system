from fastapi import FastAPI
from database import supabase

app = FastAPI(
    title="Smart Faculty Leave Management System"
)

@app.get("/")
def home():
    return {
        "message": "Faculty AI System Running 🚀"
    }

@app.get("/test-db")
def test_database():

    response = supabase.table("users").select("*").execute()

    return {
        "data": response.data
    }
@app.get("/allocate-substitute")
def allocate_substitute():
    return {
        "recommended_faculty": "Dr. Priya",
        "score": 100,
        "reason": [
            "Same Subject",
            "Same Department",
            "Available",
            "Lowest Workload"
        ]
    }