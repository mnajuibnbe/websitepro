# Phase 1 Plan: Design System Foundation and Global UI Consistency

## Objective

Establish one source of truth for page width, responsive gutters, shared visual
tokens, and directional icons so the navbar and every application surface align
to the same grid.

The application contract is permanently English and LTR. Arabic may appear
only in user-generated course content or titles. It must not trigger a layout
direction change, CSS variant, conditional alignment, or icon inversion.

## Scope

1. Audit page, section, layout, and navigation wrappers for competing
   `max-w-*`, `mx-auto`, and responsive padding combinations.
2. Select the dominant `max-w-7xl` width as the canonical 80rem page grid.
3. Define shared page-width and gutter tokens in the Tailwind v4 theme.
4. Create `PageContainer` as the only page-level horizontal container.
5. Replace page-shell wrappers across public, student, learning, quiz,
   certificate, administration, navbar, footer, and homepage sections.
6. Preserve intentionally narrow article, form, and dialog measures only as
   inner constraints within the canonical page grid.
7. Audit all left/right arrow and chevron uses and apply the LTR convention:
   back/previous points left; next/forward/breadcrumb progression points right.
8. Remove RTL-only comments, `rtl:` variants, and inverted icon assumptions.
9. Consolidate repeated layout, semantic color, display text, microcopy, and
   tracking values into the Tailwind theme.
10. Document the page-grid, token, and permanent LTR contracts.

## Explicit exclusions

- Do not modify the hardcoded course-category data in `FilterSidebar.tsx`.
- Do not fix the duplicate category-shortcut text in `CoursesHeader.tsx`.
- Do not add localization, bidirectional layout, or Arabic UI behavior.
- Do not deploy or change hosting configuration as part of this phase.

## Acceptance criteria

- Navbar, footer, pages, layouts, and major sections share `PageContainer`.
- No competing `max-w-7xl`, `max-w-6xl`, or `max-w-[1200px]` page shells remain.
- Source UI code contains no RTL-specific layout logic or comments.
- Every directional icon communicates its LTR action correctly.
- The canonical layout and repeated visual values are Tailwind theme tokens.
- Production frontend build succeeds.
- Frontend test suite passes.
- Any unrelated pre-existing verification failure is recorded separately.

## Verification plan

- Run a repository-wide static scan for legacy canonical-width shells.
- Run a repository-wide static scan for RTL implementation references.
- Run the TypeScript frontend test suite.
- Run the Vite production build.
- Run the standalone TypeScript check and report any unchanged baseline issue.
- Confirm the two Phase 6 data issues remain untouched.
