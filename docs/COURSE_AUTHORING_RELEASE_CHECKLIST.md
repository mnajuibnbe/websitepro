# Course authoring production release checklist

## Automated gate

Run `npm run test:course-authoring-release`, the TypeScript and frontend suites, production build, and every SQL file under `supabase/tests` against a migration-applied staging database. Deploy migrations in filename order and do not expose the new UI before all RPCs exist.

## Required staging journeys

1. Student applies to become an instructor; admin requests changes and then approves.
2. Instructor creates an owned draft, uploads one cover, builds sections and each supported lesson type, and cannot publish directly.
3. Video metadata resolves duration and the public course total updates without a manual duration field.
4. Student sees only published curriculum metadata, exhausts a quiz's configured attempts, and submits an assignment; instructor grades or requests revision.
5. Instructor submits a ready course; admin requests changes, approves, publishes, unpublishes, and verifies the review audit history.
6. Admin searches enrollments, removes access, restores access, and confirms order, progress, quiz, and assignment history remain intact.

## Operational checks

- Confirm RLS with anonymous, student, instructor, course-owner, unrelated-instructor, and admin sessions.
- Confirm storage MIME/size policies and lifecycle cleanup for abandoned course covers.
- Monitor RPC errors by SQLSTATE, media-inspection latency/failures, review queue age, and assignment/quiz submission failures.
- Back up the production database before migration and document rollback as application rollback plus forward-fix migrations; never delete learning or financial history.
- Verify keyboard-only use, screen-reader names, 320px mobile layout, RTL content, slow-network loading, empty, error, conflict, and retry states.
