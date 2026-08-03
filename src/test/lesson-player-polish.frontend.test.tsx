import assert from 'node:assert/strict';
import test from 'node:test';
import type { CourseSection, Lesson } from '../types/database.types';
import { CourseLearningHeader } from '../components/player/CourseLearningHeader';
import { CourseSidebar } from '../components/player/CourseSidebar';
import { LessonNavigation } from '../components/player/LessonNavigation';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { renderFrontend } from './renderFrontend';

const lesson = { id: 'lesson-1', title: 'Welcome', type: 'video', content_type: 'video', section_id: 'section-1', order_index: 0 } as Lesson;
const nextLesson = { ...lesson, id: 'lesson-2', title: 'Next topic', order_index: 1 } as Lesson;
const section = { id: 'section-1', title: 'Getting started', order_index: 0 } as CourseSection;

test('lesson completion controls state their actions explicitly', () => {
  const incomplete = renderFrontend(<LessonNavigation prevLesson={null} nextLesson={nextLesson} currentLessonType="video" isCurrentCompleted={false} isCompleting={false} onNavigate={() => {}} onCompleteAndContinue={() => {}} />);
  assert.match(incomplete, /Mark complete &amp; continue/);
  assert.match(incomplete, /Previous lesson/);
  assert.match(incomplete, /Next lesson/);
  assert.doesNotMatch(incomplete, />Lesson<|>Next</);

  const completed = renderFrontend(<LessonNavigation prevLesson={lesson} nextLesson={nextLesson} currentLessonType="video" isCurrentCompleted isCompleting={false} onNavigate={() => {}} onCompleteAndContinue={() => {}} />);
  assert.match(completed, /Lesson complete/);
  assert.equal((completed.match(/>Next lesson</g) || []).length, 1);
});

test('curriculum trigger remains available through tablet widths', () => {
  const markup = renderFrontend(<CourseLearningHeader courseTitle="Course title" completedCount={1} totalCount={3} progressPercentage={33} onToggleMobileSidebar={() => {}} />);
  assert.match(markup, /aria-label="Open course curriculum"/);
  assert.match(markup, /lg:hidden/);
  assert.doesNotMatch(markup, /md:hidden/);
  assert.match(markup, /1 of 3 lessons complete/);
});

test('course sidebar exposes clear progress and expandable curriculum labels', () => {
  const markup = renderFrontend(<CourseSidebar sections={[section]} lessons={[lesson, nextLesson]} completedLessonIds={['lesson-1']} currentLessonId="lesson-1" courseId="course-1" progressPercentage={50} onLessonSelect={() => {}} />);
  assert.match(markup, /Course curriculum/);
  assert.match(markup, /1 of 2 lessons \(50%\)/);
  assert.match(markup, /aria-expanded="(?:true|false)"/);
  assert.match(markup, /aria-controls="player-section-section-1"/);
  assert.doesNotMatch(markup, /Details|available yet\.\./);
});

test('playback-only video controls omit seeking, volume, and fullscreen actions', () => {
  const markup = renderFrontend(<VideoPlayer src="/welcome.mp4" title="Welcome" controls="playback-only" />);
  assert.match(markup, /aria-label="Play video"/);
  assert.doesNotMatch(markup, /type="range"/);
  assert.doesNotMatch(markup, /Mute video|Unmute video|fullscreen/);
});
