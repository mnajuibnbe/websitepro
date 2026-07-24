# Project State

## Current Status
The project is functional and successfully builds. The migration to `react-router-dom` (HashRouter) is complete. The Authentication layer has been fully unified under Supabase Auth, removing the dual-state (Mock Local + Supabase) sync issues.

## Key Observations
1. **Compilation:** The project compiles successfully via Vite (`npm run build` succeeds).
2. **Type Checking:** `npm run lint` passes with zero errors, indicating solid TypeScript foundations.
3. **Routing:** Unified under `react-router-dom`. Internal navigation now exclusively uses `<Link to="...">` and `useNavigate()`. Supabase auth-recovery flows correctly retain their original hash checks.
4. **Authentication:** Supabase is now the single source of truth for authentication. `AuthContext` manages all session states, providing `user` and `session` context across the app. Legacy mock `auth_token` in `localStorage` has been removed.
5. **Data Layer:** Supabase is integrated, but some mock API functions (`src/services/api.ts`) still exist, which may receive the Supabase access token for testing purposes.
