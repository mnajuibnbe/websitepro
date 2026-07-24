import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
        onNavigate('#/dashboard');
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
  const navigate = useNavigate();
  const location = useLocation();
  
  const onNavigate = (path: string) => {
    if (path.startsWith('#/')) {
      navigate(path.substring(1));
    } else {
      navigate(path);
    }
  };

  if (location.hash.startsWith('#access_token=') || location.hash.startsWith('#recovery_token=') || location.pathname === '/update-password' || location.search.includes('type=recovery')) {
    return <UpdatePassword onNavigate={onNavigate} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home onNavigate={onNavigate} />} />
      <Route path="/about" element={<About onNavigate={onNavigate} />} />
      <Route path="/faq" element={<FAQ onNavigate={onNavigate} />} />
      <Route path="/courses" element={<CoursesListing onNavigate={onNavigate} />} />
      <Route path="/course/:id" element={<CourseDetail onNavigate={onNavigate} />} />
      <Route path="/blog" element={<Blog onNavigate={onNavigate} />} />
      <Route path="/blog-post" element={<BlogPost onNavigate={onNavigate} />} />
      <Route path="/checkout" element={<ProtectedRoute onNavigate={onNavigate}><CheckoutPage onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute onNavigate={onNavigate}><Dashboard onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute onNavigate={onNavigate}><UserProfile onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/my-courses" element={<ProtectedRoute onNavigate={onNavigate}><MyCourses onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/lesson" element={<ProtectedRoute onNavigate={onNavigate}><LessonPlayer onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute onNavigate={onNavigate}><QuizPage onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/certificate" element={<ProtectedRoute onNavigate={onNavigate}><CertificatePage onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage onNavigate={onNavigate} />} />
      <Route path="/forgot-password" element={<ForgotPassword onNavigate={onNavigate} />} />
      <Route path="/register" element={<RegisterPage onNavigate={onNavigate} />} />
      <Route path="/contact" element={<ContactPage onNavigate={onNavigate} />} />
      <Route path="/privacy" element={<PrivacyPolicy onNavigate={onNavigate} />} />
      <Route path="/terms" element={<Terms onNavigate={onNavigate} />} />
      <Route path="/admin" element={<ProtectedRoute onNavigate={onNavigate}><AdminDashboard onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute onNavigate={onNavigate}><AdminCourseManager onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/admin/courses/edit" element={<ProtectedRoute onNavigate={onNavigate}><CourseEditor onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute onNavigate={onNavigate}><AdminUserManagement onNavigate={onNavigate} /></ProtectedRoute>} />
      <Route path="*" element={<Home onNavigate={onNavigate} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}
