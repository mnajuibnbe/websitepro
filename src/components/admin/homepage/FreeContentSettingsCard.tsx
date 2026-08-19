import { FormEvent, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, BookMarked, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { DEFAULT_FREE_CONTENT, mapFreeContentItemFromRow, mapFreeContentItemToRow, type HomepageFreeContentItem, type HomepageFreeContentSection } from '../../../lib/homepageMarketing';
import { HOMEPAGE_ICON_KEYS } from '../../../lib/homepageIcons';

const isInternalPath = (url: string) => url.trim().startsWith('/');

export function FreeContentSettingsCard() {
  const { user } = useAuth();
  const [values, setValues] = useState<HomepageFreeContentSection>(DEFAULT_FREE_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from('homepage_free_content_settings').select('heading,subtext,items,view_all_label,view_all_url').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLoadFailed(true); setMessage({ kind: 'error', text: 'Free content settings could not be loaded. Reload the page before making changes.' }); }
        else setValues({ heading: data.heading, subtext: data.subtext, items: (data.items || []).map(mapFreeContentItemFromRow), viewAllLabel: data.view_all_label, viewAllUrl: data.view_all_url });
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updateItem = (index: number, patch: Partial<HomepageFreeContentItem>) =>
    setValues(c => ({ ...c, items: c.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  const removeItem = (index: number) => setValues(c => ({ ...c, items: c.items.filter((_, i) => i !== index) }));
  const addItem = () => setValues(c => ({ ...c, items: [...c.items, { typeLabel: 'Guide', title: '', icon: HOMEPAGE_ICON_KEYS[0], imageUrl: '', ctaLabel: 'Read the Guide', linkUrl: '/courses', isProminent: false }] }));
  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= values.items.length) return;
    const reordered = [...values.items];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setValues(c => ({ ...c, items: reordered }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (values.heading.trim().length < 2 || values.subtext.trim().length < 10 || values.viewAllLabel.trim().length < 2 || !isInternalPath(values.viewAllUrl)) {
      setMessage({ kind: 'error', text: '"View all" link must be an internal path starting with /. Heading and button label need at least 2 characters, and subtext needs at least 10.' });
      return;
    }
    if (values.items.some(item => !item.title.trim() || !item.imageUrl.trim() || !item.ctaLabel.trim() || !isInternalPath(item.linkUrl))) {
      setMessage({ kind: 'error', text: 'Every card needs a title, image URL, button label, and an internal link starting with /.' });
      return;
    }
    setIsSaving(true);
    const items = values.items.map(item => ({ ...item, title: item.title.trim(), imageUrl: item.imageUrl.trim(), ctaLabel: item.ctaLabel.trim(), linkUrl: item.linkUrl.trim() }));
    const { error } = await supabase.from('homepage_free_content_settings').update({
      heading: values.heading.trim(),
      subtext: values.subtext.trim(),
      items: items.map(mapFreeContentItemToRow),
      view_all_label: values.viewAllLabel.trim(),
      view_all_url: values.viewAllUrl.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq('id', 1);
    setIsSaving(false);
    setMessage(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Free content section updated.' });
    if (!error) setValues(c => ({ ...c, items }));
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><BookMarked className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">Free content section</h2><p className="text-sm text-primary-500">The "Free Learning Resources" cards. Links must point somewhere on this site (start with /).</p></div>
      </div>

      {isLoading ? <div role="status" className="flex min-h-44 items-center justify-center text-primary-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="sr-only">Loading settings</span></div> : (
        <div className="space-y-4">
          <label className="block text-sm font-bold text-primary-800">Heading<input value={values.heading} onChange={e => setValues(c => ({ ...c, heading: e.target.value }))} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          <label className="block text-sm font-bold text-primary-800">Subtext<textarea value={values.subtext} onChange={e => setValues(c => ({ ...c, subtext: e.target.value }))} rows={2} maxLength={600} disabled={loadFailed} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal disabled:opacity-60" /></label>

          <div>
            <p className="mb-3 text-sm font-bold text-primary-800">Cards</p>
            <div className="space-y-4">
              {values.items.map((item, index) => (
                <div key={index} className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-primary-800">
                      <input type="checkbox" checked={item.isProminent} onChange={e => updateItem(index, { isProminent: e.target.checked })} disabled={loadFailed} className="h-4 w-4 rounded border-primary-300" />
                      Featured card
                    </label>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={`Move card ${index + 1} up`} disabled={index === 0} onClick={() => moveItem(index, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" aria-label={`Move card ${index + 1} down`} disabled={index === values.items.length - 1} onClick={() => moveItem(index, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" aria-label={`Remove card ${index + 1}`} disabled={values.items.length <= 1} onClick={() => removeItem(index)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger-200 bg-white text-danger-600 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-bold text-primary-800">Title<input value={item.title} onChange={e => updateItem(index, { title: e.target.value })} maxLength={160} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
                    <label className="block text-sm font-bold text-primary-800">Type badge<input value={item.typeLabel} onChange={e => updateItem(index, { typeLabel: e.target.value })} maxLength={40} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
                  </div>
                  <label className="mt-3 block text-sm font-bold text-primary-800">Image URL<input value={item.imageUrl} onChange={e => updateItem(index, { imageUrl: e.target.value })} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                    <label className="block text-sm font-bold text-primary-800">Button label<input value={item.ctaLabel} onChange={e => updateItem(index, { ctaLabel: e.target.value })} maxLength={60} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
                    <label className="block text-sm font-bold text-primary-800">Icon<select value={item.icon} onChange={e => updateItem(index, { icon: e.target.value })} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60 sm:w-40">
                      {HOMEPAGE_ICON_KEYS.map(key => <option key={key} value={key}>{key}</option>)}
                    </select></label>
                    <label className="block text-sm font-bold text-primary-800">Link (internal path)<input value={item.linkUrl} onChange={e => updateItem(index, { linkUrl: e.target.value })} placeholder="/courses" disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
                  </div>
                  {!isInternalPath(item.linkUrl) && <p className="mt-2 text-xs font-semibold text-danger-600">Link must start with /</p>}
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="mt-3 h-24 w-40 rounded-lg object-cover" />}
                </div>
              ))}
              <button type="button" disabled={values.items.length >= 6} onClick={addItem} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add card</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-primary-800">"View all" button label<input value={values.viewAllLabel} onChange={e => setValues(c => ({ ...c, viewAllLabel: e.target.value }))} maxLength={60} disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
            <label className="block text-sm font-bold text-primary-800">"View all" link (internal path)<input value={values.viewAllUrl} onChange={e => setValues(c => ({ ...c, viewAllUrl: e.target.value }))} placeholder="/courses" disabled={loadFailed} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal disabled:opacity-60" /></label>
          </div>
        </div>
      )}

      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border p-4 text-sm font-semibold ${message.kind === 'error' ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-success-200 bg-success-50 text-success-800'}`}>{message.text}</p>}
      <div className="mt-7 flex justify-end"><Button type="submit" disabled={isLoading || isSaving || loadFailed} isLoading={isSaving} icon={<Save className="h-4 w-4" />}>Save free content section</Button></div>
    </form>
  );
}
