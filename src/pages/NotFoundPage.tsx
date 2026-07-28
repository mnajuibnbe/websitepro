import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <section className="px-4 pb-24 pt-36 text-center" aria-labelledby="not-found-title">
        <SearchX className="mx-auto mb-6 h-16 w-16 text-accent-600" aria-hidden="true" />
        <p className="mb-3 font-semibold text-accent-700">404 error</p>
        <h1 id="not-found-title" className="mb-4 text-4xl font-bold text-primary-900">Page not found</h1>
        <p className="mx-auto mb-8 max-w-lg text-lg text-primary-600">The page may have moved or the address may be incorrect.</p>
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
        </Link>
      </section>
    </PublicLayout>
  );
}
