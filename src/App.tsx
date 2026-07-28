import { Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PricingProvider } from './contexts/PricingContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { PageMeta } from './components/layout/PageMeta';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';
import { Permission } from './types/auth';
import { lazyNamed } from './lib/lazyNamed';

const Home = lazyNamed(() => import('./pages/Home'), 'Home');
const About = lazyNamed(() => import('./pages/About'), 'About');
const FAQ = lazyNamed(() => import('./pages/FAQ'), 'FAQ');
const CoursesListing = lazyNamed(() => import('./pages/CoursesListing'), 'CoursesListing');
const CourseDetail = lazyNamed(() => import('./pages/CourseDetail'), 'CourseDetail');
const Blog = lazyNamed(() => import('./pages/Blog'), 'Blog');
const BlogPost = lazyNamed(() => import('./pages/BlogPost'), 'BlogPost');
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage');
const ForgotPassword = lazyNamed(() => import('./pages/ForgotPassword'), 'ForgotPassword');
const RegisterPage = lazyNamed(() => import('./pages/RegisterPage'), 'RegisterPage');
const ContactPage = lazyNamed(() => import('./pages/ContactPage'), 'ContactPage');
const PrivacyPolicy = lazyNamed(() => import('./pages/PrivacyPolicy'), 'PrivacyPolicy');
const Terms = lazyNamed(() => import('./pages/Terms'), 'Terms');
const UnauthorizedPage = lazyNamed(() => import('./pages/UnauthorizedPage'), 'UnauthorizedPage');
const NotFoundPage = lazyNamed(() => import('./pages/NotFoundPage'), 'NotFoundPage');
const UpdatePassword = lazyNamed(() => import('./pages/UpdatePassword'), 'UpdatePassword');
const CheckoutPage = lazyNamed(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const Dashboard = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const UserProfile = lazyNamed(() => import('./pages/UserProfile'), 'UserProfile');
const MyCourses = lazyNamed(() => import('./pages/MyCourses'), 'MyCourses');
const CourseLearnResolver = lazyNamed(() => import('./pages/CourseLearnResolver'), 'CourseLearnResolver');
const LessonPlayer = lazyNamed(() => import('./pages/LessonPlayer'), 'LessonPlayer');
const LegacyLessonRedirector = lazyNamed(() => import('./pages/LegacyLessonRedirector'), 'LegacyLessonRedirector');
const QuizPage = lazyNamed(() => import('./pages/Quiz'), 'QuizPage');
const CertificatePage = lazyNamed(() => import('./pages/CertificatePage'), 'CertificatePage');
const AdminDashboard = lazyNamed(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminCourseManager = lazyNamed(() => import('./pages/admin/AdminCourseManager'), 'AdminCourseManager');
const AdminCourseCreate = lazyNamed(() => import('./pages/admin/AdminCourseCreate'), 'AdminCourseCreate');
const AdminCourseEdit = lazyNamed(() => import('./pages/admin/AdminCourseEdit'), 'AdminCourseEdit');
const AdminCourseBuilder = lazyNamed(() => import('./pages/admin/AdminCourseBuilder'), 'AdminCourseBuilder');
const AdminLessonEditor = lazyNamed(() => import('./pages/admin/AdminLessonEditor'), 'AdminLessonEditor');
const AdminUserManagement = lazyNamed(() => import('./pages/admin/AdminUserManagement'), 'AdminUserManagement');

function RouteFallback() {
  return <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-primary-50"><span className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-accent-600" /><span className="sr-only">Loading page</span></div>;
}

function AppContent() {
  const location = useLocation();

  if (location.hash.startsWith('#access_token=') || location.hash.startsWith('#recovery_token=') || location.pathname === '/update-password' || location.search.includes('type=recovery')) {
    return <Suspense fallback={<RouteFallback />}><UpdatePassword /></Suspense>;
  }

  return (
    <><PageMeta /><Suspense fallback={<RouteFallback />}><Routes>
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

      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense></>
  );
}

export default function App() {
  return (
    <AppErrorBoundary><HashRouter>
      <AuthProvider>
        <PricingProvider><AppContent /></PricingProvider>
      </AuthProvider>
    </HashRouter></AppErrorBoundary>
  );
}
