import { useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { BlogSource } from '../../services/blogPosts.service';
import { sourceDomain, validateSource } from '../../lib/blogSources';

interface SourcesPanelProps {
  sources: BlogSource[];
  onChange: (sources: BlogSource[]) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Structured citation list, kept separate from the free-form article HTML (unlike
 * Internal Linking's insert-into-content flow) so each source stays individually
 * editable and removable. Rendered as a proper "Sources" section on the public page.
 */
export function SourcesPanel({ sources, onChange }: SourcesPanelProps) {
  const [draft, setDraft] = useState<BlogSource>({ name: '', url: '', accessedDate: today() });
  const [error, setError] = useState('');

  const addSource = () => {
    const trimmed: BlogSource = { name: draft.name.trim(), url: draft.url.trim(), accessedDate: draft.accessedDate.trim() };
    const validationError = validateSource(trimmed);
    if (validationError) { setError(validationError); return; }
    onChange([...sources, trimmed]);
    setDraft({ name: '', url: '', accessedDate: today() });
    setError('');
  };

  const removeSource = (index: number) => onChange(sources.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {sources.length > 0 && (
        <ul className="space-y-1.5">
          {sources.map((source, index) => (
            <li key={`${source.url}-${index}`} className="flex items-start justify-between gap-2 rounded-lg border border-primary-100 p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary-900">{source.name}</p>
                <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 truncate text-xs text-accent-700 hover:underline"><ExternalLink className="h-3 w-3 flex-none" />{sourceDomain(source.url)}</a>
                <p className="text-xs text-primary-400">Accessed {source.accessedDate}</p>
              </div>
              <button type="button" onClick={() => removeSource(index)} aria-label={`Remove ${source.name}`} className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-primary-400 hover:bg-danger-50 hover:text-danger-600"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-lg border border-primary-100 bg-primary-50/60 p-3">
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Source name" className="min-h-9 w-full rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
        <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://example.com/source" className="min-h-9 w-full rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
        <div className="flex gap-2">
          <input type="date" value={draft.accessedDate} onChange={(e) => setDraft((d) => ({ ...d, accessedDate: e.target.value }))} className="min-h-9 flex-1 rounded-lg border border-primary-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
          <button type="button" onClick={addSource} className="flex min-h-9 flex-none items-center gap-1 rounded-lg bg-accent-600 px-3 text-xs font-bold text-white hover:bg-accent-700"><Plus className="h-3.5 w-3.5" />Add source</button>
        </div>
        {error && <p role="alert" className="text-xs text-danger-700">{error}</p>}
      </div>
    </div>
  );
}
