# Course authoring contract

This document is the canonical product and engineering contract for course authoring. UI labels may be translated, but stored values and state transitions must not be redefined in individual screens.

## Lifecycle

Course authoring and catalog visibility are separate concerns.

| Authoring state | Review state | Meaning |
| --- | --- | --- |
| `draft` | `not_submitted` | Editable work that has never been submitted. |
| `in_review` | `submitted` | Frozen for instructor publication changes while an admin reviews it. |
| `draft` | `changes_requested` | Returned to the owner with reviewer feedback. |
| `approved` | `approved` | Approved content; approval publishes the immutable revision automatically. |
| `draft` | `rejected` | Rejected submission that can be revised and resubmitted. |
| `archived` | any | Hidden from normal authoring lists without destroying learning or financial history. |

Only admins finalize admin-authored drafts, approve, reject, unpublish, archive, restore, or reassign a course. Approval and publication are one atomic decision. An approved instructor may create and edit owned drafts, preview them, and submit them for review. Students never receive authoring access.

Visibility is independent: `public` appears in the catalog, `unlisted` requires a direct link, and `private` is limited to eligible enrolled learners. A published course must also be approved.

## Supported lesson content

New lessons support exactly five content types:

1. `video`
2. `pdf`
3. `external_link`
4. `quiz`
5. `assignment`

Legacy article, audio, embed, and live-session records remain readable during migration, but must not be silently converted or created by current authoring interfaces. Every type has a type-specific completion rule and validation contract.

## Mutation boundary

Privileged writes must use audited, transactional database RPCs or server endpoints. Browser code must not implement multi-row ordering, ownership checks, slug collision handling, or schema fallbacks. Every nested mutation verifies that course, section, lesson, and related content IDs belong to the same course.

Slugs are backend-generated, collision-safe implementation details. Normal authoring UI must not require or display them.

Soft deletion is the default for authored content. Financial records, enrollments, progress, submissions, and quiz attempts are not cascade-deleted by routine authoring operations.

## Concurrency and errors

Updates carry the last observed `version`. A stale update returns a conflict instead of overwriting another editor. Domain errors must distinguish validation, authorization, conflict, invalid transition, dependency, and not-found failures without exposing database internals.

## Canonical screens

The supported workflow is:

1. Course details.
2. Instructor and pricing.
3. One cover image.
4. Curriculum sections and lessons.
5. Review and publish.

The curriculum builder has one **Add lesson** entry point. It opens the canonical lesson editor; quick and advanced forms must not maintain separate persistence behavior.
