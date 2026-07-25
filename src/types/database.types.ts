export interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  thumbnail: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'pending' | 'cancelled' | string;
  enrolled_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  type: 'video' | 'text' | 'quiz';
  duration: string | null;
  order_index: number;
  is_published: boolean;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
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

