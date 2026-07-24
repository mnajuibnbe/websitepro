const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Users, BookOpen, DollarSign, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user || userData.user.email !== 'm.najuib.nbe@gmail.com') {
        onNavigate('#/dashboard');
        return;
      }
      
      setIsCheckingAuth(false);
      loadPendingEnrollments();
    } catch (e) {
      console.error(e);
      onNavigate('#/dashboard');
    }
  }

  async function loadPendingEnrollments() {
    try {
      setIsLoading(true);
      // Since we don't have direct access to auth.users in standard client querying without admin role, 
      // we'll fetch enrollments and just show user_id if we don't have a profiles table.
      // Or we can try to fetch the course details.
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(title)')
        .eq('status', 'pending');
        
      if (data) {
        setPendingEnrollments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setActionLoadingId(id);
      const { error } = await supabase
        .from('enrollments')
        .update({ status: 'active' })
        .eq('id', id);
        
      if (!error) {
        setPendingEnrollments(prev => prev.filter(e => e.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-8">لوحة الاعتمادات</h1>
          
          <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-primary-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-900">طلبات الاشتراك المعلقة</h2>
              <span className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm font-bold">
                {pendingEnrollments.length} طلبات
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-primary-50 border-b border-primary-200">
                  <tr>
                    <th className="py-4 px-6 text-sm font-bold text-primary-700">معرف المستخدم</th>
                    <th className="py-4 px-6 text-sm font-bold text-primary-700">الكورس</th>
                    <th className="py-4 px-6 text-sm font-bold text-primary-700">تاريخ الطلب</th>
                    <th className="py-4 px-6 text-sm font-bold text-primary-700 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <Loader2 className="w-8 h-8 text-accent-600 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : pendingEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-primary-500 font-medium">
                        لا توجد طلبات معلقة حالياً
                      </td>
                    </tr>
                  ) : (
                    pendingEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm text-primary-900 font-medium font-mono" dir="ltr">
                          {enrollment.user_id.substring(0, 8)}...
                        </td>
                        <td className="py-4 px-6 text-sm text-primary-900 font-bold">
                          {enrollment.courses?.title || 'كورس غير معروف'}
                        </td>
                        <td className="py-4 px-6 text-sm text-primary-500">
                          {new Date(enrollment.created_at || new Date()).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleApprove(enrollment.id)}
                            disabled={actionLoadingId === enrollment.id}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {actionLoadingId === enrollment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            اعتماد
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
