import type { CourseAuthoringStatus, CourseReviewStatus, CourseVisibility, LessonCompletionRule, LessonContentType } from '../domain/courseAuthoring';

export interface Course {
  id: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  price: number | string | null;
  price_egp: number | string | null;
  price_usd: number | string | null;
  duration: string | null;
  total_video_duration_seconds?: number;
  category: string | null;
  thumbnail: string | null;
  cover_image: string | null;
  trailer_video: string | null;
  status: 'draft' | 'published' | 'archived' | string;
  instructor_id: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels' | string | null;
  language: string | null;
  visibility: CourseVisibility | string | null;
  authoring_status?: CourseAuthoringStatus;
  review_status?: CourseReviewStatus;
  author_id?: string | null;
  version?: number;
  submitted_revision_id?: string | null;
  approved_revision_id?: string | null;
  is_featured: boolean | null;
  home_order: number | null;
  certificate_enabled: boolean | null;
  sequential_learning: boolean | null;
  drip_enabled: boolean | null;
  discussion_enabled: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseRevision {
  id: string;
  course_id: string;
  revision_number: number;
  snapshot: Record<string, unknown>;
  content_hash: string;
  created_by: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'pending' | 'cancelled' | string;
  enrolled_at: string;
}

export interface CourseOrder {
  id: string; course_id: string; user_id: string; amount: string; currency: 'EGP' | 'USD';
  pricing_region: 'egypt' | 'international'; pricing_source: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'; enrollment_status: 'pending' | 'active' | 'cancelled'; created_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  slug?: string | null;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  video_provider?: string | null;
  video_duration_seconds?: number | null;
  video_metadata_status?: 'not_applicable' | 'pending' | 'ready' | 'unavailable' | 'failed';
  video_metadata_updated_at?: string | null;
  content_url?: string | null;
  type?: 'video' | 'text' | 'quiz' | string;
  content_type?: LessonContentType | null;
  lesson_type?: LessonContentType | 'article' | 'audio' | 'embed' | 'live' | string;
  duration?: string | null;
  estimated_minutes?: number | null;
  thumbnail?: string | null;
  attachments?: any[] | null;
  order_index: number;
  is_published: boolean;
  is_preview: boolean;
  completion_rule?: LessonCompletionRule | 'read_end' | string | null;
  version?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  transcript?: string | null;
  captions_url?: string | null;
  notes?: string | null;
  pdf_allow_download?: boolean;
  pdf_watermark?: boolean;
  open_in_new_tab?: boolean;
  embed_code?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumItemViewModel {
  id: string;
  courseId: string;
  sectionId: string;
  title: string;
  itemType: 'video' | 'article' | 'pdf' | 'audio' | 'embed' | 'external_link' | 'live' | 'quiz' | 'assignment' | string;
  orderIndex: number;
  duration?: string | null;
  estimatedMinutes?: number | null;
  isPublished: boolean;
  isPreview: boolean;
  sourceTable: 'lessons' | 'quizzes' | 'assignments' | string;
  sourceId: string;
  deletedAt?: string | null;
}

export interface CurriculumSectionViewModel {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isPublished: boolean;
  isCollapsed?: boolean;
  deletedAt?: string | null;
  items: CurriculumItemViewModel[];
}

export interface LessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  is_completed: boolean;
  last_accessed_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  description: string | null;
  pass_percentage: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  points: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionOptionRow {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  lesson_id: string;
  attempt_number: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  score_points: number | null;
  total_points: number | null;
  score_percentage: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionAttempt {
  id: string;
  quiz_attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean | null;
  points_awarded: number | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

// Student-facing RPC payload types (explanation and is_correct omitted before submission)
export interface StudentQuestionOptionPayload {
  option_id: string;
  option_text: string;
  order_index: number;
}

export interface StudentQuestionPayload {
  question_id: string;
  question_text: string;
  order_index: number;
  points: number;
  selected_option_id: string | null;
  options: StudentQuestionOptionPayload[];
}

export interface StartQuizResult {
  attempt_id: string;
  attempt_number: number;
  quiz_id: string;
  course_id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  pass_percentage: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  started_at?: string;
  questions: StudentQuestionPayload[];
}

export interface SaveQuizAnswerResult {
  success: boolean;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
}

export interface SubmitQuizResult {
  attempt_id: string;
  quiz_id: string;
  score_points: number;
  total_points: number;
  score_percentage: number;
  pass_percentage: number;
  passed: boolean;
  submitted_after_expiration?: boolean;
}

export interface ResultQuestionOptionPayload extends StudentQuestionOptionPayload {
  is_correct: boolean;
}

export interface ResultQuestionPayload extends StudentQuestionPayload {
  explanation: string | null;
  is_correct: boolean | null;
  points_awarded: number | null;
  options: ResultQuestionOptionPayload[];
}

export interface GetQuizAttemptResultPayload {
  attempt_id: string;
  quiz_id: string;
  status: 'submitted';
  score_points: number;
  total_points: number;
  score_percentage: number;
  pass_percentage: number;
  passed: boolean;
  started_at: string;
  submitted_at: string;
  questions: ResultQuestionPayload[];
}
