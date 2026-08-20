import assert from 'node:assert/strict';
import test from 'node:test';
import { CurriculumAccordion, PublicCurriculumSection } from '../components/course-detail/CurriculumAccordion';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';
import { renderFrontend } from './renderFrontend';
import { CourseEditorGuide } from '../components/admin/course/CourseEditorGuide';
import { CategoryField } from '../components/admin/course/CategoryField';
import { CourseInstructor } from '../components/course-detail/CourseInstructor';
import { AddCurriculumItemDialog } from '../components/admin/curriculum/AddCurriculumItemDialog';
import { DynamicListEditor } from '../components/admin/course/DynamicListEditor';
import { LearningOutcomes } from '../components/course-detail/LearningOutcomes';
import { Requirements } from '../components/course-detail/Requirements';
import { WhoIsThisFor } from '../components/course-detail/WhoIsThisFor';
import { AdminStudentReviews } from '../pages/admin/AdminStudentReviews';
import { CourseReviews } from '../components/course-detail/CourseReviews';
import { CoursePerformancePanel } from '../components/admin/course/CoursePerformancePanel';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

const adminAuthContext: AuthContextType = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin', joinedAt: '2026-01-01' },
  session: null,
  token: null,
  isAuthenticated: true,
  isLoading: false,
  sessionError: null,
  retrySession: async () => {},
  refreshSession: async () => {},
  login: async () => {},
  register: async () => ({ user: null, session: null, requiresEmailConfirmation: false }),
  logout: async () => true,
};

const sections: PublicCurriculumSection[] = [{
  id: 'section-1', title: 'Getting started', description: 'Course orientation', order_index: 0,
  lesson_count: 2, total_minutes: 25,
  lessons: [
    { id: 'lesson-1', title: 'Welcome video', content_type: 'video', estimated_minutes: 25, is_preview: true, video_url: 'https://youtu.be/12345678901', order_index: 0 },
    { id: 'lesson-2', title: 'Course guide', content_type: 'pdf', estimated_minutes: null, is_preview: false, order_index: 1 },
  ],
}];

test('renders authored curriculum descriptions and an actionable free preview', () => {
  const markup = renderFrontend(<CurriculumAccordion sections={sections} />);
  assert.match(markup, /Getting started/);
  assert.match(markup, /Welcome video/);
  assert.match(markup, /2 lessons · 25 min of video/);
  assert.match(markup, /Course orientation/);
  assert.match(markup, /Free preview/);
  assert.doesNotMatch(markup, /12345678901|content_url/);
});

test('unsaved changes dialog exposes both recovery choices', () => {
  const markup = renderFrontend(<ConfirmDialog open title="Discard unsaved changes?" description="Not saved" confirmLabel="Discard changes" cancelLabel="Keep editing" onCancel={() => {}} onConfirm={() => {}} />);
  assert.match(markup, />Keep editing</);
  assert.match(markup, />Discard changes</);
  assert.match(markup, /role="alertdialog"/);
});

test('guided course setup exposes progress without changing the hash route', () => {
  const markup = renderFrontend(<CourseEditorGuide steps={[{ id: 'basics', label: 'Basics', description: 'Course details', complete: true }, { id: 'cover', label: 'Cover', description: 'Course image', complete: false }]} />);
  assert.match(markup, /role="progressbar"/);
  assert.match(markup, /aria-valuenow="50"/);
  assert.doesNotMatch(markup, /href="#basics"/);
  assert.match(markup, /type="button"/);
  assert.match(markup, /1 of 2/);
});

test('category field loads governed categories from the catalog source', () => {
  const markup = renderFrontend(<CategoryField value="Skin care" onChange={() => {}} />);
  assert.match(markup, /Loading categories/);
  assert.doesNotMatch(markup, /type="text"/);
});

test('course Search Console performance panel starts loading for an existing course id', () => {
  const markup = renderFrontend(<CoursePerformancePanel courseId="5d1436b8-229c-4853-ba75-4756ce52ada0" />);
  assert.match(markup, /Loading Search Console data/);
});

