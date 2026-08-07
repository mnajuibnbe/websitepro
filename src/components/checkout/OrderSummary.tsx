import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PaymentInstructions } from './PaymentInstructions';
import { getOrderReference } from '../../lib/orderReference';
import type { PricingCurrency } from '../../lib/pricing';

interface OrderSummaryProps {
  courseId?: string;
  title: string;
  thumbnail?: string;
  price: string;
  available: boolean;
}

interface CreatedOrder {
  id: string;
  amount: string;
  currency: PricingCurrency;
  enrollment_status: string;
}

export function OrderSummary({ courseId, title, thumbnail, price, available }: OrderSummaryProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [order, setOrder] = useState<CreatedOrder | null>(null);

  const handleCheckout = async () => {
    if (!courseId || !available) return;
    setStatus('processing');
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'We could not create your order.');
      setOrder(payload.order ? { ...payload.order, amount: String(payload.order.amount) } : null);
      setStatus('success');
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'We could not create your order.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    const isActive = order?.enrollment_status === 'active';
    return (
      <section aria-live="polite" className="rounded-2xl border border-success-200 bg-white p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" aria-hidden="true" />
        <h2 className="mb-2 text-2xl font-bold text-primary-900">Order received</h2>
        {isActive ? (
          <p className="mb-6 text-primary-600">You're all set — this course is now active in your dashboard.</p>
        ) : (
          <>
            <p className="mb-6 text-primary-600">Complete your payment below to activate this course. You can also find these details anytime in your dashboard.</p>
            {order && (
              <div className="mb-6 text-left">
                <PaymentInstructions amount={order.amount} currency={order.currency} reference={getOrderReference(order.id)} />
              </div>
            )}
          </>
        )}
        <Button variant="primary" className="w-full" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
      </section>
    );
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-lg lg:sticky lg:top-28" aria-labelledby="order-summary-title">
      <div className="p-6 md:p-8">
        <h2 id="order-summary-title" className="mb-6 text-xl font-bold text-primary-900">Order summary</h2>
        <div className="mb-6 flex gap-4 border-b border-primary-100 pb-6">
          <OptimizedImage src={thumbnail || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop'} alt="" displayWidth={200} width="80" height="80" className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />
          <div><h3 className="mb-1 font-bold leading-snug text-primary-900">{title}</h3><p className="text-sm text-primary-500">Lifetime course access</p></div>
        </div>
        <dl className="mb-6 space-y-4 border-b border-primary-100 pb-6">
          <div className="flex justify-between text-primary-600"><dt>Course price</dt><dd className="font-medium">{price}</dd></div>
          <div className="flex justify-between border-t border-primary-100 pt-4 text-lg font-bold text-primary-900"><dt>Total</dt><dd>{price}</dd></div>
        </dl>
        {status === 'error' && <p role="alert" className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm font-medium text-danger-600">{error}</p>}
        <Button variant="primary" className="h-14 w-full text-lg font-bold" onClick={handleCheckout} disabled={!courseId || !available || status === 'processing'}>
          {status === 'processing' ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Creating secure order…</span> : available ? `Place order · ${price}` : 'Price unavailable'}
        </Button>
        <div className="mt-5 flex items-start justify-center gap-2 text-center text-xs font-medium text-primary-500"><ShieldCheck className="h-4 w-4 flex-shrink-0 text-accent-600" aria-hidden="true" /><span>The server verifies course availability, currency, and price before creating the order.</span></div>
      </div>
    </aside>
  );
}
