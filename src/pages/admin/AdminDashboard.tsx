import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { CheckCircle, Loader2, CheckCircle2, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCourseAmount } from '../../lib/pricing';
import { PageContainer } from '../../components/layout/PageContainer';

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
  order?: { id: string; amount: string; currency: 'EGP' | 'USD' } | null;
}

interface WorkflowHealth {
  checked_at: string;
  missing_managed_covers: number;
  open_blocking_findings: number;
  overdue_unfinished_reviews: number;
  submitted_without_revision: number;
  approved_instructor_role_drift: number;
  inactive_instructor_public_profiles: number;
  published_without_approved_revision: number;
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
  const [toastMessage, setToastMessage] = useState('Order');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [workflowHealth, setWorkflowHealth] = useState<WorkflowHealth | null>(null);
  const [workflowHealthError, setWorkflowHealthError] = useState(false);

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
      setWorkflowHealthError(false);
      const { data: health, error: healthError } = await supabase.rpc('admin_get_workflow_health');
      if (healthError) setWorkflowHealthError(true);
      else setWorkflowHealth((health || null) as WorkflowHealth | null);
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
        setErrorMsg('Order.');
      }

      if (data) {
        // Supabase typings can sometimes return an array for relations if it thinks it's one-to-many,
        // but since users/courses are foreign keys on enrollments (many-to-one), they should be objects.
        // We cast as any to handle potential TS mismatches if the generated types differ, but the runtime shape is correct.
        const pending = data as any as PendingEnrollment[];
        const { data: orders } = await supabase.from('course_orders').select('id,user_id,course_id,amount,currency,created_at').eq('enrollment_status', 'pending').order('created_at', { ascending: false });
        const keyed = new Map<string, any>();
        (orders || []).forEach(order => { const key = `${order.user_id}:${order.course_id}`; if (!keyed.has(key)) keyed.set(key, order); });
        setPendingEnrollments(pending.map(item => ({ ...item, order: keyed.get(`${item.user_id}:${item.course_id}`) || null })));
      }
    } catch (e) {
      console.error('Exception during fetch:', e);
      setErrorMsg('Error.');
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
        const enrollment = pendingEnrollments.find(item => item.id === id);
        if (enrollment?.order) await supabase.from('course_orders').update({ enrollment_status: status, updated_at: new Date().toISOString() }).eq('id', enrollment.order.id);
        setPendingEnrollments(prev => prev.filter(e => e.id !== id));
        setToastMessage(status === 'active' ? 'Order' : 'Order');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setErrorMsg('Please review the information and try again.');
        console.error('Enrollment decision did not update a pending row:', error || { id, status });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Error.');
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

      <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <main id="main-content" className="pt-20 pb-24 transition-all duration-300 lg:pl-72 lg:pt-8">
          <PageContainer>
            <h1 className="text-3xl font-bold text-primary-900 mb-8">Admin overview</h1>

            <section className="mb-8 rounded-2xl border border-primary-200 bg-white p-6 shadow-sm" aria-labelledby="workflow-health-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="workflow-health-title" className="flex items-center gap-2 text-xl font-bold text-primary-900"><ShieldCheck className="h-5 w-5 text-accent-600" />Course workflow health</h2><p className="mt-1 text-sm text-primary-600">Live integrity checks for authoring, review, and publication.</p></div><Link to="/admin/course-reviews" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary-200 px-4 font-bold text-primary-800">Open review queue</Link></div>
              {workflowHealthError ? <div role="alert" className="mt-4 rounded-xl border border-danger-200 bg-danger-50 p-4"><p className="font-bold text-danger-700">Workflow health could not be loaded.</p><button type="button" onClick={() => void loadPendingEnrollments()} className="mt-2 min-h-11 rounded-lg border border-danger-200 px-4 font-bold">Retry</button></div> : workflowHealth ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
                ['Reviews overdue', workflowHealth.overdue_unfinished_reviews],
                ['Blocking findings', workflowHealth.open_blocking_findings],
                ['Submitted without revision', workflowHealth.submitted_without_revision],
                ['Published without approved revision', workflowHealth.published_without_approved_revision],
                ['Unmanaged published covers', workflowHealth.missing_managed_covers],
                ['Instructor role drift', workflowHealth.approved_instructor_role_drift],
                ['Inactive instructor profiles', workflowHealth.inactive_instructor_public_profiles],
              ].map(([label, value]) => <div key={String(label)} className={`rounded-xl border p-4 ${Number(value) > 0 ? 'border-amber-200 bg-amber-50' : 'border-success-200 bg-success-100'}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold text-primary-700">{label}</p></div>)}</div> : <p role="status" className="mt-4 text-sm text-primary-500">Loading workflow health…</p>}
              {workflowHealth && <p className="mt-3 text-xs text-primary-500">Last checked {new Date(workflowHealth.checked_at).toLocaleString()}</p>}
            </section>

            {errorMsg && (
              <div className="mb-6 bg-danger-50 text-danger-700 px-6 py-4 rounded-xl border border-danger-200 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="font-bold">{errorMsg}</p>
                <button
                  onClick={loadPendingEnrollments}
                  className="mr-auto text-sm bg-white px-4 py-2 rounded-lg border border-danger-200 hover:bg-danger-100 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-primary-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary-900">Enrollment requests</h2>
                <span className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm font-bold">
                  {pendingEnrollments.length} pending requests
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-primary-50 border-b border-primary-200">
                    <tr>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700">Student</th>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700">Course</th>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700">Requested</th>
                      <th className="py-4 px-6 text-sm font-bold text-primary-700 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <Loader2 className="w-8 h-8 text-accent-600 animate-spin mx-auto mb-4" />
                          <p className="text-primary-500 font-medium">Loading...</p>
                        </td>
                      </tr>
                    ) : pendingEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-primary-500 font-medium">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      pendingEnrollments.map((enrollment) => {
                        const studentName = enrollment.users?.full_name || 'Not Found';
                        const studentEmail = enrollment.users?.email || '';
                        const courseTitle = enrollment.courses?.title || 'Not Found';
                        const date = enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('ar-EG') : 'Not available';

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
                              {enrollment.order && <div className="text-xs text-primary-500 mt-1">Original order: {formatCourseAmount(String(enrollment.order.amount), enrollment.order.currency)}</div>}
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
                                title={(!enrollment.users || !enrollment.courses) ? 'Student or course data is unavailable' : 'Approve enrollment'}
                                aria-label={`Approve enrollment for ${studentName} in ${courseTitle}`}
                              >
                                {actionLoadingId === enrollment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecision(enrollment.id, 'cancelled')}
                                disabled={actionLoadingId === enrollment.id || !enrollment.users || !enrollment.courses}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-danger-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject enrollment"
                                aria-label={`Reject enrollment for ${studentName} in ${courseTitle}`}
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
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
          </PageContainer>
        </main>
      </div>
    </>
  );
}
