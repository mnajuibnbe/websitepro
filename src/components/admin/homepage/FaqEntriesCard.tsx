import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, HelpCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { HomepageFaqEntry } from '../../../lib/homepageMarketing';

interface FaqEdit { question: string; answer: string; }
const EMPTY_FAQ_DRAFT: FaqEdit = { question: '', answer: '' };

export function FaqEntriesCard() {
  const [entries, setEntries] = useState<HomepageFaqEntry[]>([]);
  const [edits, setEdits] = useState<Record<number, FaqEdit>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newFaq, setNewFaq] = useState<FaqEdit>(EMPTY_FAQ_DRAFT);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.from('homepage_faq_entries').select('id,question,answer,display_order,is_published').order('display_order');
    if (error) setMessage(error.message);
    else {
      const rows = (data || []).map(row => ({ id: row.id, question: row.question, answer: row.answer, displayOrder: row.display_order, isPublished: row.is_published }));
      setEntries(rows);
      setEdits(Object.fromEntries(rows.map(row => [row.id, { question: row.question, answer: row.answer }])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveEntry = async (entry: HomepageFaqEntry) => {
    const edit = edits[entry.id] || EMPTY_FAQ_DRAFT;
    const question = edit.question.trim();
    const answer = edit.answer.trim();
    if (question.length < 5 || answer.length < 5) { setMessage('Question and answer need at least 5 characters each.'); return; }
    setSavingId(entry.id);
    const { error } = await supabase.from('homepage_faq_entries').update({ question, answer }).eq('id', entry.id);
    setSavingId(null);
    if (error) setMessage(error.message); else { setMessage('FAQ entry updated.'); setEntries(current => current.map(item => item.id === entry.id ? { ...item, question, answer } : item)); }
  };

  const togglePublished = async (entry: HomepageFaqEntry) => {
    setTogglingId(entry.id);
    const { error } = await supabase.from('homepage_faq_entries').update({ is_published: !entry.isPublished }).eq('id', entry.id);
    setTogglingId(null);
    if (error) setMessage(error.message); else { setEntries(current => current.map(item => item.id === entry.id ? { ...item, isPublished: !item.isPublished } : item)); setMessage(entry.isPublished ? 'FAQ entry hidden.' : 'FAQ entry is now visible.'); }
  };

  const moveEntry = async (entry: HomepageFaqEntry, direction: 'up' | 'down') => {
    setMovingId(entry.id);
    const { error } = await supabase.rpc('admin_move_homepage_faq_entry', { p_id: entry.id, p_direction: direction });
    if (error) { setMessage(error.message); setMovingId(null); return; }
    await load();
    setMovingId(null);
  };

  const deleteEntry = async (entry: HomepageFaqEntry) => {
    if (!window.confirm(`Delete "${entry.question}"? This cannot be undone.`)) return;
    setDeletingId(entry.id);
    const { error } = await supabase.from('homepage_faq_entries').delete().eq('id', entry.id);
    setDeletingId(null);
    if (error) setMessage(error.message); else { setEntries(current => current.filter(item => item.id !== entry.id)); setMessage('FAQ entry deleted.'); }
  };

  const createEntry = async (event: FormEvent) => {
    event.preventDefault();
    const question = newFaq.question.trim();
    const answer = newFaq.answer.trim();
    if (question.length < 5 || answer.length < 5) { setMessage('Question and answer need at least 5 characters each.'); return; }
    setCreating(true);
    const nextOrder = entries.reduce((max, item) => Math.max(max, item.displayOrder), 0) + 1;
    const { error } = await supabase.from('homepage_faq_entries').insert({ question, answer, display_order: nextOrder });
    setCreating(false);
    if (error) setMessage(error.message);
    else { setMessage('FAQ entry added.'); setNewFaq(EMPTY_FAQ_DRAFT); await load(); }
  };

  return (
    <section className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><HelpCircle className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">FAQ entries</h2><p className="text-sm text-primary-500">Shown in the homepage FAQ preview and on the standalone FAQ page.</p></div>
      </div>

      {message && <p role="status" className="mb-5 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm font-semibold text-primary-700">{message}</p>}

      {loading ? <div className="flex justify-center p-12"><Loader2 className="h-7 w-7 animate-spin text-accent-600" /></div> : (
        <>
          <form onSubmit={createEntry} className="mb-6 rounded-xl border border-dashed border-primary-300 bg-primary-50 p-4">
            <h3 className="font-bold text-primary-900">Add a question</h3>
            <label className="mt-3 block text-sm font-bold text-primary-800">Question<input value={newFaq.question} onChange={e => setNewFaq(c => ({ ...c, question: e.target.value }))} maxLength={200} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
            <label className="mt-3 block text-sm font-bold text-primary-800">Answer<textarea value={newFaq.answer} onChange={e => setNewFaq(c => ({ ...c, answer: e.target.value }))} rows={3} maxLength={2000} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal" /></label>
            <button type="submit" disabled={creating} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-700 px-4 font-bold text-white transition-colors hover:bg-accent-800 disabled:cursor-not-allowed disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add question</button>
          </form>

          {entries.length === 0 ? <p className="text-sm text-primary-500">No FAQ entries yet.</p> : <div className="space-y-4">
            {entries.map((entry, index) => {
              const edit = edits[entry.id] || EMPTY_FAQ_DRAFT;
              return (
                <article key={entry.id} className={`rounded-xl border p-4 ${entry.isPublished ? 'border-primary-100 bg-primary-50' : 'border-warning-200 bg-warning-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${entry.isPublished ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>{entry.isPublished ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{entry.isPublished ? 'Visible' : 'Hidden'}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Move up" disabled={index === 0 || movingId === entry.id} onClick={() => void moveEntry(entry, 'up')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" aria-label="Move down" disabled={index === entries.length - 1 || movingId === entry.id} onClick={() => void moveEntry(entry, 'down')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <label className="mt-3 block text-sm font-bold text-primary-800">Question<input value={edit.question} onChange={e => setEdits(c => ({ ...c, [entry.id]: { ...edit, question: e.target.value } }))} maxLength={200} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
                  <label className="mt-3 block text-sm font-bold text-primary-800">Answer<textarea value={edit.answer} onChange={e => setEdits(c => ({ ...c, [entry.id]: { ...edit, answer: e.target.value } }))} rows={3} maxLength={2000} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal" /></label>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button type="button" disabled={deletingId === entry.id} onClick={() => void deleteEntry(entry)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger-200 px-3 font-bold text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50">{deletingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Delete</button>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={togglingId === entry.id} onClick={() => void togglePublished(entry)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 px-3 font-bold text-primary-800 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50">{togglingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : entry.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{entry.isPublished ? 'Hide' : 'Show'}</button>
                      <button type="button" disabled={savingId === entry.id} onClick={() => void saveEntry(entry)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{savingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>}
        </>
      )}
    </section>
  );
}
