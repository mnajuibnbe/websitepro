import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Link2, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDialogA11y } from './useDialogA11y';

export interface LinkPickerResult { href: string; internal: boolean; label: string }

interface LinkPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: LinkPickerResult) => void;
  initialHref?: string;
  initialInternal?: boolean;
  initialLabel?: string;
  showLabelField?: boolean;
}

interface Target { label: string; path: string; group: string }

const STATIC_PAGES: Target[] = [
  { label: 'Home', path: '/', group: 'Pages' },
  { label: 'Courses', path: '/courses', group: 'Pages' },
  { label: 'Blog', path: '/blog', group: 'Pages' },
  { label: 'About', path: '/about', group: 'Pages' },
  { label: 'FAQ', path: '/faq', group: 'Pages' },
  { label: 'Contact', path: '/contact', group: 'Pages' },
];

function useInternalLinkTargets(isOpen: boolean) {
  const [targets, setTargets] = useState<Target[]>(STATIC_PAGES);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.all([
      supabase.from('courses').select('id, title').eq('status', 'published').or('visibility.eq.public,visibility.is.null'),
      supabase.from('blog_posts').select('slug, title').eq('status', 'published'),
    ]).then(([courses, posts]) => {
      if (!active) return;
      const courseTargets: Target[] = (courses.data || []).map((c: { id: string; title: string }) => ({ label: c.title, path: `/course/${c.id}`, group: 'Courses' }));
      const postTargets: Target[] = (posts.data || []).map((p: { slug: string; title: string }) => ({ label: p.title, path: `/blog/${p.slug}`, group: 'Blog posts' }));
      setTargets([...STATIC_PAGES, ...courseTargets, ...postTargets]);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [isOpen]);

  return targets;
}

export function LinkPickerDialog({ isOpen, onClose, onConfirm, initialHref = '', initialInternal = true, initialLabel = '', showLabelField = false }: LinkPickerDialogProps) {
  const [tab, setTab] = useState<'internal' | 'external'>(initialInternal || !initialHref ? 'internal' : 'external');
  const [query, setQuery] = useState('');
  const [externalUrl, setExternalUrl] = useState(initialInternal ? '' : initialHref);
  const [label, setLabel] = useState(initialLabel);
  const [error, setError] = useState('');
  const dialogRef = useDialogA11y(isOpen, onClose);
  const targets = useInternalLinkTargets(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialInternal || !initialHref ? 'internal' : 'external');
    setExternalUrl(initialInternal ? '' : initialHref);
    setLabel(initialLabel);
    setQuery('');
    setError('');
  }, [isOpen, initialHref, initialInternal, initialLabel]);

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? targets.filter((t) => t.label.toLowerCase().includes(q)) : targets;
    return list.slice(0, 40);
  }, [targets, query]);

  if (!isOpen) return null;

  const confirmInternal = (target: Target) => {
    if (showLabelField && !label.trim()) { setError('Add a label for the button.'); return; }
    onConfirm({ href: target.path, internal: true, label: label.trim() || target.label });
  };

  const confirmExternal = () => {
    const trimmed = externalUrl.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) { setError('Enter a full URL starting with https://'); return; }
    if (showLabelField && !label.trim()) { setError('Add a label for the button.'); return; }
    onConfirm({ href: trimmed, internal: false, label: label.trim() || trimmed });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-900/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="link-picker-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-primary-100 p-4">
          <h2 id="link-picker-title" className="text-lg font-bold text-primary-900">Insert link</h2>
          <button type="button" data-dialog-close onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-100"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex border-b border-primary-100 px-4">
          <button type="button" onClick={() => { setTab('internal'); setError(''); }} className={`flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-sm font-bold transition-colors ${tab === 'internal' ? 'border-accent-600 text-accent-700' : 'border-transparent text-primary-500 hover:text-primary-800'}`}>
            <Link2 className="h-4 w-4" />Internal page
          </button>
          <button type="button" onClick={() => { setTab('external'); setError(''); }} className={`flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-sm font-bold transition-colors ${tab === 'external' ? 'border-accent-600 text-accent-700' : 'border-transparent text-primary-500 hover:text-primary-800'}`}>
            <ExternalLink className="h-4 w-4" />External URL
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showLabelField && (
            <label className="mb-3 block text-sm font-bold text-primary-800">Label
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Explore the Diploma" className="mt-1.5 min-h-11 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-normal outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
            </label>
          )}

          {tab === 'internal' ? (
            <>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages, courses, articles…" className="min-h-11 w-full rounded-xl border border-primary-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
              </div>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {filteredTargets.map((target) => (
                  <li key={`${target.group}-${target.path}`}>
                    <button type="button" onClick={() => confirmInternal(target)} className="flex w-full min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent-50">
                      <span className="truncate font-medium text-primary-900">{target.label}</span>
                      <span className="flex-none text-xs text-primary-400">{target.group}</span>
                    </button>
                  </li>
                ))}
                {filteredTargets.length === 0 && <li className="px-3 py-6 text-center text-sm text-primary-500">No matching pages.</li>}
              </ul>
            </>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-primary-800">URL
                <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://example.com/article" className="mt-1.5 min-h-11 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-normal outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500" />
              </label>
              <p className="text-xs text-primary-500">Opens in a new tab. Applied as a standard external link — Google follows it like any other link on the page.</p>
              <button type="button" onClick={confirmExternal} className="min-h-11 w-full rounded-xl bg-accent-600 px-4 text-sm font-bold text-white hover:bg-accent-700">Insert link</button>
            </div>
          )}

          {error && <p role="alert" className="mt-3 rounded-lg bg-danger-50 p-2.5 text-sm text-danger-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
