# Task Backlog

## High Priority
1. **Admin Authorization (RBAC)**: Remove hardcoded email checks (`m.najuib.nbe@gmail.com`) in `AdminDashboard.tsx` and `AdminSidebar.tsx`. Replace with role-based checks (e.g., checking `user.role` from auth metadata). Enforce `requiredRole="admin"` properly on `<ProtectedRoute>` inside `App.tsx`.

## Medium Priority
2. **Progress Tracking Sync**: Standardize progress tracking. `MyCoursesList.tsx` implements complex progress logic, while `MyCourses.tsx` hardcodes it to `0`. They should share a utility hook or service.
3. **Data Fetching Safety**: Abstract data fetching into React hooks (e.g., `useCourses`) to avoid repetitive `try/catch` and Supabase logic sprinkled across components.

## Low Priority
4. **Implement Quiz Logic**: Connect `Quiz.tsx` to the backend to persist grades/completion.
5. **Implement Certificate Generation**: Populate `CertificatePage.tsx` with dynamic user and course data.
