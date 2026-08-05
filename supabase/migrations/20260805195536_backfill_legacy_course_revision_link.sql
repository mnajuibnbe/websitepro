-- Phase B-4 targeted backfill: 'Skin and Hair Cair Diploma Part 1' predates the
-- revision-lifecycle migration and had NULL submitted_revision_id/approved_revision_id
-- despite being published + approved, which broke lesson loading for enrolled students.
-- This links it to a snapshot of its CURRENT, unchanged, live state -- no content,
-- structure, cover, or instructor changes. The full readiness gate (admin_finalize_course_for_review)
-- is intentionally bypassed here since it enforces new-submission content-completeness
-- rules unrelated to this bug; those gaps are tracked separately in KNOWN_ISSUES.md.
DO $$
DECLARE
  v_admin_id CONSTANT uuid := 'ac842aa4-c3f1-425b-b06a-ef20be93c91f';
  v_course_id CONSTANT uuid := 'e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0';
  v_revision public.course_revisions;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_admin_id::text, true);

  v_revision := public.create_course_revision(v_course_id);

  UPDATE public.courses
  SET submitted_revision_id = v_revision.id,
      approved_revision_id = v_revision.id
  WHERE id = v_course_id;

  INSERT INTO public.course_review_events (course_id, actor_id, event_type, notes, revision_id)
  VALUES (
    v_course_id,
    v_admin_id,
    'approved',
    'Backfill (Phase B-4 cleanup): course predated the revision-lifecycle migration and had NULL submitted/approved_revision_id, which blocked lesson content loading for enrolled students. Linked to a snapshot of the current, unchanged, live course/content state. No content, structure, cover, or instructor changes made.',
    v_revision.id
  );
END $$;
