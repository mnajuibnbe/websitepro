import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { HOMEPAGE_ICON_KEYS, resolveHomepageIcon } from '../../../lib/homepageIcons';

export interface IconListItem { title: string; description: string; icon: string; }

interface IconListFieldEditorProps {
  items: IconListItem[];
  onChange: (items: IconListItem[]) => void;
  itemLabel: string;
  minItems?: number;
  maxItems?: number;
}

export function IconListFieldEditor({ items, onChange, itemLabel, minItems = 1, maxItems = 12 }: IconListFieldEditorProps) {
  const updateItem = (index: number, patch: Partial<IconListItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => onChange([...items, { title: '', description: '', icon: HOMEPAGE_ICON_KEYS[0] }]);
  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const Icon = resolveHomepageIcon(item.icon);
        return (
          <div key={index} className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-accent-50 text-accent-700"><Icon className="h-4 w-4" /></span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label={`Move ${itemLabel} ${index + 1} up`} disabled={index === 0} onClick={() => moveItem(index, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move ${itemLabel} ${index + 1} down`} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" aria-label={`Remove ${itemLabel} ${index + 1}`} disabled={items.length <= minItems} onClick={() => removeItem(index)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger-200 bg-white text-danger-600 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="block text-sm font-bold text-primary-800">Title<input value={item.title} onChange={event => updateItem(index, { title: event.target.value })} maxLength={120} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal" /></label>
              <label className="block text-sm font-bold text-primary-800">Icon<select value={item.icon} onChange={event => updateItem(index, { icon: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-primary-200 bg-white px-3 font-normal sm:w-40">
                {HOMEPAGE_ICON_KEYS.map(key => <option key={key} value={key}>{key}</option>)}
              </select></label>
            </div>
            <label className="mt-3 block text-sm font-bold text-primary-800">Description<textarea value={item.description} onChange={event => updateItem(index, { description: event.target.value })} rows={2} maxLength={400} className="mt-2 w-full rounded-xl border border-primary-200 bg-white p-3 font-normal" /></label>
          </div>
        );
      })}
      <button type="button" disabled={items.length >= maxItems} onClick={addItem} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add {itemLabel}</button>
    </div>
  );
}
