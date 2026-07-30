SELECT id,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='course-covers';
SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authors delete own course covers';
SELECT tgname FROM pg_trigger WHERE tgname='trg_courses_cleanup_cover' AND NOT tgisinternal;
