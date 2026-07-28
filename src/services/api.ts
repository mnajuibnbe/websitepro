import { Role } from '../types/auth';

/**
 * API Service for Database Operations
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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
  duration: number;
  type: 'video' | 'quiz' | 'document';
}

const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Instructor',
    email: 'student@example.com',
    role: 'student',
    joinedAt: '2026-07-01'
  },
  {
    id: 'usr_admin',
    name: 'Instructor',
    email: 'admin@example.com',
    role: 'admin',
    joinedAt: '2026-01-01'
  }
];

export async function login(email: string, password: string):Promise<{token: string, user: User}> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let user = MOCK_USERS.find(u => u.email === email);
      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          name: email.split('@')[0],
          email: email,
          role: 'student',
          joinedAt: new Date().toISOString()
        };
      }
      resolve({
        token: `mock-jwt-token-${user.id}`,
        user
      });
    }, 800);
  });
}

export async function register(name: string, email: string, password: string): Promise<{token: string, user: User}> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        reject(new Error('Email Address.'));
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

export async function saveProgress(lessonId: string, progress: number, token?: string): Promise<boolean> {
  if (!token) throw new Error("Unauthorized");
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Progress for lesson ${lessonId} saved: ${progress}% with token ${token}`);
      resolve(true);
    }, 600);
  });
}

export async function getUserProfile(token: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!token) {
        reject(new Error('No token provided.'));
        return;
      }
      const userId = token.replace('mock-jwt-token-', '');
      let user = MOCK_USERS.find(u => u.id === userId);
      if (!user) {
        user = {
          id: userId,
          name: 'Demo User (Supabase unavailable)',
          email: 'user@example.com',
          role: 'student',
          joinedAt: new Date().toISOString()
        };
      }
      resolve(user);
    }, 500);
  });
}
