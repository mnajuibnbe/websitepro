# Task Backlog

## High Priority
1. **Routing Unification**: 
   - Remove `window.location.hash` mutations.
   - Replace `<a href="#/...">` tags with `<Link>` components from `react-router-dom`.
   - Remove the `onNavigate` prop pipeline originating from `App.tsx` and rely solely on `useNavigate`.
2. **Admin Authorization**: Remove hardcoded email checks (`m.najuib.nbe@gmail.com`) in `AdminDashboard.tsx` and replace with role-based checks (e.g., checking `user.role` from auth metadata or a `users` table).

## Medium Priority
3. **Progress Tracking Sync**: Standardize progress tracking. `MyCoursesList.tsx` implements complex progress logic, while `MyCourses.tsx` hardcodes it to `0`. They should share a utility hook or service.
4. **Data Fetching Safety**: Abstract data fetching into React hooks (e.g., `useCourses`) to avoid repetitive `try/catch` and Supabase logic sprinkled across components.

## Low Priority
5. **Implement Quiz Logic**: Connect `Quiz.tsx` to the backend to persist grades/completion.
6. **Implement Certificate Generation**: Populate `CertificatePage.tsx` with dynamic user and course data.
