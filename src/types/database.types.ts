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
  type: 'video' | 'text';
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
