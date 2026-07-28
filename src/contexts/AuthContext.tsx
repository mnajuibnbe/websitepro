import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../services/api';
import { getAuthErrorMessage } from '../lib/authErrors';
import { runAuthRequest } from '../lib/authAsync';
import { reportClientError } from '../lib/clientMonitoring';

export interface RegisterResult {
  user: User | null;
  session: Session | null;
  requiresEmailConfirmation: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
  retrySession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [sessionError, setSessionError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setSessionError(null);
    try {
      const { data: { session }, error } = await runAuthRequest(supabase.auth.getSession());
      if (error) throw error;
      setSession(session);
      setUser(previousUser => updateLocalUser(previousUser, session?.user));
    } catch {
      setSession(null);
      setUser(null);
      setSessionError('We could not verify your account session. Check your connection and try again.');
      reportClientError(new Error('Auth session initialization failed'), 'auth-session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.removeItem('auth_token');

    void loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser((previousUser) => updateLocalUser(previousUser, session?.user));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSession]);

  const login = async (email: string, password: string) => {
    const { data, error } = await runAuthRequest(supabase.auth.signInWithPassword({
      email,
      password,
    }));
    if (error) throw new Error(getAuthErrorMessage(error, 'login'));

    if (!data.session) {
      throw new Error('Unable to complete this action. Please try again.');
    }
  };

  const register = async (name: string, email: string, password: string): Promise<RegisterResult> => {
    const { data, error } = await runAuthRequest(supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    }));

    if (error) throw new Error(getAuthErrorMessage(error, 'register'));

    const requiresEmailConfirmation = !data.session;

    return {
      user: data.user ? mapSupabaseUserToLocalUser(data.user) : null,
      session: data.session,
      requiresEmailConfirmation
    };
  };

  const logout = async () => {
    try {
      const { error } = await runAuthRequest(supabase.auth.signOut());
      if (error) throw error;
      navigate('/login');
      return true;
    } catch {
      reportClientError(new Error('Auth sign out failed'), 'auth-sign-out');
      return false;
    }
  };

  const token = session?.access_token || null;

  return (
    <AuthContext.Provider value={{ user, session, token, isAuthenticated: !!session, isLoading, sessionError, retrySession: loadSession, login, register, logout }}>
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
