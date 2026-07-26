# Known Issues

## Runtime verification required — course visibility

The repository does not include production credentials, a policy export, the base courses/enrollments schema, or the `admin_create_course` RPC migration. Before marking COURSE-VISIBILITY-FIX-001 fully resolved, verify the new migration, course/enrollment rows, RPC defaults, and Vercel Supabase environment alignment using `COURSE_VISIBILITY_TEST_RESULTS.md`.
