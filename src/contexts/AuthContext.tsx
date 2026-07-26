import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../services/api';

export interface RegisterResult {
  user: User | null;
  session: Session | null;
  requiresEmailConfirmation: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUserToLocalUser(supabaseUser: SupabaseUser): User {
  const appRole = supabaseUser.app_metadata?.role;
  let role: any = 'student';
  if (appRole === 'admin') role = 'admin';
  else if (appRole === 'instructor') role = 'instructor';

  let name = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name;
  if (!name && supabaseUser.email) {
    name = supabaseUser.email.split('@')[0];
  }
  if (!name) name = 'User';

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: name,
    role: role,
    joinedAt: supabaseUser.created_at || new Date().toISOString(),
  };
}

function updateLocalUser(previousUser: User | null, supabaseUser?: SupabaseUser): User | null {
  if (!supabaseUser) return null;

  const nextUser = mapSupabaseUserToLocalUser(supabaseUser);
  if (
    previousUser &&
    previousUser.id === nextUser.id &&
    previousUser.email === nextUser.email &&
    previousUser.name === nextUser.name &&
    previousUser.role === nextUser.role &&
    previousUser.joinedAt === nextUser.joinedAt
  ) {
    return previousUser;
  }

  return nextUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('auth_token');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser((previousUser) => updateLocalUser(previousUser, session?.user));
      setIsLoading(false);
    }).catch((err) => {
      console.error('Session retrieval failed', err);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser((previousUser) => updateLocalUser(previousUser, session?.user));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
      throw error;
    }
    
    if (!data.session) {
      throw new Error('تعذر إنشاء الجلسة بنجاح، يرجى المحاولة لاحقاً');
    }
  };

  const register = async (name: string, email: string, password: string): Promise<RegisterResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) throw error;

    const requiresEmailConfirmation = !data.session;
    
    return {
      user: data.user ? mapSupabaseUserToLocalUser(data.user) : null,
      session: data.session,
      requiresEmailConfirmation
    };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    navigate('/login');
  };

  const token = session?.access_token || null;

  return (
    <AuthContext.Provider value={{ user, session, token, isAuthenticated: !!session, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
