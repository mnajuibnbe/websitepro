import { useAuth } from '../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { ContinueLearning } from '../components/dashboard/ContinueLearning';
import { MyCoursesList } from '../components/dashboard/MyCoursesList';
import { Achievements } from '../components/dashboard/Achievements';
import { DailyReview } from '../components/dashboard/DailyReview';
import { Menu, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/layout/PageContainer';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasEnrollments, setHasEnrollments] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function checkEnrollments() {
      try {
        setLoadError(false);
        if (user) {
          const { count, error } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'active');

          if (error) throw error;
          if (count && count > 0) {
            setHasEnrollments(true);
          } else {
            setHasEnrollments(false);
          }
        } else {
           navigate('/login');
        }
      } catch (err) {
        console.error(err);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }
    checkEnrollments();
  }, [user?.id, navigate]);

  return (
    <div className="min-h-screen bg-primary-50 flex font-sans" dir="ltr">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-20 bg-white border-b border-primary-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open student navigation"
              className="lg:hidden p-2 -ml-2 text-primary-600 hover:bg-primary-50 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-primary-900 hidden sm:block">Welcome! 👋</h1>
          </div>

          <button type="button" onClick={() => navigate('/profile')} aria-label="Open profile" className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-bold border border-accent-200 shadow-sm hover:shadow-md transition-shadow">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </button>
        </header>

        {/* Dashboard Content */}
        <main id="main-content" className="flex-grow overflow-y-auto py-4 sm:py-8">
          <PageContainer className="space-y-8 pb-12">

            {/* Mobile Greeting */}
            <h1 className="text-2xl font-bold text-primary-900 sm:hidden mb-6">Welcome! 👋</h1>

            {isLoading ? (
               <div className="flex justify-center py-20">
                 <Loader2 className="w-8 h-8 animate-spin text-accent-600" />
               </div>
            ) : loadError ? (
               <div className="bg-white rounded-2xl border border-danger-200 shadow-sm p-12 text-center">
                 <h2 className="text-2xl font-bold text-danger-900 mb-3">Unable to complete this action</h2>
                 <p className="text-danger-600 mb-8">We could not load your learning dashboard. Please try again.</p>
                 <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
               </div>
            ) : hasEnrollments === false ? (
               <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                   <BookOpen className="w-12 h-12 text-primary-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-primary-900 mb-3">No Enrolled Courses Yet</h2>
                 <p className="text-primary-600 mb-8 max-w-md">
                   Enroll in a course to start learning and track your progress here.
                 </p>
                 <Button
                   variant="primary"
                   onClick={() => navigate('/courses')}
                   className="h-12 px-8 text-lg"
                 >
                   Explore courses
                 </Button>
               </div>
            ) : (
              <>
                {/* Primary Action Section */}
                <section>
                  <ContinueLearning />
                </section>

                {/* Secondary Sections Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                  {/* Left Column (Main Content) */}
                  <div className="lg:col-span-8 space-y-8">
                    <section>
                      <MyCoursesList />
                    </section>
                  </div>

                  {/* Right Column (Sidebar Widgets) */}
                  <div className="lg:col-span-4 space-y-8">
                    <section>
                      <DailyReview />
                    </section>
                    <section>
                      <Achievements />
                    </section>
                  </div>
                </div>
              </>
            )}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
