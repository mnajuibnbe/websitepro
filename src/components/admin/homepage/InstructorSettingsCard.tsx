import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, User } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { DEFAULT_INSTRUCTOR_CONTENT, type HomepageInstructorContent } from '../../../lib/homepageMarketing';
import { HOMEPAGE_ICON_KEYS, resolveHomepageIcon } from '../../../lib/homepageIcons';
import { DynamicListEditor } from '../course/DynamicListEditor';
import { InstructorPhotoUpload } from './InstructorPhotoUpload';

export function InstructorSettingsCard() {
  const { user } = useAuth();
  const [values, setValues] = useState<HomepageInstructorContent>(DEFAULT_INSTRUCTOR_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from('homepage_instructor_settings').select('eyebrow_text,heading_prefix,heading_highlight,bio,instructor_name,photo_url,experience_badge_value,experience_badge_label,credential_pills,bullets').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLoadFailed(true); setMessage({ kind: 'error', text: 'Instructor settings could not be loaded. Reload the page before making changes.' }); }
        else setValues({
          eyebrowText: data.eyebrow_text,
          headingPrefix: data.heading_prefix,
          headingHighlight: data.heading_highlight,
          bio: data.bio,
          instructorName: data.instructor_name,
          photoUrl: data.photo_url,
          experienceBadgeValue: data.experience_badge_value,
          experienceBadgeLabel: data.experience_badge_label,
          credentialPills: data.credential_pills,
          bullets: data.bullets,
        });
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updatePill = (index: number, patch: Partial<{ label: string; icon: string }>) =>
    setValues(c => ({ ...c, credentialPills: c.credentialPills.map((pill, i) => (i === index ? { ...pill, ...patch } : pill)) }));
  const removePill = (index: number) => setValues(c => ({ ...c, credentialPills: c.credentialPills.filter((_, i) => i !== index) }));
  const addPill = () => setValues(c => ({ ...c, credentialPills: [...c.credentialPills, { label: '', icon: HOMEPAGE_ICON_KEYS[0] }] }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (values.eyebrowText.trim().length < 2 || values.headingPrefix.trim().length < 2 || values.headingHighlight.trim().length < 2 || values.bio.trim().length < 10 || values.instructorName.trim().length < 2 || !values.experienceBadgeValue.trim() || values.experienceBadgeLabel.trim().length < 2) {
      setMessage({ kind: 'error', text: 'Fill in every field (bio needs at least 10 characters; other fields need at least 2).' });
      return;
    }
    if (values.credentialPills.some(p => !p.label.trim())) { setMessage({ kind: 'error', text: 'Every credential pill needs a label.' }); return; }
    const bullets = values.bullets.map(b => b.trim()).filter(Boolean);
    if (bullets.length === 0) { setMessage({ kind: 'error', text: 'Add at least one bullet point.' }); return; }

    setIsSaving(true);
    const { error } = await supabase.from('homepage_instructor_settings').update({
      eyebrow_text: values.eyebrowText.trim(),
      heading_prefix: values.headingPrefix.trim(),
      heading_highlight: values.headingHighlight.trim(),
      bio: values.bio.trim(),
      instructor_name: values.instructorName.trim(),
      photo_url: values.photoUrl.trim(),
      experience_badge_value: values.experienceBadgeValue.trim(),
      experience_badge_label: values.experienceBadgeLabel.trim(),
      credential_pills: values.credentialPills,
      bullets,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq('id', 1);
    setIsSaving(false);
    setMessage(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Instructor section updated.' });
    if (!error) setValues(c => ({ ...c, bullets }));
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><User className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">Instructor section</h2><p className="text-sm text-primary-500">The instructor photo, bio, credentials, and bullet points.</p></div>
      </div>

      {isLoading ? <div role="status" className="flex min-h-44 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading settings</span></div> : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-primary-800">Photo</p>
            <InstructorPhotoUpload value={values.photoUrl} onChange={photoUrl => setValues(c => ({ ...c, photoUrl }))} disabled={loadFailed} />
          </div>
          <label className="block text-sm font-bold text-primary-800">Instructor name / photo alt text<input value={values.instructorName} onChange={e => setValues(c => ({ ...c, instructorName: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <label className="block text-sm font-bold text-primary-800">Eyebrow badge<input value={values.eyebrowText} onChange={e => setValues(c => ({ ...c, eyebrowText: e.target.value }))} maxLength={120} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-primary-800">Heading (plain part)<input value={values.headingPrefix} onChange={e => setValues(c => ({ ...c, headingPrefix: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
            <label className="block text-sm font-bold text-primary-800">Heading (highlighted part)<input value={values.headingHighlight} onChange={e => setValues(c => ({ ...c, headingHighlight: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          </div>
          <label className="block text-sm font-bold text-primary-800">Bio<textarea value={values.bio} onChange={e => setValues(c => ({ ...c, bio: e.target.value }))} rows={3} maxLength={800} disabled={loadFailed} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal disabled:opacity-60" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-primary-800">Experience badge value<input value={values.experienceBadgeValue} onChange={e => setValues(c => ({ ...c, experienceBadgeValue: e.target.value }))} maxLength={12} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
            <label className="block text-sm font-bold text-primary-800">Experience badge label<input value={values.experienceBadgeLabel} onChange={e => setValues(c => ({ ...c, experienceBadgeLabel: e.target.value }))} maxLength={60} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-primary-800">Credential pills</p>
            <div className="space-y-3">
              {values.credentialPills.map((pill, index) => {
                const PillIcon = resolveHomepageIcon(pill.icon);
                return (
                  <div key={index} className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 p-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-accent-50 text-accent-700"><PillIcon className="h-4 w-4" /></span>
                    <input value={pill.label} onChange={e => updatePill(index, { label: e.target.value })} maxLength={120} disabled={loadFailed} className="min-h-11 flex-1 rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" />
                    <select value={pill.icon} onChange={e => updatePill(index, { icon: e.target.value })} disabled={loadFailed} className="min-h-11 rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60">
                      {HOMEPAGE_ICON_KEYS.map(key => <option key={key} value={key}>{key}</option>)}
                    </select>
                    <button type="button" aria-label={`Remove credential pill ${index + 1}`} disabled={values.credentialPills.length <= 1} onClick={() => removePill(index)} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-danger-200 bg-white text-danger-600 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                );
              })}
              <button type="button" disabled={values.credentialPills.length >= 6} onClick={addPill} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add pill</button>
            </div>
          </div>

          <DynamicListEditor id="instructor-bullets" label="Bullet points" description="The checklist under the credential pills." value={values.bullets} onChange={bullets => setValues(c => ({ ...c, bullets }))} />
        </div>
      )}

      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.kind === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>{message.text}</p>}
      <div className="mt-7 flex justify-end"><Button type="submit" disabled={isLoading || isSaving || loadFailed} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save instructor section</Button></div>
    </form>
  );
}
