from fastapi import FastAPI
from database import supabase

app = FastAPI(title="Smart Faculty Leave Management System")

@app.get("/")
def home():
    return {"message": "Faculty AI System Running 🚀"}

@app.get("/test-db")
def test_database():
    response = supabase.table("profiles").select("*").execute()
    return {"data": response.data}