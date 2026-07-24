# Security Audit

## Observations
1. **Authentication:** Properly enforced using Supabase Auth contexts. Unauthenticated users are redirected.
2. **Admin Authorization:** In `AdminDashboard.tsx`, authorization relies on a hardcoded email string (`m.najuib.nbe@gmail.com`). This is brittle and insecure for scalable deployment. It should rely on Supabase custom claims, JWT metadata, or a secure `user_roles` table check enforced via Row Level Security (RLS).
3. **Database RLS:** The client performs direct `.from('enrollments').select('*')` operations. Security relies entirely on Postgres RLS policies which are UNKNOWN as they exist on the server, not in the codebase repository.
