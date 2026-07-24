# Architecture Document

## Tech Stack
- Frontend: React 18, React Router v6, Tailwind CSS, Vite.
- Backend/Services: Supabase (Auth currently, DB planned).
- UI Components: Lucide React (Icons).

## Project Structure
`src/`
- `components/`: Reusable UI elements (e.g. `auth/RequireAuth.tsx`, `auth/RequirePermission.tsx`).
- `contexts/`: React Context providers (e.g., `AuthContext.tsx`).
- `hooks/`: Custom React hooks (e.g., `useAuthorization.ts`).
- `pages/`: Route-level components.
- `services/`: API mocking logic (to be replaced by Supabase Data API).
- `auth/`: Authorization definitions (e.g., `permissions.ts`).
- `types/`: Global TS definitions (e.g., `auth.ts`).

## Core Concepts
- **Authentication**: Handled via `supabase.auth`. Stored globally via `AuthContext`.
- **Authorization (RBAC)**: Centralized logic based strictly on Supabase `app_metadata.role`.
  - Defined in `src/types/auth.ts` and `src/auth/permissions.ts`.
  - Roles map to broad capabilities (`student`, `instructor`, `admin`).
  - `RequireAuth` acts as the primary Route guard.
  - `RequirePermission` acts as the primary Component guard.
- **Data Flow**: Top-down state using Contexts (e.g. `AuthContext`), passing variables down. Mock DB service encapsulates API layers (`src/services/api.ts`).
- **Responsive Design**: Mobile-first approaches heavily utilizing Tailwind grid and flex utilities. Special 403 `UnauthorizedPage` respects smaller 360px viewports without scrolling.
