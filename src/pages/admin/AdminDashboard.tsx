import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { CheckCircle, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PendingEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  users: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  courses: {
    id: string;
    title: string;
  } | null;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('تم اعتماد الطلب بنجاح');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsCheckingAuth(false);
    loadPendingEnrollments();
  }

  async function loadPendingEnrollments() {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          course_id,
          status,
          enrolled_at,
          users (
            id,
            full_name,
            email
          ),
          courses (
            id,
            title
          )
        `)
        .eq('status', 'pending')
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
        setErrorMsg('حدث خطأ أثناء تحميل الطلبات.');
      }
      
      if (data) {
        // Supabase typings can sometimes return an array for relations if it thinks it's one-to-many, 
        // but since users/courses are foreign keys on enrollments (many-to-one), they should be objects.
        // We cast as any to handle potential TS mismatches if the generated types differ, but the runtime shape is correct.
        setPendingEnrollments(data as any as PendingEnrollment[]);
      }
    } catch (e) {
      console.error('Exception during fetch:', e);
      setErrorMsg('حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDecision = async (id: string, status: 'active' | 'cancelled') => {
    try {
      setActionLoadingId(id);
      setErrorMsg(null);
      const { data: updatedEnrollment, error } = await supabase
        .from('enrollments')
        .update({ status })
        .eq('id', id)
        .eq('status', 'pending')
        .select('id, status')
        .maybeSingle();
        
      if (!error && updatedEnrollment?.status === status) {
        setPendingEnrollments(prev => prev.filter(e => e.id !== id));
        setToastMessage(status === 'active' ? 'تم اعتماد الطلب بنجاح' : 'تم رفض الطلب');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setErrorMsg('فشل في اعتماد الطلب، يرجى المحاولة مرة أخرى.');
        console.error('Enrollment decision did not update a pending row:', error || { id, status });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('حدث خطأ أثناء الاعتماد.');
    } finally {
      setActionLoadingId(null);
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showToast && (
        <div className="fixed bottom-4 left-4 z-[100] bg-white border border-success-200 text-success-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CheckCircle2 className="w-6 h-6 text-success-600" />
          <p className="font-bold">{toastMessage}</p>
        </div>
      )}
      
      <div className="min-h-screen bg-primary-50 font-sans rtl" dir="rtl">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="lg:pr-72 pt-8 pb-24 transition-all duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-primary-900 mb-8">لوحة الاعتمادات (إدارة الطلبات)</h1>
            
            {errorMsg && (
              <div className="mb-6 bg-danger-50 text-danger-700 px-6 py-4 rounded-xl border border-danger-200 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="font-bold">{errorMsg}</p>
                <button 
                  onClick={loadPendingEnrollments}
                  className="mr-auto text-sm bg-white px-4 py-2 rounded-lg border border-danger-200 hover:bg-danger-100 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden mb-8">
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
                      <th className="py-4 px-6 text-sm font-bold text-primary-700">الطالب</th>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700">الكورس</th>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700">تاريخ الطلب</th>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <Loader2 className="w-8 h-8 text-accent-600 animate-spin mx-auto mb-4" />
                          <p className="text-primary-500 font-medium">جاري تحميل الطلبات...</p>
                        </td>
                      </tr>
                    ) : pendingEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-primary-500 font-medium">
                          لا توجد طلبات معلقة حالياً
                        </td>
                      </tr>
                    ) : (
                      pendingEnrollments.map((enrollment) => {
                        const studentName = enrollment.users?.full_name || 'مستخدم غير موجود';
                        const studentEmail = enrollment.users?.email || '';
                        const courseTitle = enrollment.courses?.title || 'كورس غير موجود';
                        const date = enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('ar-EG') : 'غير متوفر';

                        return (
                          <tr key={enrollment.id} className="hover:bg-primary-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${!enrollment.users ? 'text-danger-600' : 'text-primary-900'}`}>
                                  {studentName}
                                </span>
                                {studentEmail && (
                                  <span className="text-xs text-primary-500 mt-1">{studentEmail}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm">
                              <span className={`font-bold ${!enrollment.courses ? 'text-danger-600' : 'text-primary-900'}`}>
                                {courseTitle}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-primary-500 font-medium" dir="ltr" style={{textAlign: 'right'}}>
                              {date}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex flex-nowrap items-center justify-center gap-2 min-w-max">
                              <button
                                onClick={() => handleDecision(enrollment.id, 'active')}
                                disabled={actionLoadingId === enrollment.id || !enrollment.users || !enrollment.courses}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={(!enrollment.users || !enrollment.courses) ? "لا يمكن الاعتماد لعدم اكتمال البيانات" : "اعتماد الطلب"}
                              >
                                {actionLoadingId === enrollment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                اعتماد
                              </button>
                              <button
                                onClick={() => handleDecision(enrollment.id, 'cancelled')}
                                disabled={actionLoadingId === enrollment.id || !enrollment.users || !enrollment.courses}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-danger-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="رفض الطلب"
                              >
                                <XCircle className="w-4 h-4" />
                                رفض
                              </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
