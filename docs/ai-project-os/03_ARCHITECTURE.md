# Architecture

## Application Structure
- `src/App.tsx`: Main entry point declaring the `HashRouter`, `AuthProvider`, and `AppContent` which maps standard React Router `<Route>` components.
- `src/pages/`: Contains page-level components.
- `src/components/`: Contains reusable UI widgets and sections.
- `src/lib/`: Contains utility configurations, notably `supabase.ts`.

## Routing Architecture (In transition)
The app is currently transitioning to `react-router-dom`, utilizing `HashRouter`.

### Inconsistencies
The codebase uses four different paradigms for navigation simultaneously:
1. `useNavigate()` hook from `react-router-dom` (The intended architecture).
2. The `onNavigate` prop passed down from `AppContent` (Legacy wrapper acting as an intermediary).
3. Direct DOM manipulation: `window.location.hash = '#/...'` (Legacy).
4. Direct HTML links: `<a href="#/...">` (Legacy).

### The `onNavigate` anti-pattern
`App.tsx` defines a function `onNavigate` that strips `#/` prefixes and invokes `navigate()`. This prop is drilled into almost every page component, which is unnecessary when `useNavigate` is globally available inside the `<HashRouter>` context.
