import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { DEFAULT_OUTCOMES_CONTENT, type HomepageOutcomesContent } from '../../../lib/homepageMarketing';
import { IconListFieldEditor } from './IconListFieldEditor';

export function OutcomesSettingsCard() {
  const { user } = useAuth();
  const [values, setValues] = useState<HomepageOutcomesContent>(DEFAULT_OUTCOMES_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from('homepage_outcomes_settings').select('eyebrow_text,heading_prefix,heading_highlight,outcomes').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLoadFailed(true); setMessage({ kind: 'error', text: 'Outcomes settings could not be loaded. Reload the page before making changes.' }); }
        else setValues({ eyebrowText: data.eyebrow_text, headingPrefix: data.heading_prefix, headingHighlight: data.heading_highlight, outcomes: data.outcomes });
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (values.eyebrowText.trim().length < 2 || values.headingPrefix.trim().length < 2 || values.headingHighlight.trim().length < 2) {
      setMessage({ kind: 'error', text: 'Every field needs at least 2 characters.' });
      return;
    }
    if (values.outcomes.some(item => !item.title.trim() || !item.description.trim())) {
      setMessage({ kind: 'error', text: 'Every outcome needs a title and description.' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('homepage_outcomes_settings').update({
      eyebrow_text: values.eyebrowText.trim(),
      heading_prefix: values.headingPrefix.trim(),
      heading_highlight: values.headingHighlight.trim(),
      outcomes: values.outcomes,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq('id', 1);
    setIsSaving(false);
    setMessage(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Outcomes section updated.' });
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><ShieldCheck className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">Outcomes section</h2><p className="text-sm text-primary-500">The dark "Why enroll with confidence" band with four outcome cards.</p></div>
      </div>

      {isLoading ? <div role="status" className="flex min-h-44 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading settings</span></div> : (
        <div className="space-y-4">
          <label className="block text-sm font-bold text-primary-800">Eyebrow badge<input value={values.eyebrowText} onChange={e => setValues(c => ({ ...c, eyebrowText: e.target.value }))} maxLength={120} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-primary-800">Heading (plain part)<input value={values.headingPrefix} onChange={e => setValues(c => ({ ...c, headingPrefix: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
            <label className="block text-sm font-bold text-primary-800">Heading (highlighted part)<input value={values.headingHighlight} onChange={e => setValues(c => ({ ...c, headingHighlight: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-primary-800">Outcomes</p>
            <IconListFieldEditor items={values.outcomes} onChange={outcomes => setValues(c => ({ ...c, outcomes }))} itemLabel="outcome" />
          </div>
        </div>
      )}

      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.kind === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>{message.text}</p>}
      <div className="mt-7 flex justify-end"><Button type="submit" disabled={isLoading || isSaving || loadFailed} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save outcomes section</Button></div>
    </form>
  );
}
