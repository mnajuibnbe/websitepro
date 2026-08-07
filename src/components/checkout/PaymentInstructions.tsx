import { useState } from 'react';
import { Landmark, Smartphone, MessageCircle, Copy, Check } from 'lucide-react';
import { formatCourseAmount, type PricingCurrency } from '../../lib/pricing';

const SUPPORT_WHATSAPP_DISPLAY = '01018333177';
const SUPPORT_WHATSAPP_LINK = 'https://wa.me/201018333177';

const PAYMENT_METHODS = [
  {
    icon: Landmark,
    label: 'Bank transfer',
    lines: [
      { text: 'Banuqe Maser' },
      { text: 'Aya Abdelwhab Mohame' },
      { text: '111222333444', copyable: true },
    ],
  },
  {
    icon: Smartphone,
    label: 'InstaPay',
    lines: [{ text: '01018333177', copyable: true }],
  },
  {
    icon: Smartphone,
    label: 'Vodafone Cash',
    lines: [{ text: '010183331777', copyable: true }],
  },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser; the value is still visible to copy manually.
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-50"
      aria-label={`Copy ${value}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

interface PaymentInstructionsProps {
  amount: string;
  currency: PricingCurrency;
  reference?: string;
}

export function PaymentInstructions({ amount, currency, reference }: PaymentInstructionsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary-50 p-4">
        <p className="text-sm font-medium text-primary-500">Amount due</p>
        <p className="text-2xl font-bold text-primary-900" dir="ltr">{formatCourseAmount(amount, currency)}</p>
      </div>

      {reference ? (
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4">
          <p className="mb-1 text-sm font-semibold text-accent-900">Payment reference</p>
          <p className="mb-2 text-xs text-accent-700">Include this exact reference in your transfer note so we can match your payment to this order.</p>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
            <span className="font-mono text-lg font-bold tracking-wide text-primary-900" dir="ltr">{reference}</span>
            <CopyButton value={reference} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-primary-600">You'll receive a short payment reference once your order is placed — include it with your transfer.</p>
      )}

      <div className="space-y-3">
        {PAYMENT_METHODS.map(method => (
          <div key={method.label} className="flex items-start gap-3 rounded-xl border border-primary-200 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
              <method.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-primary-900">{method.label}</p>
              <dl className="mt-1 space-y-1">
                {method.lines.map(line => (
                  <div key={line.text} className="flex items-center justify-between gap-2">
                    <dd className="truncate text-sm text-primary-600" dir="ltr">{line.text}</dd>
                    {line.copyable && <CopyButton value={line.text} />}
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>

      <a
        href={SUPPORT_WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-primary-200 p-4 text-sm text-primary-600 hover:border-accent-300 hover:bg-accent-50"
      >
        <MessageCircle className="h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" />
        <span>Need help? Message support on WhatsApp: <span className="font-semibold text-primary-900" dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span></span>
      </a>
    </div>
  );
}
