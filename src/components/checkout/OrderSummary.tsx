import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePricingContext } from '../../contexts/PricingContext';
import { resolveCoursePrice } from '../../lib/pricing';
import type { Course } from '../../types/database.types';

export function OrderSummary() {
  const [params] = useSearchParams();
  const courseId = params.get('courseId');
  const { token } = useAuth();
  const context = usePricingContext();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) { setError('Select a course before checkout.'); return; }
    supabase.from('courses').select('*').eq('id', courseId).eq('status', 'published').single()
      .then(({ data, error }) => error ? setError('Course is unavailable.') : setCourse(data));
  }, [courseId]);

  const price = resolveCoursePrice(course || {}, context);
  async function createOrder() {
    if (!courseId || !token || !price.available) return;
    setIsProcessing(true); setError(null);
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout failed');
      navigate('/dashboard', { state: { orderId: result.order.id } });
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Checkout failed'); }
    finally { setIsProcessing(false); }
  }

  return <div className="bg-white border border-primary-200 rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-28">
    <div className="p-6 md:p-8">
      <h2 className="text-xl font-bold text-primary-900 mb-6">Order summary</h2>
      {course && <div className="flex gap-4 mb-6 pb-6 border-b border-primary-100">
        <img src={course.thumbnail || 'https://placehold.co/200x200?text=Course'} alt="" className="w-20 h-20 rounded-lg object-cover" />
        <div><h3 className="font-bold text-primary-900">{course.title}</h3><p className="text-sm text-primary-500">{context.countryGroup === 'egypt' ? 'Egypt pricing' : 'International pricing'}</p></div>
      </div>}
      <div className="flex justify-between text-lg font-bold mb-6"><span>Total</span><span>{price.formatted}</span></div>
      {error && <p role="alert" className="text-sm text-danger-600 mb-4">{error}</p>}
      <Button variant="primary" className="w-full h-14" disabled={!course || !price.available || isProcessing} onClick={createOrder}>
        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : price.isFree ? 'Enroll for Free' : `Create order — ${price.formatted}`}
      </Button>
      <div className="flex gap-2 text-xs text-primary-500 mt-6"><ShieldCheck className="w-4 h-4" /><span>The server revalidates the regional price; browser totals are not authoritative.</span></div>
    </div>
  </div>;
}
