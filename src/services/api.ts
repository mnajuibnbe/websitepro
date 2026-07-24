/**
 * API Service for Database Operations
 * 
 * This file serves as the central data access layer. Currently it uses mocked 
 * Promises to simulate network requests. In the future, you can replace the 
 * inner logic of these functions with actual Supabase, Firebase, or custom API calls.
 */

// ==========================================
// Types & Interfaces
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  joinedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  instructorId: string;
  status: 'active' | 'draft';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl?: string;
  duration: number; // in minutes
  type: 'video' | 'quiz' | 'document';
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number; // percentage (0-100)
  enrolledAt: string;
  lastAccessed: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issueDate: string;
  url: string;
}

// ==========================================
// Mock Data (For demonstration purposes)
// ==========================================

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'دبلومة العناية بالبشرة الشاملة',
    description: 'دبلومة متكاملة تغطي كافة جوانب العناية بالبشرة.',
    price: 1500,
    thumbnail: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
    instructorId: 'inst_1',
    status: 'active'
  },
  {
    id: '2',
    title: 'أساسيات التركيبات التجميلية',
    description: 'تعرف على المواد الفعالة وكيفية صياغة المنتجات.',
    price: 900,
    thumbnail: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
    instructorId: 'inst_1',
    status: 'active'
  }
];

const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'أحمد محمد',
    email: 'student@example.com',
    role: 'student',
    joinedAt: '2026-07-01'
  },
  {
    id: 'usr_admin',
    name: 'مدير النظام',
    email: 'admin@example.com',
    role: 'admin',
    joinedAt: '2026-01-01'
  }
];

// ==========================================
// API Functions
// ==========================================

/**
 * Simulate user login and return an auth token and user profile.
 */
export async function login(email: string, password: string):Promise<{token: string, user: User}> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      if (user && password === 'password123') { // Hardcoded password for mock
        resolve({
          token: `mock-jwt-token-${user.id}`,
          user
        });
      } else {
        reject(new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.'));
      }
    }, 800);
  });
}

/**
 * Simulate user registration.
 */
export async function register(name: string, email: string, password: string): Promise<{token: string, user: User}> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        reject(new Error('البريد الإلكتروني مسجل مسبقاً.'));
        return;
      }
      
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role: 'student',
        joinedAt: new Date().toISOString()
      };
      
      resolve({
        token: `mock-jwt-token-${newUser.id}`,
        user: newUser
      });
    }, 800);
  });
}

/**
 * Fetch all available courses from the database.
 * @returns {Promise<Course[]>} A promise that resolves to an array of courses.
 */
export async function getCourses(token?: string): Promise<Course[]> {
  // Simulate network latency and basic token check
  if (!token) console.warn("No token provided to getCourses");
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_COURSES);
    }, 800);
  });
}

/**
 * Fetch a specific course by its ID.
 * @param {string} id - The unique identifier of the course.
 * @returns {Promise<Course | null>} A promise that resolves to the course object, or null if not found.
 */
export async function getCourseById(id: string, token?: string): Promise<Course | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const course = MOCK_COURSES.find(c => c.id === id) || null;
      resolve(course);
    }, 500);
  });
}

/**
 * Save user progress for a specific lesson.
 * @param {string} lessonId - The unique identifier of the lesson.
 * @param {number} progress - The progress percentage (0-100).
 * @returns {Promise<boolean>} A promise that resolves to true if successful.
 */
export async function saveProgress(lessonId: string, progress: number, token?: string): Promise<boolean> {
  if (!token) throw new Error("Unauthorized");
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Progress for lesson ${lessonId} saved: ${progress}% with token ${token}`);
      resolve(true);
    }, 600);
  });
}

/**
 * Fetch the profile data of the currently authenticated user based on their token.
 * @returns {Promise<User | null>} A promise that resolves to the user profile object.
 */
export async function getUserProfile(token: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!token) {
        reject(new Error('No token provided.'));
        return;
      }
      // Simple mock: extract user ID from the token structure "mock-jwt-token-<id>"
      const userId = token.replace('mock-jwt-token-', '');
      const user = MOCK_USERS.find(u => u.id === userId) || null;
      resolve(user);
    }, 500);
  });
}
