export type OrderStatusKey = 'awaiting_payment' | 'under_review' | 'active' | 'rejected' | 'failed' | 'refunded' | 'cancelled';

export interface OrderStatusInfo {
  key: OrderStatusKey;
  label: string;
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  description: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface OrderStatusInput {
  payment_status: string;
  enrollment_status: string;
  latestSubmissionStatus?: SubmissionStatus | null;
}

export function deriveOrderStatus({ payment_status, enrollment_status, latestSubmissionStatus }: OrderStatusInput): OrderStatusInfo {
  if (enrollment_status === 'active') {
    return { key: 'active', label: 'Active', badgeVariant: 'success', description: 'You have full access to this course.' };
  }
  if (latestSubmissionStatus === 'rejected') {
    return { key: 'rejected', label: 'Rejected', badgeVariant: 'danger', description: 'We could not verify this payment. Message us on WhatsApp for the reason and how to proceed.' };
  }
  if (latestSubmissionStatus === 'pending') {
    return { key: 'under_review', label: 'Under review', badgeVariant: 'accent', description: "We received your payment and are reviewing it. This usually takes 24-48 hours." };
  }
  if (payment_status === 'failed') {
    return { key: 'failed', label: 'Payment failed', badgeVariant: 'danger', description: 'This payment did not go through. Message us on WhatsApp for help.' };
  }
  if (payment_status === 'refunded') {
    return { key: 'refunded', label: 'Refunded', badgeVariant: 'default', description: 'This order was refunded.' };
  }
  if (enrollment_status === 'cancelled') {
    return { key: 'cancelled', label: 'Cancelled', badgeVariant: 'default', description: 'This order was cancelled.' };
  }
  return { key: 'awaiting_payment', label: 'Awaiting payment', badgeVariant: 'warning', description: 'Complete your transfer and include the payment reference so we can match it to your order.' };
}
