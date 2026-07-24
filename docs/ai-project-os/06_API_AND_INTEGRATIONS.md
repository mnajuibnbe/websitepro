# API and Integrations

## Primary Integrations
1. **Supabase**:
   - Used for Authentication (`supabase.auth`).
   - Used for Database access via PostgREST (`supabase.from(...)`).
   - Configured in `src/lib/supabase.ts` using Vite environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Absence of Custom Backend
There is no custom Express/Node.js backend in `src/`. The application relies entirely on Supabase for data and authentication. 
