import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { CoursesListing } from './pages/CoursesListing';
import { CourseDetail } from './pages/CourseDetail';
import { CheckoutPage } from './pages/CheckoutPage';
import { Dashboard } from './pages/Dashboard';
import { LessonPlayer } from './pages/LessonPlayer';
import { QuizPage } from './pages/Quiz';
import { CertificatePage } from './pages/CertificatePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { ContactPage } from './pages/ContactPage';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import { UserProfile } from './pages/UserProfile';
import { MyCourses } from './pages/MyCourses';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourseManager } from './pages/admin/AdminCourseManager';
import { CourseEditor } from './pages/admin/CourseEditor';
import { UpdatePassword } from './pages/UpdatePassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';

function ProtectedRoute({ children, onNavigate, requiredRole }: { children: React.ReactNode, onNavigate: (path: string) => void, requiredRole?: 'student' | 'admin' }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        onNavigate('#/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        // If user doesn't have the required role, redirect them
        onNavigate('#/dashboard'); // Redirect to their default dashboard
      }
    }
  }, [isAuthenticated, isLoading, user, onNavigate, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-accent-600 rounded-full animate-spin mb-4"></div>
        <p className="text-primary-600 font-medium">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const renderPage = () => {
    if (currentPath.startsWith('#access_token=') || currentPath.startsWith('recovery_token=') || currentPath.startsWith('#/update-password') || currentPath.includes('type=recovery')) {
      return <UpdatePassword onNavigate={navigate} />;
    }
    switch (currentPath) {
      case '#/':
        return <Home onNavigate={navigate} />;
      case '#/about':
        return <About onNavigate={navigate} />;
      case '#/faq':
        return <FAQ onNavigate={navigate} />;
      case '#/courses':
        return <CoursesListing onNavigate={navigate} />;
      case '#/course':
        return <CourseDetail onNavigate={navigate} />;
      case '#/blog':
        return <Blog onNavigate={navigate} />;
      case '#/blog-post':
        return <BlogPost onNavigate={navigate} />;
      case '#/checkout':
        return <ProtectedRoute onNavigate={navigate}><CheckoutPage onNavigate={navigate} /></ProtectedRoute>;
      case '#/dashboard':
        return <ProtectedRoute onNavigate={navigate}><Dashboard onNavigate={navigate} /></ProtectedRoute>;
      case '#/profile':
        return <ProtectedRoute onNavigate={navigate}><UserProfile onNavigate={navigate} /></ProtectedRoute>;
      case '#/my-courses':
        return <ProtectedRoute onNavigate={navigate}><MyCourses onNavigate={navigate} /></ProtectedRoute>;
      case '#/lesson':
        return <ProtectedRoute onNavigate={navigate}><LessonPlayer onNavigate={navigate} /></ProtectedRoute>;
      case '#/quiz':
        return <ProtectedRoute onNavigate={navigate}><QuizPage onNavigate={navigate} /></ProtectedRoute>;
      case '#/certificate':
        return <ProtectedRoute onNavigate={navigate}><CertificatePage onNavigate={navigate} /></ProtectedRoute>;
      case '#/login':
        return <LoginPage onNavigate={navigate} />;
      case '#/forgot-password':
        return <ForgotPassword onNavigate={navigate} />;
      case '#/register':
        return <RegisterPage onNavigate={navigate} />;
      case '#/contact':
        return <ContactPage onNavigate={navigate} />;
      case '#/privacy':
        return <PrivacyPolicy onNavigate={navigate} />;
      case '#/terms':
        return <Terms onNavigate={navigate} />;
      case '#/admin':
        return <ProtectedRoute onNavigate={navigate} requiredRole="admin"><AdminDashboard onNavigate={navigate} /></ProtectedRoute>;
      case '#/admin/courses':
        return <ProtectedRoute onNavigate={navigate} requiredRole="admin"><AdminCourseManager onNavigate={navigate} /></ProtectedRoute>;
      case '#/admin/courses/edit':
        return <ProtectedRoute onNavigate={navigate} requiredRole="admin"><CourseEditor onNavigate={navigate} /></ProtectedRoute>;
      case '#/admin/users':
        return <ProtectedRoute onNavigate={navigate} requiredRole="admin"><AdminUserManagement onNavigate={navigate} /></ProtectedRoute>;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return renderPage();
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

