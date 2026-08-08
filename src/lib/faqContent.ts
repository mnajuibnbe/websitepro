export interface FaqEntry {
  q: string;
  a: string;
}

export const faqEntries: FaqEntry[] = [
  {
    q: 'Who are Tutiba courses designed for?',
    a: 'Our courses are designed for health, beauty, and skincare professionals who want structured, evidence-based cosmeceutical education. Each course page lists its specific prerequisites.',
  },
  {
    q: 'Do courses include a certificate?',
    a: 'Certificates are not issued on the platform yet. Every course is organized into clear, ordered stages so you can track your own progress in the meantime — we will announce certification here when it becomes available.',
  },
  {
    q: 'Which payment methods are available?',
    a: 'Available payment methods and the final billing currency are shown securely at checkout before you confirm your purchase.',
  },
  {
    q: 'How do I get technical support?',
    a: 'Use the Contact page to describe the issue and include the email address associated with your account. Our support team will follow up as soon as possible.',
  },
];