test('sales page instructor block renders only assigned public profile data', () => {
  const markup = renderFrontend(<CourseInstructor instructor={{ professional_name: 'Dr. Samira', bio: 'Evidence-based educator with extensive professional experience across clinical teaching and cosmetic science.', expertise: ['Cosmetic science'], credentials: 'Board-certified professional educator', avatar_url: null }} />);
  assert.match(markup, /Dr\. Samira/);
  assert.match(markup, /Cosmetic science/);
  assert.match(markup, /Admin-approved instructor/);
  assert.doesNotMatch(markup, /@|email/);
});

test('sales page instructor block replaces incomplete profile copy with a public empty state', () => {
  const markup = renderFrontend(<CourseInstructor instructor={{ professional_name: 'Instructor', bio: 'Add at least one expertise area, an 80-character biography, and 20 characters of credentials.', expertise: ['Skin care', 'Cosmetic science'], credentials: 'Add at least one expertise area, an 80-character biography, and 20 characters of credentials.', avatar_url: null }} />);
  assert.match(markup, /Instructor bio coming soon/);
  assert.doesNotMatch(markup, /80-character biography|expertise area|20 characters of credentials/);
});

test('sales page instructor block renders its empty state when no public profile is assigned', () => {
  const markup = renderFrontend(<CourseInstructor instructor={null} />);
  assert.match(markup, /Instructor bio coming soon/);
});

test('course detail sections render persisted list content and ignore blank legacy items', () => {
  const markup = renderFrontend(<><LearningOutcomes outcomes={['  Assess a formulation  ', '']} /><Requirements requirements={['Patch-test products']} /><WhoIsThisFor audiences={['Skin-care professionals']} /></>);
  assert.match(markup, /Learning outcomes/);
  assert.match(markup, /Assess a formulation/);
  assert.match(markup, /Requirements/);
  assert.match(markup, /Who this course is for/);
  assert.doesNotMatch(markup, />\s{2,}Assess a formulation\s{2,}</);
});

test('course detail sections render clear empty states instead of placeholders', () => {
  const markup = renderFrontend(<><LearningOutcomes outcomes={[]} /><Requirements requirements={[]} /><WhoIsThisFor audiences={[]} /></>);
  assert.match(markup, /Learning outcomes have not been published/);
  assert.match(markup, /No course requirements have been published/);
  assert.match(markup, /Target audience details have not been published/);
});

test('public reviews render only provided moderated review data without a duplicate aggregate', () => {
  const markup = renderFrontend(<CourseReviews reviews={[{ review_id: 'review-1', reviewer_name: 'Mona', rating: 4, comment: 'Practical and clear.', created_at: '2026-08-01T00:00:00Z' }]} />);
  assert.match(markup, /Mona/);
  assert.match(markup, /Practical and clear/);
  assert.doesNotMatch(markup, />4\.9<|120 Course Review/);
});

test('course content list editor exposes add, remove, and reorder controls', () => {
  const markup = renderFrontend(<DynamicListEditor id="outcomes" label="Learning outcomes" description="Ordered outcomes" value={['First outcome', 'Second outcome']} onChange={() => {}} />);
  assert.match(markup, /Add item/);
  assert.match(markup, /Move Learning outcomes item 2 up/);
  assert.match(markup, /Move Learning outcomes item 1 down/);
  assert.match(markup, /Remove Learning outcomes item 1/);
});

test('learner review moderation page exposes filtering and both decisions', () => {
  const markup = renderFrontend(<AuthContext.Provider value={adminAuthContext}><AdminStudentReviews /></AuthContext.Provider>);
  assert.match(markup, /Learner review moderation/);
  assert.match(markup, /Filter by course/);
  assert.match(markup, /Approve/);
  assert.match(markup, /reject/);
});

test('add lesson dialog exposes only the five supported MVP activities', () => {
  const markup = renderFrontend(<AddCurriculumItemDialog isOpen onClose={() => {}} courseId="course-1" sectionId="section-1" sectionTitle="Getting started" />);
  for (const label of ['Video lesson', 'PDF document', 'External link', 'Quiz', 'Assignment']) assert.match(markup, new RegExp(`>${label}<`));
  for (const legacy of ['Audio', 'Embedded content', 'Live session', 'Article']) assert.doesNotMatch(markup, new RegExp(legacy, 'i'));
  assert.equal((markup.match(/<button/g) || []).length, 7);
  assert.doesNotMatch(markup, /disabled=""/);
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /Add lesson to Getting started/);
});
