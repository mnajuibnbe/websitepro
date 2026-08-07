import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, FileImage, Loader2, ReceiptText, XCircle } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { supabase } from '../../lib/supabase';
import { formatCourseAmount } from '../../lib/pricing';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '../../lib/paymentProof';
import type { PricingCurrency } from '../../lib/pricing';

const SIGNED_URL_TTL_SECONDS = 300;

interface PendingSubmission {
  submission_id: string;
  order_id: string;
  method: PaymentMethod;
  reference_note: string | null;
  proof_image_url: string;
  submitted_at: string;
  student_name: string;
  student_email: string;
  course_title: string;
  amount: string;
  currency: PricingCurrency;
  signedProofUrl?: string;
}

type ReviewTarget = { row: PendingSubmission; decision: 'approved' | 'rejected' };

export function AdminPaymentReview() {
  const [sidebar, setSidebar] = useState(false);
  const [rows, setRows] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ReviewTarget | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toast = (type: ToastMessage['type'], message: string) => setToasts(current => [...current, { id: crypto.randomUUID(), type, message }]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_pending_payment_submissions');
    if (error) {
      toast('error', 'Unable to load pending payment submissions.');
      setLoading(false);
      return;
    }
    const submissions = (data || []) as PendingSubmission[];
    if (submissions.length > 0) {
      const { data: signed } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrls(submissions.map(row => row.proof_image_url), SIGNED_URL_TTL_SECONDS);
      submissions.forEach((row, index) => {
        row.signedProofUrl = signed?.[index]?.signedUrl;
      });
    }
    setRows(submissions);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async () => {
    if (!pending) return;
    if (pending.decision === 'rejected' && reason.trim().length < 3) return;
    setSaving(true);
    const { error } = await supabase.rpc('admin_review_payment_submission', {
      p_submission_id: pending.row.submission_id,
      p_decision: pending.decision,
      p_rejection_reason: pending.decision === 'rejected' ? reason.trim() : null,
    });
    setSaving(false);
    if (error) {
      toast('error', error.message || 'Unable to record this decision.');
      setPending(null);
      setReason('');
      await load();
      return;
    }
    toast('success', pending.decision === 'approved' ? 'Payment approved — course access activated.' : 'Payment rejected.');
    setPending(null);
    setReason('');
    setRows(current => current.filter(row => row.submission_id !== pending.row.submission_id));
  };

  return (
    <>
      <PortalLayout sidebar={<AdminSidebar isOpen={sidebar} setIsOpen={setSidebar} />}>
        <header className="mb-7">
          <p className="text-sm font-bold text-amber-700">Payment review</p>
          <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Payment proofs</h1>
          <p className="mt-1 text-primary-600">Approve activates the course immediately. Reject requires a reason the student can see.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-primary-200 p-4">
            <h2 className="text-lg font-bold text-primary-900">Pending submissions</h2>
            <span className="rounded-full bg-accent-100 px-3 py-1 text-sm font-bold text-accent-700">{rows.length} pending</span>
          </div>

          {loading ? (
            <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <ReceiptText className="mx-auto mb-3 h-10 w-10 text-primary-300" />
              <p className="font-bold text-primary-900">No pending payment proofs</p>
            </div>
          ) : (
            <div className="divide-y divide-primary-100">
              {rows.map(row => (
                <article key={row.submission_id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-shrink-0">
                      {row.signedProofUrl ? (
                        <a href={row.signedProofUrl} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden rounded-xl border border-primary-200">
                          <img src={row.signedProofUrl} alt={`Payment proof from ${row.student_name}`} className="h-full w-full object-cover" loading="lazy" />
                        </a>
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-300">
                          <FileImage className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-primary-900">{row.student_name}</h3>
                      <p className="break-all text-sm text-primary-600">{row.student_email}</p>
                      <p className="mt-1 font-semibold text-primary-800">{row.course_title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-full bg-primary-100 px-3 py-1 font-bold text-primary-700">{formatCourseAmount(row.amount, row.currency)}</span>
                        <span className="rounded-full bg-primary-100 px-3 py-1 font-bold text-primary-700">{PAYMENT_METHOD_LABELS[row.method]}</span>
                      </div>
                      {row.reference_note && <p className="mt-2 max-w-lg text-sm text-primary-600">"{row.reference_note}"</p>}
                      <p className="mt-2 text-xs text-primary-500">Submitted {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.submitted_at))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => { setPending({ row, decision: 'approved' }); setReason(''); }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-success-600 px-4 py-2 text-sm font-bold text-white hover:bg-success-700"
                    >
                      <CheckCircle className="h-4 w-4" />Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPending({ row, decision: 'rejected' }); setReason(''); }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-200 px-4 py-2 text-sm font-bold text-danger-700 hover:bg-danger-50"
                    >
                      <XCircle className="h-4 w-4" />Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </PortalLayout>

      {pending && (
        <ConfirmDialog
          open
          title={pending.decision === 'approved' ? 'Approve this payment?' : 'Reject this payment?'}
          description={
            pending.decision === 'approved'
              ? `${pending.row.student_name} will get immediate access to "${pending.row.course_title}".`
              : `${pending.row.student_name} will be able to see why their payment for "${pending.row.course_title}" was rejected.`
          }
          confirmLabel={pending.decision === 'approved' ? 'Approve and activate' : 'Reject payment'}
          confirmTone={pending.decision === 'approved' ? 'primary' : 'danger'}
          busy={saving}
          onCancel={() => { setPending(null); setReason(''); }}
          onConfirm={() => void decide()}
        >
          {pending.decision === 'rejected' && (
            <label className="mt-4 block text-sm font-bold text-primary-800">
              Reason for the student <span className="text-danger-600">*</span>
              <textarea
                autoFocus
                value={reason}
                onChange={event => setReason(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-primary-200 p-3 font-normal"
                placeholder="E.g. the amount doesn't match the order, or the screenshot is unreadable"
              />
              {reason.length > 0 && reason.trim().length < 3 && <span className="mt-1 flex items-center gap-1 text-sm text-danger-600"><AlertCircle className="h-3.5 w-3.5" />Enter at least 3 characters.</span>}
            </label>
          )}
        </ConfirmDialog>
      )}
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(current => current.filter(item => item.id !== id))} />
    </>
  );
}
