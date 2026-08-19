import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Layers, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { HOMEPAGE_SECTION_LABELS, type HomepageSectionKey } from '../../../lib/homepageMarketing';

interface SectionRow { sectionKey: HomepageSectionKey; displayOrder: number; isVisible: boolean; }

export function HomepageLayoutCard() {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [togglingKey, setTogglingKey] = useState<HomepageSectionKey | null>(null);
  const [movingKey, setMovingKey] = useState<HomepageSectionKey | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.from('homepage_section_layout').select('section_key,display_order,is_visible').order('display_order');
    if (error) setMessage(error.message);
    else setSections((data || []).map(row => ({ sectionKey: row.section_key as HomepageSectionKey, displayOrder: row.display_order, isVisible: row.is_visible })));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleVisible = async (section: SectionRow) => {
    setTogglingKey(section.sectionKey);
    const { error } = await supabase.from('homepage_section_layout').update({ is_visible: !section.isVisible }).eq('section_key', section.sectionKey);
    setTogglingKey(null);
    if (error) setMessage(error.message);
    else {
      setSections(current => current.map(item => item.sectionKey === section.sectionKey ? { ...item, isVisible: !item.isVisible } : item));
      setMessage(section.isVisible ? `${HOMEPAGE_SECTION_LABELS[section.sectionKey]} is now hidden from the homepage.` : `${HOMEPAGE_SECTION_LABELS[section.sectionKey]} is now visible on the homepage.`);
    }
  };

  const moveSection = async (section: SectionRow, direction: 'up' | 'down') => {
    setMovingKey(section.sectionKey);
    const { error } = await supabase.rpc('admin_move_homepage_section', { p_section_key: section.sectionKey, p_direction: direction });
    if (error) { setMessage(error.message); setMovingKey(null); return; }
    await load();
    setMovingKey(null);
  };

  return (
    <section className="rounded-2xl border border-primary-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-primary-100 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700"><Layers className="h-5 w-5" /></div>
        <div><h2 className="font-bold text-primary-900">Homepage layout</h2><p className="text-sm text-primary-500">Show, hide, or reorder homepage sections. The hero always stays first.</p></div>
      </div>

      {message && <p role="status" className="mb-5 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm font-semibold text-primary-700">{message}</p>}

      {loading ? <div className="flex justify-center p-8"><Loader2 className="h-7 w-7 animate-spin text-accent-600" /></div> : (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section.sectionKey} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${section.isVisible ? 'border-primary-100 bg-primary-50' : 'border-warning-200 bg-warning-50'}`}>
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-bold text-primary-400">{index + 1}</span>
                <span className="font-bold text-primary-900">{HOMEPAGE_SECTION_LABELS[section.sectionKey]}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Move up" disabled={index === 0 || movingKey === section.sectionKey} onClick={() => void moveSection(section, 'up')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label="Move down" disabled={index === sections.length - 1 || movingKey === section.sectionKey} onClick={() => void moveSection(section, 'down')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" disabled={togglingKey === section.sectionKey} onClick={() => void toggleVisible(section)} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${section.isVisible ? 'border-primary-200 bg-white text-primary-800 hover:bg-primary-100' : 'border-warning-300 bg-white text-warning-800 hover:bg-warning-100'}`}>
                  {togglingKey === section.sectionKey ? <Loader2 className="h-4 w-4 animate-spin" /> : section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {section.isVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
