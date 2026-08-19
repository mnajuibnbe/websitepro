import { FormEvent, useEffect, useState } from 'react';
import { GraduationCap, Loader2, Save } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { DEFAULT_LEARNING_METHOD_CONTENT, type HomepageLearningMethodContent } from '../../../lib/homepageMarketing';
import { IconListFieldEditor } from './IconListFieldEditor';

export function LearningMethodSettingsCard() {
  const { user } = useAuth();
  const [values, setValues] = useState<HomepageLearningMethodContent>(DEFAULT_LEARNING_METHOD_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from('homepage_learning_method_settings').select('eyebrow_text,heading,subtext,curriculum').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLoadFailed(true); setMessage({ kind: 'error', text: 'Featured curriculum settings could not be loaded. Reload the page before making changes.' }); }
        else setValues({ eyebrowText: data.eyebrow_text, heading: data.heading, subtext: data.subtext, curriculum: data.curriculum });
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (values.eyebrowText.trim().length < 2 || values.heading.trim().length < 2 || values.subtext.trim().length < 10) {
      setMessage({ kind: 'error', text: 'Fill in every field (subtext needs at least 10 characters; other fields need at least 2).' });
      return;
    }
    if (values.curriculum.some(item => !item.title.trim() || !item.description.trim())) {
      setMessage({ kind: 'error', text: 'Every stage needs a title and description.' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('homepage_learning_method_settings').update({
      eyebrow_text: values.eyebrowText.trim(),
      heading: values.heading.trim(),
      subtext: values.subtext.trim(),
      curriculum: values.curriculum,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq('id', 1);
    setIsSaving(false);
    setMessage(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Featured curriculum section updated.' });
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><GraduationCap className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">Featured curriculum section</h2><p className="text-sm text-primary-500">The ordered stages shown for the primary featured course. The button text/link stays tied to that course automatically.</p></div>
      </div>

      {isLoading ? <div role="status" className="flex min-h-44 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading settings</span></div> : (
        <div className="space-y-4">
          <label className="block text-sm font-bold text-primary-800">Eyebrow badge<input value={values.eyebrowText} onChange={e => setValues(c => ({ ...c, eyebrowText: e.target.value }))} maxLength={120} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <label className="block text-sm font-bold text-primary-800">Heading<input value={values.heading} onChange={e => setValues(c => ({ ...c, heading: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <label className="block text-sm font-bold text-primary-800">Subtext<textarea value={values.subtext} onChange={e => setValues(c => ({ ...c, subtext: e.target.value }))} rows={2} maxLength={600} disabled={loadFailed} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal disabled:opacity-60" /></label>

          <div>
            <p className="mb-3 text-sm font-bold text-primary-800">Curriculum stages</p>
            <IconListFieldEditor items={values.curriculum} onChange={curriculum => setValues(c => ({ ...c, curriculum }))} itemLabel="stage" />
          </div>
        </div>
      )}

      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.kind === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>{message.text}</p>}
      <div className="mt-7 flex justify-end"><Button type="submit" disabled={isLoading || isSaving || loadFailed} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save featured curriculum section</Button></div>
    </form>
  );
}
