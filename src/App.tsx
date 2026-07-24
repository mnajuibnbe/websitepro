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

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'student' | 'admin' }) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, navigate]);

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
  const location = useLocation();
  
  if (location.hash.startsWith('#access_token=') || location.hash.startsWith('#recovery_token=') || location.pathname === '/update-password' || location.search.includes('type=recovery')) {
    return <UpdatePassword />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/courses" element={<CoursesListing />} />
      <Route path="/course/:id" element={<CourseDetail />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog-post" element={<BlogPost />} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
      <Route path="/lesson" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      <Route path="/certificate" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute><AdminCourseManager /></ProtectedRoute>} />
      <Route path="/admin/courses/edit" element={<ProtectedRoute><CourseEditor /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
      <Route path="*" element={<Home />} />
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
