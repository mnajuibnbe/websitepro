import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { DEFAULT_HERO_CONTENT, type HomepageHeroContent } from '../../../lib/homepageMarketing';
import { HOMEPAGE_ICON_KEYS, resolveHomepageIcon } from '../../../lib/homepageIcons';

export function HeroSettingsCard() {
  const { user } = useAuth();
  const [values, setValues] = useState<HomepageHeroContent>(DEFAULT_HERO_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from('homepage_hero_settings').select('eyebrow_text,headline_prefix,headline_highlight,subtext,cta_label,trust_badges,video_badge_text,video_heading,video_description,video_play_label').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLoadFailed(true); setMessage({ kind: 'error', text: 'Hero settings could not be loaded. Reload the page before making changes.' }); }
        else setValues({
          eyebrowText: data.eyebrow_text,
          headlinePrefix: data.headline_prefix,
          headlineHighlight: data.headline_highlight,
          subtext: data.subtext,
          ctaLabel: data.cta_label,
          trustBadges: data.trust_badges,
          videoBadgeText: data.video_badge_text,
          videoHeading: data.video_heading,
          videoDescription: data.video_description,
          videoPlayLabel: data.video_play_label,
        });
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updateBadge = (index: number, patch: Partial<{ label: string; icon: string }>) =>
    setValues(c => ({ ...c, trustBadges: c.trustBadges.map((badge, i) => (i === index ? { ...badge, ...patch } : badge)) }));
  const removeBadge = (index: number) => setValues(c => ({ ...c, trustBadges: c.trustBadges.filter((_, i) => i !== index) }));
  const addBadge = () => setValues(c => ({ ...c, trustBadges: [...c.trustBadges, { label: '', icon: HOMEPAGE_ICON_KEYS[0] }] }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (values.eyebrowText.trim().length < 2 || values.headlinePrefix.trim().length < 2 || values.headlineHighlight.trim().length < 2 || values.subtext.trim().length < 10 || values.ctaLabel.trim().length < 2 || values.videoBadgeText.trim().length < 2 || values.videoHeading.trim().length < 2 || values.videoDescription.trim().length < 10 || values.videoPlayLabel.trim().length < 2) {
      setMessage({ kind: 'error', text: 'Fill in every field (subtext and video description need at least 10 characters; other fields need at least 2).' });
      return;
    }
    if (values.trustBadges.some(badge => !badge.label.trim())) {
      setMessage({ kind: 'error', text: 'Every trust badge needs a label.' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('homepage_hero_settings').update({
      eyebrow_text: values.eyebrowText.trim(),
      headline_prefix: values.headlinePrefix.trim(),
      headline_highlight: values.headlineHighlight.trim(),
      subtext: values.subtext.trim(),
      cta_label: values.ctaLabel.trim(),
      trust_badges: values.trustBadges,
      video_badge_text: values.videoBadgeText.trim(),
      video_heading: values.videoHeading.trim(),
      video_description: values.videoDescription.trim(),
      video_play_label: values.videoPlayLabel.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq('id', 1);
    setIsSaving(false);
    setMessage(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Hero section updated.' });
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><Sparkles className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">Hero section</h2><p className="text-sm text-primary-500">The first thing visitors see: eyebrow badge, headline, subtext, primary button, trust badges, and the welcome-video panel copy.</p></div>
      </div>

      {isLoading ? <div role="status" className="flex min-h-44 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading settings</span></div> : (
        <div className="space-y-4">
          <label className="block text-sm font-bold text-primary-800">Eyebrow badge<input value={values.eyebrowText} onChange={e => setValues(c => ({ ...c, eyebrowText: e.target.value }))} maxLength={120} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-primary-800">Headline (plain part)<input value={values.headlinePrefix} onChange={e => setValues(c => ({ ...c, headlinePrefix: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
            <label className="block text-sm font-bold text-primary-800">Headline (highlighted part)<input value={values.headlineHighlight} onChange={e => setValues(c => ({ ...c, headlineHighlight: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          </div>
          <label className="block text-sm font-bold text-primary-800">Subtext<textarea value={values.subtext} onChange={e => setValues(c => ({ ...c, subtext: e.target.value }))} rows={3} maxLength={600} disabled={loadFailed} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal disabled:opacity-60" /></label>
          <label className="block text-sm font-bold text-primary-800">Primary button label<input value={values.ctaLabel} onChange={e => setValues(c => ({ ...c, ctaLabel: e.target.value }))} maxLength={60} disabled={loadFailed} className="mt-2 min-h-11 w-full max-w-xs rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>

          <div>
            <p className="mb-3 text-sm font-bold text-primary-800">Trust badges</p>
            <div className="space-y-3">
              {values.trustBadges.map((badge, index) => {
                const BadgeIcon = resolveHomepageIcon(badge.icon);
                return (
                  <div key={index} className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 p-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-accent-50 text-accent-700"><BadgeIcon className="h-4 w-4" /></span>
                    <input value={badge.label} onChange={e => updateBadge(index, { label: e.target.value })} maxLength={80} disabled={loadFailed} className="min-h-11 flex-1 rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" />
                    <select value={badge.icon} onChange={e => updateBadge(index, { icon: e.target.value })} disabled={loadFailed} className="min-h-11 rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60">
                      {HOMEPAGE_ICON_KEYS.map(key => <option key={key} value={key}>{key}</option>)}
                    </select>
                    <button type="button" aria-label={`Remove trust badge ${index + 1}`} disabled={values.trustBadges.length <= 1} onClick={() => removeBadge(index)} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-danger-200 bg-white text-danger-600 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                );
              })}
              <button type="button" disabled={values.trustBadges.length >= 6} onClick={addBadge} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add badge</button>
            </div>
          </div>

          <div className="border-t border-primary-100 pt-4">
            <p className="mb-3 text-sm font-bold text-primary-800">Welcome-video panel</p>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-primary-800">Badge text<input value={values.videoBadgeText} onChange={e => setValues(c => ({ ...c, videoBadgeText: e.target.value }))} maxLength={60} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
              <label className="block text-sm font-bold text-primary-800">Heading<input value={values.videoHeading} onChange={e => setValues(c => ({ ...c, videoHeading: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
              <label className="block text-sm font-bold text-primary-800">Description<textarea value={values.videoDescription} onChange={e => setValues(c => ({ ...c, videoDescription: e.target.value }))} rows={2} maxLength={400} disabled={loadFailed} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal disabled:opacity-60" /></label>
              <label className="block text-sm font-bold text-primary-800">Play button label<input value={values.videoPlayLabel} onChange={e => setValues(c => ({ ...c, videoPlayLabel: e.target.value }))} maxLength={60} disabled={loadFailed} className="mt-2 min-h-11 w-full max-w-xs rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
            </div>
          </div>
        </div>
      )}

      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.kind === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>{message.text}</p>}
      <div className="mt-7 flex justify-end"><Button type="submit" disabled={isLoading || isSaving || loadFailed} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save hero section</Button></div>
    </form>
  );
}
