# Testing

## Available suites

- `npm test` runs the existing server tests.
- `npm run test:frontend` runs dependency-free structural React tests through Node, `tsx`, and React server rendering.
- `npm run test:browser-smoke` builds the production application, starts Vite preview, and verifies that the SPA document and browser entry bundle are deliverable.
- `npm run build:check` builds the client/server bundles and enforces bundle budgets.

## Frontend test helpers

`src/test/renderFrontend.tsx` renders components inside a memory router for structural tests. `src/test/fixtures.ts` provides stable student/admin data and the initial mobile viewport matrix. These helpers deliberately avoid live Supabase sessions and production credentials.

The mobile drawer regression suite verifies student/admin navigation structure, scrollable content, safe-area footer treatment, open/closed backdrop behavior, closed-state inertness and pointer blocking, Escape classification, gesture-safe backdrop dismissal, the desktop breakpoint contract, and nested/idempotent scroll restoration. Effects that require a live DOM remain assigned to future real-browser coverage rather than being simulated inaccurately.

## Current browser limitation

The execution environment blocks npm registry access and has no Chromium or WebKit executable. The production-delivery smoke test verifies the artifact and HTTP delivery path, but it is not a replacement for DOM interaction or real-browser testing. When the approved registry or preinstalled browser tooling becomes available, add Vitest/JSDOM/Testing Library for interactions and Playwright projects for Chromium and WebKit; retain this smoke test as the fast delivery check.
