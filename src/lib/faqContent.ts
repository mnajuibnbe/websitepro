export interface FaqEntry {
  q: string;
  a: string;
}

export const faqEntries: FaqEntry[] = [
  {
    q: 'Who are Tutiba courses designed for?',
    a: 'Tutiba is built for health, beauty, and skincare professionals who want structured, evidence-based cosmeceutical education. Check each course page for its specific prerequisites.',
  },
  {
    q: 'Do courses include a certificate?',
    a: "Certificates aren't issued on the platform yet. Every course is organized into clear, ordered stages so you can track your own progress, and we'll announce certification here when it's available.",
  },
  {
    q: 'Which payment methods are available?',
    a: 'Checkout shows your available payment methods and final billing currency before you confirm your purchase.',
  },
  {
    q: 'How do I get technical support?',
    a: 'Describe the issue on the Contact page and include the email address on your account. Our support team will follow up as soon as they can.',
  },
];
