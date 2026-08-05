-- Phase B-4: resolve gap #4 on 'Skin and Hair Cair Diploma Part 1' (e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0).
-- Section 1 was is_published=false while its 3 lessons were individually is_published=true,
-- causing LessonPlayer.tsx (which requires both the lesson AND its parent section to be
-- published) to report "Lesson not found" for those 3 lessons despite them being RLS-visible.
-- Publishing the section aligns it with the lesson-level flags already marking this content ready.
-- Confirmed legacy test/example data with no business stakes; full content review is a separate
-- pre-launch phase.
UPDATE public.course_sections
SET is_published = true
WHERE id = 'a6809254-a198-43bc-ac18-8dd0df22edd4'
  AND course_id = 'e2b9b9dd-693c-48d4-a3e9-8c1b2cfe80d0';
