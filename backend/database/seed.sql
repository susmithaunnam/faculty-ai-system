-- ============================================================
-- Seed data — run AFTER schema.sql
-- Only departments + subjects here, since faculty_subjects and
-- timetable_slots need real auth.users IDs, which don't exist
-- until you've created faculty/admin accounts via Supabase Auth
-- (or your app's signup flow) in Phase 2.
-- ============================================================

insert into departments (name, code) values
  ('Computer Science & Engineering (AI & ML)', 'CSE-AIML'),
  ('Computer Science & Engineering', 'CSE'),
  ('Electronics & Communication Engineering', 'ECE'),
  ('Information Technology', 'IT');

insert into subjects (name, code, department_id) values
  ('Database Management Systems', 'DBMS', (select id from departments where code = 'CSE-AIML')),
  ('Data Structures & Algorithms', 'DSA', (select id from departments where code = 'CSE-AIML')),
  ('Machine Learning', 'ML', (select id from departments where code = 'CSE-AIML')),
  ('Operating Systems', 'OS', (select id from departments where code = 'CSE-AIML')),
  ('Computer Networks', 'CN', (select id from departments where code = 'CSE-AIML'));

-- ------------------------------------------------------------
-- NEXT STEP (do this after Phase 2 auth is wired up):
-- 1. Create a few faculty accounts + one admin account via
--    Supabase Auth (Dashboard -> Authentication -> Add User,
--    or your app's signup form).
-- 2. Copy their UUIDs from the profiles table.
-- 3. Insert rows into faculty_subjects and timetable_slots
--    referencing those UUIDs, e.g.:
--
--    insert into faculty_subjects (faculty_id, subject_id)
--    values ('<uuid-of-faculty>', (select id from subjects where code='DBMS'));
-- ------------------------------------------------------------
