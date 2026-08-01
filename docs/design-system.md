# Design system foundation

## Page grid

`PageContainer` is the only page-level horizontal container. It uses the
`page` container token (80rem / Tailwind `max-w-7xl`) and shared responsive
gutters of 1rem, 1.5rem, and 2rem. Navbar, footer, public sections, student
screens, learning screens, and administration screens must use it.

Intentionally narrow reading measures (for example an article or legal text)
may be placed *inside* `PageContainer`. They must not redefine the page grid or
own the viewport gutters.

## Directional icons

The current product contract is English with `dir="ltr"`:

- Back, previous, and breadcrumb ancestry point left.
- Forward, next, continue, and breadcrumb progression point right.
- Vertical disclosure controls use up/down chevrons and do not change.

Directional meaning must come from the action, not from the icon's visual
position in a flex row. This application does not support bidirectional layout:
do not add direction-aware icon abstractions, `rtl:` variants, conditional
direction CSS, or automatic icon flipping. Arabic text may appear only as
user-generated course content or titles and remains inside the LTR interface.

## Tokens

Global colors, font families, page sizing, gutters, display text, microcopy,
and brand/eyebrow tracking are defined once in `src/index.css` under `@theme`.
Use the generated semantic Tailwind utilities instead of repeating arbitrary
pixel, color, or tracking values.
