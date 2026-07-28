import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Sidebar } from '../components/dashboard/Sidebar';

export function UserProfile() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm border border-primary-200 p-8 md:p-10">
            <div className="flex items-center gap-6 mb-10 pb-8 border-b border-primary-100">
              <div className="w-24 h-24 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 text-3xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-900 mb-2">{user?.name || 'User'}</h1>
                <p className="text-primary-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span dir="ltr">{user?.email || 'user@example.com'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-primary-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent-600" />
                  Account
                </h2>
                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100">
                  <p className="text-primary-700 mb-4">Update your password and account security settings.</p>
                  <Button variant="secondary" className="bg-white">Password</Button>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-primary-900 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent-600" />
                  Account Settings
                </h2>
                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-primary-700 font-medium">Courses</span>
                    <input type="checkbox" className="w-5 h-5 accent-accent-600" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-700 font-medium">Lessons</span>
                    <input type="checkbox" className="w-5 h-5 accent-accent-600" defaultChecked />
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-10 flex justify-end">
              <Button variant="primary" className="px-8">Save</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
