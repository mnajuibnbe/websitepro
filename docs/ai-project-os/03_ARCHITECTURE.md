# Architecture

## Application Structure
- `src/App.tsx`: Main entry point declaring the `HashRouter`, `AuthProvider`, and standard React Router `<Route>` components.
- `src/pages/`: Contains page-level components.
- `src/components/`: Contains reusable UI widgets and sections.
- `src/lib/`: Contains utility configurations, notably `supabase.ts`.

## Routing Architecture
The app uses a strict `react-router-dom` architecture utilizing `HashRouter`.
- **Navigation Components:** Internal routing is managed using `<Link>` components to maintain correct history context.
- **Programmatic Navigation:** Uses `useNavigate()` securely within components.
- **Exception Flow:** Password recovery redirects emitted by Supabase are trapped directly in `App.tsx` by inspecting `location.hash` and `location.search` to mount the `<UpdatePassword />` component.

## Authentication & Security Architecture
- **Single Source of Truth:** `AuthContext.tsx` integrates purely with Supabase Auth (`getSession`, `onAuthStateChange`). All `user` state and session handling are centralized.
- **Token Management:** The app utilizes Supabase's built-in session storage. Manual mock tokens (`auth_token`) have been removed.
- **Route Protection:** Route protection is managed via `<ProtectedRoute>`.
- **Role Base Access Control (RBAC):** Admin routes (e.g., `/admin`) are currently `Authenticated only` at the routing level. `requiredRole="admin"` logic is implemented but not strictly enforced on the routes themselves. Authorization heavily relies on hardcoded email checks within the frontend components.
