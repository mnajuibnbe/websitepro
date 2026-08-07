import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { Badge } from '../ui/Badge';
import { PaymentInstructions } from '../checkout/PaymentInstructions';
import { PaymentProofUpload } from '../checkout/PaymentProofUpload';
import { deriveOrderStatus, type SubmissionStatus } from '../../lib/orderStatus';
import { getOrderReference } from '../../lib/orderReference';
import type { PricingCurrency } from '../../lib/pricing';

interface OrderRow {
  id: string;
  course_id: string;
  amount: string;
  currency: PricingCurrency;
  payment_status: string;
  enrollment_status: string;
  courseTitle: string;
  courseThumbnail?: string;
  latestSubmissionStatus?: SubmissionStatus | null;
  latestRejectionReason?: string | null;
}

export function OrdersStatusList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      try {
        setIsLoading(true);
        setError(false);

        const { data: ordersData, error: ordersError } = await supabase
          .from('course_orders')
          .select('id, course_id, amount, currency, payment_status, enrollment_status, created_at')
          .eq('user_id', user.id)
          .neq('enrollment_status', 'active')
          .order('created_at', { ascending: false });
        if (ordersError) throw ordersError;
        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          return;
        }

        const courseIds = Array.from(new Set(ordersData.map(o => String(o.course_id))));
        const orderIds = ordersData.map(o => String(o.id));

        const [{ data: coursesData, error: coursesError }, { data: submissionsData, error: submissionsError }] = await Promise.all([
          supabase.from('courses').select('id, title, thumbnail').in('id', courseIds),
          supabase.from('payment_submissions').select('order_id, status, submitted_at, rejection_reason').in('order_id', orderIds).order('submitted_at', { ascending: false }),
        ]);
        if (coursesError) throw coursesError;
        if (submissionsError) throw submissionsError;

        const latestSubmissionByOrder: Record<string, SubmissionStatus> = {};
        const latestRejectionReasonByOrder: Record<string, string | null> = {};
        (submissionsData || []).forEach(submission => {
          const orderId = String(submission.order_id);
          if (!(orderId in latestSubmissionByOrder)) {
            latestSubmissionByOrder[orderId] = submission.status as SubmissionStatus;
            latestRejectionReasonByOrder[orderId] = submission.rejection_reason;
          }
        });

        const merged: OrderRow[] = ordersData.map(order => {
          const course = (coursesData || []).find(c => String(c.id) === String(order.course_id));
          return {
            id: String(order.id),
            course_id: String(order.course_id),
            amount: String(order.amount),
            currency: order.currency as PricingCurrency,
            payment_status: order.payment_status,
            enrollment_status: order.enrollment_status,
            courseTitle: course?.title || 'Course',
            courseThumbnail: course?.thumbnail || undefined,
            latestSubmissionStatus: latestSubmissionByOrder[String(order.id)] ?? null,
            latestRejectionReason: latestRejectionReasonByOrder[String(order.id)] ?? null,
          };
        });

        setOrders(merged);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-danger-600 flex gap-2"><AlertCircle /> Unable to complete this action.</div>;
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-primary-900 mb-6">Order status</h3>
      <div className="space-y-4">
        {orders.map(order => {
          const statusInfo = deriveOrderStatus(order);
          const isExpanded = expandedOrderId === order.id;
          const canShowInstructions = statusInfo.key === 'awaiting_payment' || statusInfo.key === 'rejected' || statusInfo.key === 'failed';
          return (
            <div key={order.id} className="bg-white border border-primary-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <OptimizedImage
                  src={order.courseThumbnail || 'https://images.unsplash.com/photo-1556228720-192a6af4e86e?q=80&w=400&auto=format&fit=crop'}
                  alt=""
                  displayWidth={200}
                  width="80"
                  height="80"
                  className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-primary-900 truncate">{order.courseTitle}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={statusInfo.badgeVariant}>{statusInfo.label}</Badge>
                  </div>
                </div>
                {canShowInstructions && (
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="flex flex-shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-accent-700 hover:bg-accent-50"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Hide details' : 'View payment details'}
                    {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                  </button>
                )}
              </div>
              {!canShowInstructions && (
                <p className="px-4 pb-4 text-sm text-primary-600">{statusInfo.description}</p>
              )}
              {isExpanded && canShowInstructions && (
                <div className="border-t border-primary-100 p-4">
                  <p className="mb-4 text-sm text-primary-600">{statusInfo.description}</p>
                  <PaymentInstructions amount={order.amount} currency={order.currency} reference={getOrderReference(order.id)} />
                  <PaymentProofUpload
                    orderId={order.id}
                    currency={order.currency}
                    hasPendingSubmission={order.latestSubmissionStatus === 'pending'}
                    onSubmitted={() => setOrders(current => current.map(o => (o.id === order.id ? { ...o, latestSubmissionStatus: 'pending' } : o)))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
