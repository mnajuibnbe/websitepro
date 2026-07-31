# Tutiba project operating guide

## Environment

- Frontend: React 19, TypeScript, Vite, Tailwind CSS.
- Local development server: Express + Vite from `server.ts`.
- Database and authentication: Supabase project `nhknhibsloirpffndzcd`.
- Project MCP configuration: `.codex/config.toml` defines the `supabase` MCP server for this project.
- Local secrets belong only in `.env.local`. Never print, commit, or copy the service-role key into client-side code.

## Before changing the database

1. Use the Supabase MCP tools to inspect tables, migrations, logs, and advisors.
2. Confirm the target is project `nhknhibsloirpffndzcd`.
3. Prefer a versioned migration for schema, policy, function, trigger, or index changes. Do not hand the user a SQL script when the authenticated MCP tool can safely apply the requested change.
4. Keep data reads read-only unless the task explicitly asks to mutate data.
5. Preserve and verify RLS. Never grant anonymous access to admin or `SECURITY DEFINER` functions unless the task explicitly requires it and the security impact has been reviewed.

## Verification

- Run the smallest relevant tests, then `npm run lint` and `npm run build` when the runtime is available.
- For database work, re-run the relevant query plus Supabase security and performance advisors after the change.
- For UI work, run the local site and verify the affected flow in the browser against the connected Supabase project.
- Treat missing `SUPABASE_SERVICE_ROLE_KEY`, `STREAMING_TOKEN_SECRET`, or `GOOGLE_SERVICE_ACCOUNT_JSON` as a server-start blocker; frontend-only Vite preview may still be used when appropriate.

## Deployment safety

- Do not deploy merely because implementation is complete. Deployment requires an explicit user request.
- Before any deployment, verify the production target, environment variables, build, relevant tests, database migration state, and Supabase advisor results.
- Report unresolved security warnings that affect the changed surface before deployment.
