-- Cover the reviewer foreign key used for moderation audit lookups and deletes.
CREATE INDEX course_reviews_reviewed_by_idx
  ON public.course_reviews (reviewed_by)
  WHERE reviewed_by IS NOT NULL;
