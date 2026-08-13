import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Loader2, ShieldCheck, ReceiptText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageContainer } from '../../components/layout/PageContainer';

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [workflowHealth, setWorkflowHealth] = useState<WorkflowHealth | null>(null);
  const [workflowHealthError, setWorkflowHealthError] = useState(false);
  const [pendingPaymentCount, setPendingPaymentCount] = useState<number | null>(null);
  const [pendingPaymentError, setPendingPaymentError] = useState(false);

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
    loadDashboard();
  }

  async function loadDashboard() {
    setWorkflowHealthError(false);
    setPendingPaymentError(false);

    const { data: health, error: healthError } = await supabase.rpc('admin_get_workflow_health');
    if (healthError) setWorkflowHealthError(true);
    else setWorkflowHealth((health || null) as WorkflowHealth | null);

    const { data: submissions, error: submissionsError } = await supabase.rpc('admin_list_pending_payment_submissions');
    if (submissionsError) setPendingPaymentError(true);
    else setPendingPaymentCount(Array.isArray(submissions) ? submissions.length : 0);
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main id="main-content" className="pt-20 pb-24 transition-all duration-300 lg:pl-72 lg:pt-8">
        <PageContainer>
          <h1 className="text-3xl font-bold text-primary-900 mb-8">Admin overview</h1>

          <section className="mb-8 rounded-2xl border border-primary-200 bg-white p-6 shadow-sm" aria-labelledby="payment-review-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="payment-review-title" className="flex items-center gap-2 text-xl font-bold text-primary-900"><ReceiptText className="h-5 w-5 text-accent-600" />Payment review</h2>
                <p className="mt-1 text-sm text-primary-600">A paid enrollment activates only after its payment proof is approved here — there is no other way to grant access.</p>
              </div>
              <Link to="/admin/payment-proofs" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 font-bold text-white hover:bg-accent-700">
                {pendingPaymentCount ? `Review ${pendingPaymentCount} pending` : 'Open payment review'}
              </Link>
            </div>
            {pendingPaymentError && <p role="alert" className="mt-3 text-sm text-danger-600">Pending count could not be loaded.</p>}
          </section>

          <section className="mb-8 rounded-2xl border border-primary-200 bg-white p-6 shadow-sm" aria-labelledby="workflow-health-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="workflow-health-title" className="flex items-center gap-2 text-xl font-bold text-primary-900"><ShieldCheck className="h-5 w-5 text-accent-600" />Course workflow health</h2><p className="mt-1 text-sm text-primary-600">Live integrity checks for authoring, review, and publication.</p></div><Link to="/admin/course-reviews" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary-200 px-4 font-bold text-primary-800">Open review queue</Link></div>
            {workflowHealthError ? <div role="alert" className="mt-4 rounded-xl border border-danger-200 bg-danger-50 p-4"><p className="font-bold text-danger-700">Workflow health could not be loaded.</p><button type="button" onClick={() => void loadDashboard()} className="mt-2 min-h-11 rounded-lg border border-danger-200 px-4 font-bold">Retry</button></div> : workflowHealth ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
              ['Reviews overdue', workflowHealth.overdue_unfinished_reviews],
              ['Blocking findings', workflowHealth.open_blocking_findings],
              ['Submitted without revision', workflowHealth.submitted_without_revision],
              ['Published without approved revision', workflowHealth.published_without_approved_revision],
              ['Unmanaged published covers', workflowHealth.missing_managed_covers],
              ['Instructor role drift', workflowHealth.approved_instructor_role_drift],
              ['Inactive instructor profiles', workflowHealth.inactive_instructor_public_profiles],
            ].map(([label, value]) => <div key={String(label)} className={`rounded-xl border p-4 ${Number(value) > 0 ? 'border-warning-200 bg-warning-50' : 'border-success-200 bg-success-100'}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold text-primary-700">{label}</p></div>)}</div> : <p role="status" className="mt-4 text-sm text-primary-500">Loading workflow health…</p>}
            {workflowHealth && <p className="mt-3 text-xs text-primary-500">Last checked {new Date(workflowHealth.checked_at).toLocaleString('en')}</p>}
          </section>
        </PageContainer>
      </main>
    </div>
  );
}
