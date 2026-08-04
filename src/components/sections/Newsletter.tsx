import React, { FormEvent, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { supabase } from '../../lib/supabase';
import { Reveal } from '../ui/Reveal';

type SubmissionState = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';

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

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: normalizedEmail, source: 'homepage' });

      if (!error) {
        setSubmissionState('success');
        setMessage('Thank you — you are now subscribed to Tutiba updates.');
        setEmail('');
        return;
      }
      if (error.code === '23505') {
        setSubmissionState('duplicate');
        setMessage('You are already subscribed with this email address.');
        setEmail('');
        return;
      }

      console.error('[Newsletter] Subscription failed', { code: error.code });
      setSubmissionState('error');
      setMessage('We could not save your subscription. Please try again in a moment.');
    } catch {
      setSubmissionState('error');
      setMessage('We could not reach the subscription service. Check your connection and try again.');
    }
  };

  return (
    <section dir="ltr" className="border-t border-accent-100 bg-accent-50 py-20 md:py-28">
      <PageContainer>
        <Reveal className="flex flex-col items-center justify-between gap-12 rounded-3xl border border-accent-100 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-12 lg:flex-row lg:p-16">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 lg:mx-0">
              <Mail className="w-8 h-8 text-accent-600" />
            </div>
            <h2 className="mb-4 font-display text-2xl font-semibold text-primary-900 md:text-3xl">
              Stay current with cosmeceutical insights
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
              <div className="flex flex-col gap-4">
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
                <Button type="submit" variant="primary" isLoading={submissionState === 'submitting'} disabled={submissionState === 'submitting'} className="h-14 w-full px-8 text-lg whitespace-nowrap">
                  {submissionState === 'submitting' ? 'Subscribing' : 'Subscribe'}
                </Button>
              </div>
              {message && (
                <p role={submissionState === 'error' ? 'alert' : 'status'} aria-live="polite" className={`text-left rounded-xl border px-4 py-3 text-sm font-semibold ${submissionState === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : submissionState === 'duplicate' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-success-200 bg-success-50 text-success-800'}`}>
                  {message}
                </p>
              )}
              <p className="text-xs leading-relaxed text-primary-500">By subscribing, you agree to receive occasional Tutiba learning updates. You can unsubscribe at any time.</p>
            </form>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  );
}
