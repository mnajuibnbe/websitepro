import { CreditCard, Info, ShieldCheck } from 'lucide-react';

export function PaymentMethod() {
  return (
    <section className="mb-8 rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8" aria-labelledby="payment-heading">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><CreditCard className="h-5 w-5" aria-hidden="true" /></div>
        <div><h2 id="payment-heading" className="text-xl font-bold text-primary-900">Payment and enrollment</h2><p className="text-sm text-primary-500">Your final price is verified securely.</p></div>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-primary-600">
        <p className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-info-500" aria-hidden="true" /><span>After you place the order, Tutiba will show the current enrollment status in your dashboard and provide any required payment instructions.</span></p>
        <p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" /><span>Tutiba does not collect card numbers on this page. Never send payment credentials through email or support messages.</span></p>
      </div>
    </section>
  );
}
