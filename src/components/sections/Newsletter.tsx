import React, { FormEvent, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { supabase } from '../../lib/supabase';

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [message, setMessage] = useState('');

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (website) return;
    const normalizedEmail = email.trim().toLocaleLowerCase();
    setSubmissionState('submitting');
    setMessage('');

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email: normalizedEmail, source: 'homepage' });

    if (!error || error.code === '23505') {
      setSubmissionState('success');
      setMessage(error ? 'You are already subscribed with this email address.' : 'Thank you — you are now subscribed to Tutiba updates.');
      setEmail('');
      return;
    }

    console.error('[Newsletter] Subscription failed', { code: error.code });
    setSubmissionState('error');
    setMessage('We could not save your subscription. Please try again in a moment.');
  };

  return (
    <section className="py-16 md:py-24 bg-accent-50 border-t border-accent-100">
      <PageContainer>
        <div className="bg-white rounded-3xl p-8 md:p-12 lg:p-16 shadow-sm border border-accent-100 flex flex-col lg:flex-row items-center justify-between gap-12 hover:shadow-md transition-shadow duration-300">
          <div className="lg:w-1/2 text-center lg:text-right">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-6 mx-auto lg:mx-0">
              <Mail className="w-8 h-8 text-accent-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">
              Stay Current with Cosmeceutical Insights
            </h2>
            <p className="text-primary-600 text-lg leading-relaxed">
              Receive new articles, course announcements, and practical learning resources directly in your inbox.
            </p>
          </div>
          <div className="lg:w-1/2 w-full max-w-md">
            <form className="flex flex-col gap-4" onSubmit={subscribe}>
              <div className="hidden" aria-hidden="true">
                <label htmlFor="newsletter-website">Website</label>
                <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-grow">
                <Input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-14 text-lg bg-primary-50 border-primary-200 focus:bg-white"
                  required
                  maxLength={320}
                  autoComplete="email"
                  aria-label="Email Address"
                />
                </div>
                <Button type="submit" variant="primary" isLoading={submissionState === 'submitting'} disabled={submissionState === 'submitting'} className="h-14 px-8 text-lg whitespace-nowrap">
                  {submissionState === 'submitting' ? 'Subscribing' : 'Subscribe'}
                </Button>
              </div>
              {message && (
                <p role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${submissionState === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>
                  {message}
                </p>
              )}
              <p className="text-xs leading-relaxed text-primary-500">By subscribing, you agree to receive occasional Tutiba learning updates. You can unsubscribe at any time.</p>
            </form>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
