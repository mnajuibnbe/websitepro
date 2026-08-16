import { ORIGINAL_VALUE_SIGNALS, type OriginalValueSignal } from '../../services/blogPosts.service';

interface OriginalValuePanelProps {
  signals: OriginalValueSignal[];
  onChange: (signals: OriginalValueSignal[]) => void;
}

/**
 * Self-reported checklist, not auto-detection — the writer flags what this specific
 * article actually has. Feeds the "Trust & Sources" score category alongside Sources.
 */
export function OriginalValuePanel({ signals, onChange }: OriginalValuePanelProps) {
  const toggle = (key: OriginalValueSignal) => {
    onChange(signals.includes(key) ? signals.filter((s) => s !== key) : [...signals, key]);
  };

  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {ORIGINAL_VALUE_SIGNALS.map((signal) => (
        <label key={signal.key} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-sm text-primary-700 hover:bg-primary-50">
          <input type="checkbox" checked={signals.includes(signal.key)} onChange={() => toggle(signal.key)} className="h-4 w-4 flex-none rounded border-primary-300 text-accent-600 focus:ring-accent-500" />
          {signal.label}
        </label>
      ))}
    </div>
  );
}
