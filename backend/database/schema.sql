-- ============================================================
-- Faculty Leave Management & Automatic Timetable Adjustment
-- Database Schema (Supabase / PostgreSQL)
-- ============================================================
-- Run this once in: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. PROFILES  (extends Supabase auth.users — do NOT store
--    passwords or auth data here, Supabase Auth owns that)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'faculty' check (role in ('faculty', 'admin')),
  department_id uuid references departments(id),
  phone text,
  max_weekly_hours int default 20,   -- used later for workload scoring
  created_at timestamptz default now()
);

create index idx_profiles_department on profiles(department_id);

-- ============================================================
-- 3. SUBJECTS
-- ============================================================
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  department_id uuid references departments(id),
  created_at timestamptz default now()
);

-- ============================================================
-- 4. FACULTY_SUBJECTS  (who is qualified to teach what)
-- ============================================================
create table faculty_subjects (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  proficiency text default 'primary' check (proficiency in ('primary', 'secondary')),
  unique(faculty_id, subject_id)
);

create index idx_faculty_subjects_faculty on faculty_subjects(faculty_id);
create index idx_faculty_subjects_subject on faculty_subjects(subject_id);

-- ============================================================
-- 5. TIMETABLE_SLOTS  (base recurring weekly timetable —
--    this single table IS both the "college timetable" and
--    each "faculty timetable", just filtered differently)
-- ============================================================
create table timetable_slots (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id),
  section text not null,                 -- e.g. 'CSE-AIML-2A'
  subject_id uuid references subjects(id),
  faculty_id uuid references profiles(id),
  day_of_week int not null check (day_of_week between 1 and 6),  -- 1=Mon..6=Sat
  period_number int not null check (period_number between 1 and 8),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz default now(),
  unique(faculty_id, day_of_week, period_number),   -- one faculty, one place, per period
  unique(section, day_of_week, period_number)       -- one section, one class, per period
);

create index idx_timetable_faculty on timetable_slots(faculty_id, day_of_week, period_number);
create index idx_timetable_section on timetable_slots(section, day_of_week);

-- ============================================================
-- 6. LEAVE_REQUESTS  (date range, not single day)
-- ============================================================
create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  applied_at timestamptz default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  check (end_date >= start_date)
);

create index idx_leave_faculty on leave_requests(faculty_id, status);

-- ============================================================
-- 7. SUBSTITUTE_ALLOCATIONS
--    One row per (leave, actual calendar date, timetable slot)
--    since a multi-day leave hits a different slot each day.
-- ============================================================
create table substitute_allocations (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid references leave_requests(id) on delete cascade,
  timetable_slot_id uuid references timetable_slots(id),
  slot_date date not null,
  original_faculty_id uuid references profiles(id),
  substitute_faculty_id uuid references profiles(id),
  allocation_score numeric,
  allocation_reason jsonb,       -- scoring breakdown, e.g. {"same_dept":true,"workload":2,...}
  status text default 'auto_assigned' check (status in ('auto_assigned', 'confirmed', 'declined', 'manual_override')),
  created_at timestamptz default now()
);

create index idx_substitute_leave on substitute_allocations(leave_request_id);
create index idx_substitute_faculty on substitute_allocations(substitute_faculty_id, slot_date);

-- ============================================================
-- 8. SWAP_REQUESTS  (faculty-to-faculty hour swaps)
-- ============================================================
create table swap_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id),
  requester_slot_id uuid references timetable_slots(id),
  target_id uuid references profiles(id),
  target_slot_id uuid references timetable_slots(id),
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index idx_swap_requester on swap_requests(requester_id, status);
create index idx_swap_target on swap_requests(target_id, status);

-- ============================================================
-- HELPER: is_admin() — avoids RLS recursion on profiles table
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- TRIGGER: auto-create a profile row whenever someone signs up
-- via Supabase Auth (pass full_name/role in signup metadata)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'faculty')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table departments enable row level security;
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table faculty_subjects enable row level security;
alter table timetable_slots enable row level security;
alter table leave_requests enable row level security;
alter table substitute_allocations enable row level security;
alter table swap_requests enable row level security;

-- Departments / Subjects / Faculty_subjects / Timetable:
-- readable by any logged-in user, writable by admin only
create policy "departments_select" on departments for select using (auth.role() = 'authenticated');
create policy "departments_write" on departments for all using (is_admin()) with check (is_admin());

create policy "subjects_select" on subjects for select using (auth.role() = 'authenticated');
create policy "subjects_write" on subjects for all using (is_admin()) with check (is_admin());

create policy "faculty_subjects_select" on faculty_subjects for select using (auth.role() = 'authenticated');
create policy "faculty_subjects_write" on faculty_subjects for all using (is_admin()) with check (is_admin());

create policy "timetable_select" on timetable_slots for select using (auth.role() = 'authenticated');
create policy "timetable_write" on timetable_slots for all using (is_admin()) with check (is_admin());

-- Profiles: everyone can read (dashboards need to show names),
-- users can update their own row, admin can update any row
create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_update_admin" on profiles for update using (is_admin());

-- Leave requests: faculty see/manage their own, admin sees/manages all
create policy "leave_select_own" on leave_requests for select using (auth.uid() = faculty_id or is_admin());
create policy "leave_insert_own" on leave_requests for insert with check (auth.uid() = faculty_id);
create policy "leave_update_own_pending" on leave_requests for update
  using (auth.uid() = faculty_id and status = 'pending')
  with check (auth.uid() = faculty_id);
create policy "leave_update_admin" on leave_requests for update using (is_admin());

-- Substitute allocations: visible to the two faculty involved + admin
create policy "substitute_select" on substitute_allocations for select
  using (auth.uid() = original_faculty_id or auth.uid() = substitute_faculty_id or is_admin());
create policy "substitute_write_admin" on substitute_allocations for all using (is_admin()) with check (is_admin());

-- Swap requests: visible/manageable by requester, target, and admin
create policy "swap_select" on swap_requests for select
  using (auth.uid() = requester_id or auth.uid() = target_id or is_admin());
create policy "swap_insert_own" on swap_requests for insert with check (auth.uid() = requester_id);
create policy "swap_update_target" on swap_requests for update
  using (auth.uid() = target_id or auth.uid() = requester_id or is_admin());
