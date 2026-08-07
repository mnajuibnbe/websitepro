import { ChangeEvent, FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SUPPORT_WHATSAPP_DISPLAY } from './PaymentInstructions';
import { getOrderReference } from '../../lib/orderReference';
import {
  PAYMENT_METHOD_LABELS,
  REFERENCE_NOTE_MAX_LENGTH,
  buildPaymentProofPath,
  getAvailablePaymentMethods,
  validatePaymentProofFile,
  type PaymentMethod,
} from '../../lib/paymentProof';
import type { PricingCurrency } from '../../lib/pricing';

interface PaymentProofUploadProps {
  orderId: string;
  currency: PricingCurrency;
  hasPendingSubmission: boolean;
  onSubmitted?: () => void;
}

type SubmitFailureKind = 'upload' | 'insert';

export function PaymentProofUpload({ orderId, currency, hasPendingSubmission, onSubmitted }: PaymentProofUploadProps) {
  const { user } = useAuth();
  const methods = getAvailablePaymentMethods(currency);
  const [method, setMethod] = useState<PaymentMethod>(methods[0]);
  const [referenceNote, setReferenceNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailure, setSubmitFailure] = useState<SubmitFailureKind | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(null);
    setFileError(null);
    if (!selected) return;
    const validationError = validatePaymentProofFile(selected);
    if (validationError) { setFileError(validationError); return; }
    setFile(selected);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || submitting) return;
    if (!file) { setFileError('Select an image of your payment proof.'); return; }
    const validationError = validatePaymentProofFile(file);
    if (validationError) { setFileError(validationError); return; }

    setSubmitting(true);
    setSubmitFailure(null);

    const path = buildPaymentProofPath(user.id, file.type);
    let uploaded = false;
    try {
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploaded = true;

      const { error: insertError } = await supabase.from('payment_submissions').insert({
        order_id: orderId,
        method,
        reference_note: referenceNote.trim() ? referenceNote.trim() : null,
        proof_image_url: path,
        status: 'pending',
      });
      if (insertError) throw insertError;

      setJustSubmitted(true);
      onSubmitted?.();
    } catch {
      if (uploaded) {
        await supabase.storage.from('payment-proofs').remove([path]);
        setSubmitFailure('insert');
      } else {
        setSubmitFailure('upload');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (hasPendingSubmission || justSubmitted) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 p-4">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-primary-900">Payment proof submitted</p>
          <p className="mt-1 text-sm text-primary-600">We're reviewing your payment. This usually takes 24-48 hours — no need to submit again.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} className="space-y-4 border-t border-primary-100 pt-5">
      <p className="text-sm font-bold text-primary-900">Upload proof of payment</p>

      <label className="block text-sm font-semibold text-primary-700">
        Payment method
        <select
          value={method}
          onChange={event => setMethod(event.target.value as PaymentMethod)}
          disabled={submitting}
          className="mt-1 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {methods.map(value => <option key={value} value={value}>{PAYMENT_METHOD_LABELS[value]}</option>)}
        </select>
      </label>

      <label className="block text-sm font-semibold text-primary-700">
        Reference note (optional)
        <textarea
          value={referenceNote}
          onChange={event => setReferenceNote(event.target.value)}
          maxLength={REFERENCE_NOTE_MAX_LENGTH}
          rows={2}
          disabled={submitting}
          placeholder="Anything that helps us match your transfer"
          className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-normal disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="block text-sm font-semibold text-primary-700">
        Screenshot or photo of your payment
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={submitting}
          className="mt-1 block w-full text-sm text-primary-600 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-accent-50 file:px-4 file:text-sm file:font-bold file:text-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="mt-1 block text-xs text-primary-500">JPG, PNG, or WebP · up to 10 MB</span>
      </label>
      {fileError && <p role="alert" className="text-sm font-semibold text-danger-600">{fileError}</p>}

      {submitFailure === 'upload' && (
        <p role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
          We could not upload your image. Check your connection and try again.
        </p>
      )}
      {submitFailure === 'insert' && (
        <div role="alert" className="space-y-2 rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
          <p>Your image uploaded, but we could not save your submission. Please try again.</p>
          <p>
            If this keeps happening, message support on WhatsApp (<span className="font-semibold" dir="ltr">{SUPPORT_WHATSAPP_DISPLAY}</span>) with your payment reference{' '}
            <span className="font-mono font-semibold" dir="ltr">{getOrderReference(orderId)}</span> so we can find it.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !file}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 text-sm font-bold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
        {submitting ? 'Submitting…' : 'Submit payment proof'}
      </button>
    </form>
  );
}
