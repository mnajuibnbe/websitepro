import React, { useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { ContinueLearning } from '../components/dashboard/ContinueLearning';
import { MyCoursesList } from '../components/dashboard/MyCoursesList';
import { Achievements } from '../components/dashboard/Achievements';
import { DailyReview } from '../components/dashboard/DailyReview';
import { Menu, Bell, Search } from 'lucide-react';

export function Dashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-primary-50 flex">
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
            <h1 className="text-xl md:text-2xl font-bold text-primary-900 hidden sm:block">مرحباً بعودتك، د. سارة! 👋</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex relative">
              <input 
                type="text" 
                placeholder="ابحثي في كورساتك..." 
                className="w-64 h-10 pl-10 pr-4 bg-primary-50 border border-transparent focus:bg-white focus:border-primary-300 rounded-full text-sm outline-none transition-all"
              />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" />
            </div>
            
            <button className="relative p-2 text-primary-500 hover:text-primary-900 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-danger-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 font-bold border border-accent-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              س
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            
            {/* Mobile Greeting (Visible only on small screens) */}
            <h1 className="text-2xl font-bold text-primary-900 sm:hidden mb-6">مرحباً بعودتك، د. سارة! 👋</h1>

            {/* Primary Action Section */}
            <section>
              <ContinueLearning />
            </section>

            {/* Secondary Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column (Main Content) - 8 cols */}
              <div className="lg:col-span-8 space-y-8">
                <section>
                  <MyCoursesList />
                </section>
              </div>

              {/* Right Column (Sidebar Widgets) - 4 cols */}
              <div className="lg:col-span-4 space-y-8">
                <section>
                  <DailyReview />
                </section>
                <section>
                  <Achievements />
                </section>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
