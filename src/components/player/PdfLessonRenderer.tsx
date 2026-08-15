import { useEffect, useState } from 'react';
import { FileText, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../lib/apiBaseUrl';

interface PdfLessonRendererProps {
  lessonId: string;
  title: string;
}

export function PdfLessonRenderer({ lessonId, title }: PdfLessonRendererProps) {
  const { token } = useAuth();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setDocumentUrl(null);
    setError(null);
    if (!token) {
      setError('Your session expired. Sign in and try again.');
      return () => { active = false; };
    }

    void fetch(`${API_BASE_URL}/api/documents/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lessonId }),
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({})) as { token?: string; error?: string; correlationId?: string };
      if (!response.ok || !payload.token) {
        throw new Error(`${payload.error || 'The PDF could not be authorized.'}${payload.correlationId ? ` (Reference: ${payload.correlationId})` : ''}`);
      }
      if (active) setDocumentUrl(`${API_BASE_URL}/api/documents/file?token=${encodeURIComponent(payload.token)}`);
    }).catch((cause: Error) => {
      if (active) setError(cause.message);
    });
    return () => { active = false; };
  }, [lessonId, token, retry]);

  if (error) {
    return <div role="alert" className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center">
      <FileText className="mx-auto mb-3 h-10 w-10 text-danger-600" aria-hidden="true" />
      <h2 className="text-xl font-bold text-primary-900">PDF unavailable</h2>
      <p className="mt-2 text-primary-700">{error}</p>
      <button type="button" onClick={() => setRetry(value => value + 1)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-5 font-bold text-white">
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
      </button>
    </div>;
  }

  if (!documentUrl) {
    return <div role="status" className="flex min-h-96 items-center justify-center rounded-2xl border border-primary-200 bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-accent-600" aria-hidden="true" />
      <span className="ml-3 font-semibold text-primary-700">Authorizing PDF…</span>
    </div>;
  }

  return <section className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-sm" aria-label={`${title} PDF`}>
    <div className="flex items-center justify-between gap-4 border-b border-primary-200 px-4 py-3">
      <span className="truncate font-bold text-primary-900">{title}</span>
      <a href={documentUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-primary-300 px-4 font-bold text-primary-800">
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open PDF
      </a>
    </div>
    <iframe src={documentUrl} title={`${title} PDF document`} className="h-[70vh] min-h-[32rem] w-full bg-primary-50" />
  </section>;
}
