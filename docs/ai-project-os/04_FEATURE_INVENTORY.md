# Feature Inventory

## Fully Implemented
- **Supabase Authentication**: Login, Register, Forgot Password, Update Password, Protected Routes.
- **Locale direction**: The application UI is permanently English and LTR. Arabic is permitted only in user-generated course content or titles and does not change layout or icon direction.
- **Global Auth Context**: Manages user session state globally.

## Partially Implemented
- **My Courses**: Lists enrolled courses via Supabase UUID relationships, but progress calculation is stubbed (`const progress: number = 0;`).
- **Course Detail & Player**: Displays course information and allows playing lessons, but actual progress mutation (saving completion state) needs verification.
- **Admin Dashboard**: Has basic structure, but auth-checks rely on hardcoded emails (e.g., `m.najuib.nbe@gmail.com`).

## UI Only / Mocked
- **Quiz System**: `Quiz.tsx` has UI but does not fully validate against backend databases.
- **Certificates**: `CertificatePage.tsx` acts primarily as a UI display.

## Broken / Inconsistent
- **Routing/Navigation**: Mixed routing paradigms cause potential render cycle bugs or unexpected behaviors when interacting with browser history.
