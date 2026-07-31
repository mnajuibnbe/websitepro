import assert from 'node:assert/strict';
import test from 'node:test';
import { CurriculumAccordion, PublicCurriculumSection } from '../components/course-detail/CurriculumAccordion';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';
import { renderFrontend } from './renderFrontend';
import { CourseEditorGuide } from '../components/admin/course/CourseEditorGuide';
import { CategoryField } from '../components/admin/course/CategoryField';
import { CourseInstructor } from '../components/course-detail/CourseInstructor';
import { AddCurriculumItemDialog } from '../components/admin/curriculum/AddCurriculumItemDialog';

const sections: PublicCurriculumSection[] = [{
  id: 'section-1', title: 'Getting started', description: 'Course orientation', order_index: 0,
  lesson_count: 2, total_minutes: 25,
  lessons: [
    { id: 'lesson-1', title: 'Welcome video', content_type: 'video', estimated_minutes: 25, is_preview: true, order_index: 0 },
    { id: 'lesson-2', title: 'Course guide', content_type: 'pdf', estimated_minutes: null, is_preview: false, order_index: 1 },
  ],
}];

test('renders authored public curriculum metadata without protected content URLs', () => {
  const markup = renderFrontend(<CurriculumAccordion sections={sections} />);
  assert.match(markup, /Getting started/);
  assert.match(markup, /Welcome video/);
  assert.match(markup, /2 lessons · 25 min of video/);
  assert.doesNotMatch(markup, /video_url|content_url/);
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

test('category field explains the selected governed category', () => {
  const markup = renderFrontend(<CategoryField value="Skin Care" onChange={() => {}} />);
  assert.match(markup, /Skin health, products, routines/);
  assert.doesNotMatch(markup, /type="text"/);
});

test('sales page instructor block renders only assigned public profile data', () => {
  const markup = renderFrontend(<CourseInstructor instructor={{ professional_name: 'Dr. Samira', bio: 'Evidence-based educator with extensive professional experience.', expertise: ['Cosmetic science'], credentials: 'Board-certified professional educator', avatar_url: null }} />);
  assert.match(markup, /Dr\. Samira/);
  assert.match(markup, /Cosmetic science/);
  assert.match(markup, /Admin-approved instructor/);
  assert.doesNotMatch(markup, /@|email/);
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
