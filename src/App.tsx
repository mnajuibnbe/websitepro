import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import { Home } from './pages/Home';
import { CoursesListing } from './pages/CoursesListing';
import { CourseDetail } from './pages/CourseDetail';
import { CheckoutPage } from './pages/CheckoutPage';
import { Dashboard } from './pages/Dashboard';
import { LessonPlayer } from './pages/LessonPlayer';
import { CourseLearnResolver } from './pages/CourseLearnResolver';
import { LegacyLessonRedirector } from './pages/LegacyLessonRedirector';
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
import { AdminCourseCreate } from './pages/admin/AdminCourseCreate';
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit';
import { AdminCourseBuilder } from './pages/admin/AdminCourseBuilder';
import { AdminLessonEditor } from './pages/admin/AdminLessonEditor';
import { CourseEditor } from './pages/admin/CourseEditor';
import { UpdatePassword } from './pages/UpdatePassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';

import { RequireAuth } from './components/auth/RequireAuth';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { Permission } from './types/auth';

function AppContent() {
  const location = useLocation();

  if (location.hash.startsWith('#access_token=') || location.hash.startsWith('#recovery_token=') || location.pathname === '/update-password' || location.search.includes('type=recovery')) {
    return <UpdatePassword />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/courses" element={<CoursesListing />} />
      <Route path="/course/:id" element={<CourseDetail />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog-post" element={<BlogPost />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated Routes (Students, Instructors, Admins) */}
      <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
      <Route path="/my-courses" element={<RequireAuth><MyCourses /></RequireAuth>} />
      <Route path="/learn/:courseId" element={<RequireAuth><CourseLearnResolver /></RequireAuth>} />
      <Route path="/learn/:courseId/lesson/:lessonId" element={<RequireAuth><LessonPlayer /></RequireAuth>} />
      <Route path="/lesson" element={<RequireAuth><LegacyLessonRedirector /></RequireAuth>} />
      <Route path="/quiz" element={<RequireAuth><QuizPage /></RequireAuth>} />
      <Route path="/certificate" element={<RequireAuth><CertificatePage /></RequireAuth>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/courses" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseManager /></RequireAuth>} />
      <Route path="/admin/courses/new" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseCreate /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/edit" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseEdit /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/builder" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseBuilder /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/lessons/new" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminLessonEditor /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/lessons/:lessonId/edit" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminLessonEditor /></RequireAuth>} />
      <Route path="/admin/courses/edit" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseCreate /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminUserManagement /></RequireAuth>} />

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
