import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

interface DynamicListEditorProps {
  id: string;
  label: string;
  description: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function DynamicListEditor({ id, label, description, value, onChange, error }: DynamicListEditorProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const addItem = () => onChange([...value, '']);
  const updateItem = (index: number, item: string) => onChange(value.map((current, currentIndex) => currentIndex === index ? item : current));
  const removeItem = (index: number) => onChange(value.filter((_, currentIndex) => currentIndex !== index));
  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= value.length) return;
    const reordered = [...value];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    onChange(reordered);
  };

  return (
    <fieldset id={id} className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 md:p-5">
      <legend className="px-1 text-sm font-bold text-primary-900">{label}</legend>
      <p id={descriptionId} className="mb-4 text-xs leading-relaxed text-primary-500">{description}</p>
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-3 w-6 flex-none text-center text-xs font-bold text-primary-400" aria-hidden="true">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                aria-label={`${label} item ${index + 1}`}
                aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
                aria-invalid={Boolean(error && !item.trim())}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200 ${!item.trim() ? 'border-danger-300' : 'border-primary-200 focus:border-accent-500'}`}
              />
            </div>
            <div className="flex flex-none gap-1">
              <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label={`Move ${label} item ${index + 1} up`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => moveItem(index, 1)} disabled={index === value.length - 1} aria-label={`Move ${label} item ${index + 1} down`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => removeItem(index)} aria-label={`Remove ${label} item ${index + 1}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-danger-200 bg-white text-danger-600 hover:bg-danger-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {value.length === 0 && <p className="rounded-lg border border-dashed border-primary-200 bg-white p-4 text-center text-sm text-primary-500">No items added yet.</p>}
      {error && <p id={errorId} role="alert" className="mt-3 text-xs font-bold text-danger-600">{error}</p>}
      <button type="button" onClick={addItem} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-bold text-primary-700 hover:bg-primary-100"><Plus className="h-4 w-4" />Add item</button>
    </fieldset>
  );
}
