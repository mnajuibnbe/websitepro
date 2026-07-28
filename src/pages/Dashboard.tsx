import { useAuth } from '../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { ContinueLearning } from '../components/dashboard/ContinueLearning';
import { MyCoursesList } from '../components/dashboard/MyCoursesList';
import { Achievements } from '../components/dashboard/Achievements';
import { DailyReview } from '../components/dashboard/DailyReview';
import { Menu, Bell, Search, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

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
              className="lg:hidden p-2 -ml-2 text-primary-600 hover:bg-primary-50 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-primary-900 hidden sm:block">Welcome! 👋</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 h-10 pl-10 pr-4 bg-primary-50 border border-transparent focus:bg-white focus:border-primary-300 rounded-full text-sm outline-none transition-all"
              />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" />
            </div>

            <button className="relative p-2 text-primary-500 hover:text-primary-900 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-danger-500 border-2 border-white rounded-full"></span>
            </button>

            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-bold border border-accent-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              Learning Overview
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">

            {/* Mobile Greeting */}
            <h1 className="text-2xl font-bold text-primary-900 sm:hidden mb-6">Welcome! 👋</h1>

            {isLoading ? (
               <div className="flex justify-center py-20">
                 <Loader2 className="w-8 h-8 animate-spin text-accent-600" />
               </div>
            ) : loadError ? (
               <div className="bg-white rounded-2xl border border-danger-200 shadow-sm p-12 text-center">
                 <h2 className="text-2xl font-bold text-danger-900 mb-3">Unable to complete this action</h2>
                 <p className="text-danger-600 mb-8">Error. Please review the information and try again.</p>
                 <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
               </div>
            ) : hasEnrollments === false ? (
               <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                   <BookOpen className="w-12 h-12 text-primary-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-primary-900 mb-3">Subscribe</h2>
                 <p className="text-primary-600 mb-8 max-w-md">
                   Your dashboard could not be loaded. Please try again.
                 </p>
                 <Button
                   variant="primary"
                   onClick={() => navigate('/courses')}
                   className="h-12 px-8 text-lg"
                 >
                   Courses
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
          </div>
        </main>
      </div>
    </div>
  );
}
