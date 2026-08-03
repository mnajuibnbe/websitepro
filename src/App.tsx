import { Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PricingProvider } from './contexts/PricingContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireGuest } from './components/auth/RequireGuest';
import { PageMeta } from './components/layout/PageMeta';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';
import { Permission } from './types/auth';
import { lazyNamed } from './lib/lazyNamed';
import { LocaleProvider } from './contexts/LocaleContext';

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
const AdminCourseCategories = lazyNamed(() => import('./pages/admin/AdminCourseCategories'), 'AdminCourseCategories');
const AdminCourseCreate = lazyNamed(() => import('./pages/admin/AdminCourseCreate'), 'AdminCourseCreate');
const AdminCourseEdit = lazyNamed(() => import('./pages/admin/AdminCourseEdit'), 'AdminCourseEdit');
const AdminCourseBuilder = lazyNamed(() => import('./pages/admin/AdminCourseBuilder'), 'AdminCourseBuilder');
const AdminLessonEditor = lazyNamed(() => import('./pages/admin/AdminLessonEditor'), 'AdminLessonEditor');
const AdminUserManagement = lazyNamed(() => import('./pages/admin/AdminUserManagement'), 'AdminUserManagement');
const AdminCourseEnrollments = lazyNamed(() => import('./pages/admin/AdminCourseEnrollments'), 'AdminCourseEnrollments');
const InstructorApplication = lazyNamed(() => import('./pages/InstructorApplication'), 'InstructorApplication');
const InstructorCourses = lazyNamed(() => import('./pages/InstructorCourses'), 'InstructorCourses');
const AdminInstructorApplications = lazyNamed(() => import('./pages/admin/AdminInstructorApplications'), 'AdminInstructorApplications');
const AdminCourseReviews = lazyNamed(() => import('./pages/admin/AdminCourseReviews'), 'AdminCourseReviews');
const AdminCourseReviewWorkspace = lazyNamed(() => import('./pages/admin/AdminCourseReviewWorkspace'), 'AdminCourseReviewWorkspace');
const AdminStudentReviews = lazyNamed(() => import('./pages/admin/AdminStudentReviews'), 'AdminStudentReviews');
const AdminHomepageSettings = lazyNamed(() => import('./pages/admin/AdminHomepageSettings'), 'AdminHomepageSettings');
const AdminBlogPosts = lazyNamed(() => import('./pages/admin/AdminBlogPosts'), 'AdminBlogPosts');

function RouteFallback() {
  return <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-primary-50"><span className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-accent-600" /><span className="sr-only">Loading page</span></div>;
}

function AppContent() {
  const location = useLocation();

  const browserSearch = window.location.search;
  const browserHash = window.location.hash;
  if (browserHash.startsWith('#access_token=') || browserHash.startsWith('#recovery_token=') || location.pathname === '/update-password' || browserSearch.includes('type=recovery') || browserSearch.includes('token_hash=')) {
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
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated Routes (Students, Instructors, Admins) */}
      <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
      <Route path="/instructor/apply" element={<RequireAuth><InstructorApplication /></RequireAuth>} />
      <Route path="/instructor/courses/new" element={<RequireAuth permission={Permission.CREATE_COURSE}><AdminCourseCreate /></RequireAuth>} />
      <Route path="/instructor/courses" element={<RequireAuth permission={Permission.CREATE_COURSE}><InstructorCourses /></RequireAuth>} />
      <Route path="/my-courses" element={<RequireAuth><MyCourses /></RequireAuth>} />
      <Route path="/learn/:courseId" element={<RequireAuth><CourseLearnResolver /></RequireAuth>} />
      <Route path="/learn/:courseId/lesson/:lessonId" element={<RequireAuth><LessonPlayer /></RequireAuth>} />
      <Route path="/lesson" element={<RequireAuth><LegacyLessonRedirector /></RequireAuth>} />
      <Route path="/quiz" element={<RequireAuth><QuizPage /></RequireAuth>} />
      <Route path="/certificate" element={<RequireAuth><CertificatePage /></RequireAuth>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/courses" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseManager /></RequireAuth>} />
      <Route path="/admin/course-categories" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseCategories /></RequireAuth>} />
      <Route path="/admin/courses/new" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseCreate /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/edit" element={<RequireAuth permission={Permission.CREATE_COURSE}><AdminCourseEdit /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/builder" element={<RequireAuth permission={Permission.CREATE_COURSE}><AdminCourseBuilder /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/students" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseEnrollments /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/lessons/new" element={<RequireAuth permission={Permission.CREATE_COURSE}><AdminLessonEditor /></RequireAuth>} />
      <Route path="/admin/courses/:courseId/lessons/:lessonId/edit" element={<RequireAuth permission={Permission.CREATE_COURSE}><AdminLessonEditor /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminUserManagement /></RequireAuth>} />
      <Route path="/admin/instructors" element={<RequireAuth permission={Permission.MANAGE_INSTRUCTORS}><AdminInstructorApplications /></RequireAuth>} />
      <Route path="/admin/course-reviews" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseReviews /></RequireAuth>} />
      <Route path="/admin/course-reviews/:courseId" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminCourseReviewWorkspace /></RequireAuth>} />
      <Route path="/admin/reviews" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminStudentReviews /></RequireAuth>} />
      <Route path="/admin/homepage" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminHomepageSettings /></RequireAuth>} />
      <Route path="/admin/blog-posts" element={<RequireAuth permission={Permission.ADMIN_ACCESS}><AdminBlogPosts /></RequireAuth>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense></>
  );
}

export default function App() {
  return (
    <AppErrorBoundary><HashRouter><LocaleProvider>
      <AuthProvider>
        <PricingProvider><AppContent /></PricingProvider>
      </AuthProvider>
    </LocaleProvider></HashRouter></AppErrorBoundary>
  );
}
