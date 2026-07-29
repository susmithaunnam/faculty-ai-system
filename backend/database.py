import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Used to validate incoming user login tokens (JWTs).
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Used for all real database reads/writes, AFTER the backend has
# confirmed who the caller is (see auth.py). This connection has
# full access and skips Row Level Security — so every route that
# uses it MUST check ownership/role itself in Python. RLS still
# protects the database as a second, independent line of defense.
supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)