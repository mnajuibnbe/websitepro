import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare, Phone, MapPin } from 'lucide-react';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/layout/PageContainer';

const INITIAL_FORM_STATE = {
  name: '',
  phone: '',
  email: '',
  topic: 'support',
  message: '',
};

export function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // React state updates are batched/async, so two clicks fired in the same
  // tick can both read isSubmitting as false before a re-render disables
  // the button. This ref is set synchronously and is the real double-submit
  // guard; isSubmitting only drives the UI.
  const submitLockRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const updateField = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrorMessage(body?.error || 'Something went wrong. Please try again.');
        return;
      }

      setIsSuccess(true);
      setForm(INITIAL_FORM_STATE);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans" dir="ltr">
      <MarketingNavbar />

      <main id="main-content" className="pt-32 pb-24">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">

            {/* Contact Info */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">Contact Us</h1>
              <p className="text-lg text-primary-600 mb-12 max-w-lg leading-relaxed">
                Have a question about a course, enrollment, or your account? Our support team is ready to help.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">Email Address</h3>
                    <p className="text-primary-600 mb-2">Email our learner support team</p>
                    <a href="mailto:support@tutiba.com" className="font-bold text-accent-600 hover:text-accent-700" dir="ltr">support@tutiba.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">Phone Support</h3>
                    <p className="text-primary-600 mb-2">Available Sunday–Thursday, 9:00 AM–5:00 PM</p>
                    <a href="tel:+201065826509" className="font-bold text-accent-600 hover:text-accent-700" dir="ltr">+20 106 582 6509</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-primary-200 p-8 md:p-10">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Send Us a Message</h2>

              {isSuccess ? (
                <div className="bg-success-50 text-success-700 p-6 rounded-xl border border-success-200 text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Message Sent</h3>
                  <p>Thank you for contacting us. We will respond as soon as possible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errorMessage && (
                    <div className="bg-danger-50 text-danger-700 p-4 rounded-xl border border-danger-200 text-sm" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={updateField('name')}
                        className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary-900 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={updateField('phone')}
                        className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                        placeholder="Enter your phone number"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={updateField('email')}
                      className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                      placeholder="name@example.com"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Topic</label>
                    <select
                      value={form.topic}
                      onChange={updateField('topic')}
                      className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                    >
                      <option value="support">Account Support</option>
                      <option value="billing">Billing and Payments</option>
                      <option value="course">Course Information</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary-900 mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={updateField('message')}
                      className="block w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors resize-none"
                      placeholder="How can we help?"
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-12 text-lg"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>

          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
