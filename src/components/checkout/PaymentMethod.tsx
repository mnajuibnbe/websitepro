import { CreditCard, ShieldCheck } from 'lucide-react';
import { PaymentInstructions } from './PaymentInstructions';
import type { LocalizedCoursePrice } from '../../lib/pricing';

interface PaymentMethodProps {
  price: LocalizedCoursePrice;
}

export function PaymentMethod({ price }: PaymentMethodProps) {
  return (
    <section className="mb-8 rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8" aria-labelledby="payment-heading">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><CreditCard className="h-5 w-5" aria-hidden="true" /></div>
        <div><h2 id="payment-heading" className="text-xl font-bold text-primary-900">Payment and enrollment</h2><p className="text-sm text-primary-500">Pay by bank transfer, InstaPay, or Vodafone Cash — no card required.</p></div>
      </div>

      {price.isFree ? (
        <p className="mb-4 text-sm text-primary-600">This course is free. You'll get instant access as soon as you place your order.</p>
      ) : price.available && price.amount ? (
        <div className="mb-4">
          <PaymentInstructions amount={price.amount} currency={price.currency} />
        </div>
      ) : (
        <p className="mb-4 text-sm text-danger-600">Price unavailable — contact support before placing your order.</p>
      )}

      <p className="flex items-start gap-3 text-sm leading-relaxed text-primary-600">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" />
        <span>Tutiba does not collect card numbers on this page. Never send payment credentials through email or support messages.</span>
      </p>
    </section>
  );
}
