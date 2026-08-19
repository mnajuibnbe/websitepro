import React from 'react';
import { ExternalLink, Link2Off } from 'lucide-react';

interface ExternalLinkLessonRendererProps {
  title: string;
  url: string | null;
  openInNewTab?: boolean;
}

export function ExternalLinkLessonRenderer({ title, url, openInNewTab }: ExternalLinkLessonRendererProps) {
  if (!url) {
    return (
      <div className="bg-white border border-primary-200 rounded-2xl p-8 md:p-12 text-center text-primary-600 shadow-sm">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-4 border border-primary-100">
          <Link2Off className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-primary-900 mb-2">Resource unavailable</h3>
        <p className="text-primary-500 max-w-md mx-auto text-sm leading-relaxed">
          This lesson does not have a linked resource yet.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-primary-200 bg-white p-6 md:p-10 shadow-sm text-left" dir="ltr" aria-label={`${title} external resource`}>
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-primary-100 text-info-700">
        <ExternalLink className="w-5 h-5 flex-shrink-0" />
        <span className="font-bold text-sm">External resource</span>
      </div>
      <p className="text-primary-700 mb-6 leading-relaxed">
        This lesson links to an external resource{openInNewTab ? ' that opens in a new tab' : ''}.
      </p>
      <a
        href={url}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noreferrer' : undefined}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-900 px-5 font-bold text-white hover:bg-primary-800 transition-colors"
      >
        <ExternalLink className="w-4 h-4" aria-hidden="true" /> Open resource
      </a>
    </section>
  );
}
