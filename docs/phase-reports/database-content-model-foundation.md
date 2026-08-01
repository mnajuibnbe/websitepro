# Database & Content Model Foundation

Migration: `20260801000000_database_content_model_foundation.sql`

## Content modeling decision

`learning_outcomes`, `requirements`, and `target_audience` are JSONB arrays of
non-empty strings. Array position is the display order. They are value objects
with no item-level icon, permissions, ownership, or lifecycle, so normalized
child rows would add joins and three duplicate schemas without adding useful
behavior. Database checks reject objects, numbers, blank strings, and non-array
values. If item-level metadata is introduced later, each array can be migrated
to an ordered child table without changing the meaning of existing content.

## Category migration

The existing `course_categories` table remains the canonical taxonomy and
`courses.category` now has a foreign key to it. The migration normalizes known
English spacing/hyphen/plural variants and the known Arabic skin/hair labels.
Blank values become `NULL`.

Values that do not map unambiguously are copied verbatim to
`course_category_migration_issues` and the live course is set to uncategorized
before the foreign key is added. This avoids blessing typos as new canonical
categories and avoids losing the original value. After deployment, run:

```sql
select *
from public.course_category_migration_issues
order by detected_at, course_id;
```

Resolve every returned row by setting the course to a value from
`course_categories`, then remove its resolved audit row. The repository cannot
know which values exist only in a deployed database, so the migration itself is
the authoritative mismatch report.

## Public stats and privacy

`get_public_courses_with_stats()` returns a JSON representation of every
published, public-catalogue course plus `lessons_count`, `average_rating`,
`review_count`, and `enrolled_student_count`. Lesson counts include published,
non-deleted lessons; ratings include approved reviews; student counts include
distinct active enrollments. A fixed-search-path `SECURITY DEFINER` RPC is used
so aggregate counts can be exposed without granting public row access to lessons
or enrollments. Its explicit course predicate mirrors the public catalogue RLS
policy (`status = 'published'` and public visibility).

## Payment proof storage convention

The private bucket is `payment-proofs`. Browser uploads must use
`<auth-user-id>/<generated-file-name>.<extension>`. JPEG, PNG, and WebP files up
to 10 MiB are accepted. Students can access only their own prefix; admins can
access every object. `proof_image_url` should store the private object path (or
an application-owned reference), not a permanently public URL.

## Deployment and advisor status

The migration is deployed to live project `nhknhibsloirpffndzcd`. Live
verification, category mismatches, build results, and the before/after Security
and Performance Advisor output are recorded in `phase-2-report.md`.
