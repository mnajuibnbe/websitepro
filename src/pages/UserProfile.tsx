import { FormEvent, useEffect, useState } from 'react';
import { Mail, Shield, Bell, UserRound, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Sidebar } from '../components/dashboard/Sidebar';
import { PortalLayout } from '../components/layout/PortalLayout';
import { supabase } from '../lib/supabase';

const preferenceKey = (userId?: string) => `tutiba:preferences:${userId || 'anonymous'}`;

export function UserProfile() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [learningReminders, setLearningReminders] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    const saved = localStorage.getItem(preferenceKey(user?.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCourseUpdates(parsed.courseUpdates !== false);
        setLearningReminders(parsed.learningReminders !== false);
      } catch { localStorage.removeItem(preferenceKey(user?.id)); }
    }
  }, [user?.id, user?.name]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) { setStatus('error'); setMessage('Enter a name with at least 2 characters.'); return; }
    setStatus('saving'); setMessage('');
    const { error } = await supabase.auth.updateUser({ data: { full_name: cleanName, name: cleanName } });
    if (error) { setStatus('error'); setMessage(error.message); return; }
    localStorage.setItem(preferenceKey(user?.id), JSON.stringify({ courseUpdates, learningReminders }));
    setStatus('saved'); setMessage('Your profile and preferences were saved.');
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    setStatus('saving'); setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}${window.location.pathname}#/update-password` });
    setStatus(error ? 'error' : 'saved');
    setMessage(error ? error.message : 'A secure password reset link was sent to your email address.');
  };

  return (
    <PortalLayout
      sidebar={<Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
      mobileNavigationTrigger={
        <button
          type="button"
          aria-label="Open student navigation"
          aria-expanded={isSidebarOpen}
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-40 flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-primary-200 bg-white text-primary-600 shadow-sm lg:hidden"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      }
    >
      <form onSubmit={saveProfile} className="rounded-3xl border border-primary-200 bg-white p-6 shadow-sm md:p-10">
        <div className="mb-10 flex flex-col gap-5 border-b border-primary-100 pb-8 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-100 text-3xl font-bold text-accent-700">{(name || 'U').charAt(0).toUpperCase()}</div>
          <div><h1 className="mb-1 text-3xl font-bold text-primary-900">Profile settings</h1><p className="flex items-center gap-2 text-primary-600"><Mail className="h-4 w-4" aria-hidden="true" />{user?.email}</p></div>
        </div>

        {message && <div role="status" className={`mb-6 rounded-xl border p-4 text-sm font-medium ${status === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-100 text-success-700'}`}>{message}</div>}

        <div className="space-y-10">
          <section aria-labelledby="personal-heading"><h2 id="personal-heading" className="mb-5 flex items-center gap-2 text-xl font-bold text-primary-900"><UserRound className="h-5 w-5 text-accent-600" />Personal information</h2><div className="grid gap-5 sm:grid-cols-2"><Input label="Full name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required /><Input label="Email address" value={user?.email || ''} readOnly /></div><p className="mt-3 text-sm text-primary-500">Contact support if you need to change your sign-in email.</p></section>

          <section aria-labelledby="security-heading"><h2 id="security-heading" className="mb-5 flex items-center gap-2 text-xl font-bold text-primary-900"><Shield className="h-5 w-5 text-accent-600" />Security</h2><div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-primary-900">Password</p><p className="text-sm text-primary-600">We will email you a secure password reset link.</p></div><Button type="button" variant="secondary" onClick={sendPasswordReset}>Reset password</Button></div></section>

          <section aria-labelledby="notifications-heading"><h2 id="notifications-heading" className="mb-5 flex items-center gap-2 text-xl font-bold text-primary-900"><Bell className="h-5 w-5 text-accent-600" />Communication preferences</h2><fieldset className="space-y-3"><legend className="sr-only">Email preferences</legend><label className="flex items-start gap-3 rounded-xl border border-primary-100 p-4"><input type="checkbox" checked={courseUpdates} onChange={event => setCourseUpdates(event.target.checked)} className="mt-1 h-5 w-5 accent-accent-600" /><span><strong className="block text-primary-900">Course updates</strong><span className="text-sm text-primary-600">Receive important updates about your enrolled courses.</span></span></label><label className="flex items-start gap-3 rounded-xl border border-primary-100 p-4"><input type="checkbox" checked={learningReminders} onChange={event => setLearningReminders(event.target.checked)} className="mt-1 h-5 w-5 accent-accent-600" /><span><strong className="block text-primary-900">Learning reminders</strong><span className="text-sm text-primary-600">Receive occasional reminders to continue learning.</span></span></label></fieldset></section>
        </div>

        <div className="mt-10 flex justify-end border-t border-primary-100 pt-6"><Button type="submit" variant="primary" className="px-8" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save changes'}</Button></div>
      </form>
    </PortalLayout>
  );
}
