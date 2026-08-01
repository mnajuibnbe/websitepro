import type { HTMLAttributes } from 'react';

/**
 * Canonical horizontal page grid.
 *
 * Keep page-level width and gutters here. Narrow reading columns belong inside
 * this container so the site chrome and page content always share an edge.
 */
export function PageContainer({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-page px-page-gutter sm:px-page-gutter-sm lg:px-page-gutter-lg ${className}`.trim()}
      {...props}
    />
  );
}
