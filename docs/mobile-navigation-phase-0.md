# Mobile navigation: Phase 0 baseline

This document is the release checklist for the mobile navigation work. Results should be recorded against the exact device, operating-system version, browser version, route, role, orientation, text scale, and network/CPU profile used.

## Reproduction matrix

- Public navigation: authenticated and signed-out states.
- Student navigation: `/dashboard`, `/my-courses`, `/profile`, and `/certificate`.
- Administration navigation: overview, courses, course editors/builders, lessons, and users.
- Viewports: 320×568, 360×640, 390×844, tablet, landscape phone, and split-screen where supported.
- Browsers: current iOS Safari/WebKit, Android Chrome, desktop Chromium responsive emulation, and every browser in the supported-browser policy.
- Conditions: browser chrome expanded/collapsed, OS text enlargement, 200% browser zoom, virtual keyboard visible, reduced motion, slow CPU, slow network, offline transition, and session expiration.
- Interactions: single tap, rapid repeated taps, backdrop tap, close control, Escape, link activation, browser Back/Forward, rotation, breakpoint crossing, and logout success/failure.

## Phase 1 acceptance criteria

- One activation opens the drawer and every subsequent activation remains responsive.
- The drawer fits the visible mobile viewport when browser chrome changes or the device rotates.
- Header and account actions remain fixed while an overflowing navigation region scrolls.
- Sign Out remains visible or reachable and clears the device bottom safe area.
- A student navigation selection closes the drawer before the destination is presented.
- Escape and the backdrop close authenticated drawers.
- Background scrolling is disabled while an authenticated drawer is open and restored on close/unmount.
- The profile route provides a visible, labelled mobile navigation trigger.
- No closed drawer or stale backdrop intercepts pointer input.
- Desktop sidebar behavior is unchanged at the `lg` breakpoint.

## Evidence to capture

- Before/after screenshots for the shortest portrait viewport and landscape.
- A recording of rapid open/close and route navigation.
- Browser-console errors and long tasks observed during reproduction.
- Automated build/type-check results and the manual device/browser results above.
- Any remaining failure with exact reproduction steps and severity.

## Repository baseline review

- The responsive drawers retain a legacy `100vh` fallback before the dynamic `100dvh` size so older browsers do not render an unconstrained drawer.
- An open mobile drawer is closed when the viewport crosses into the desktop layout, which also releases the body scroll lock instead of carrying stale mobile state into desktop navigation.
- Production build, bundle-budget, server-test, and whitespace checks are the automated baseline for this phase.
- Authenticated screenshots, touch recordings, iOS Safari, and Android Chrome checks remain required manual evidence; they must not be marked complete without a browser session on the corresponding device.
