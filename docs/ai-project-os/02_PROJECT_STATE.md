# Project State

## Current Status
The project is functional and successfully builds. The migration to `react-router-dom` (HashRouter) is now fully complete, with all legacy `window.location.hash`, `onNavigate`, and raw `<a href="#/...">` elements removed.

## Key Observations
1. **Compilation:** The project compiles successfully via Vite (`npm run build` succeeds).
2. **Type Checking:** `npm run lint` passes with zero errors, indicating solid TypeScript foundations.
3. **Routing:** Unified under `react-router-dom`. Internal navigation now exclusively uses `<Link to="...">` and `useNavigate()`. Supabase auth-recovery flows correctly retain their original hash checks.
4. **Data Layer:** Supabase is integrated, but some features (like `progress` calculation) contain hardcoded fallbacks (e.g., `const progress: number = 0;` in `MyCourses.tsx`).
