import type { ReactNode } from 'react';

interface PortalLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  mobileNavigationTrigger?: ReactNode;
}

/** Shared LTR shell for authenticated student and administration screens. */
export function PortalLayout({ sidebar, children, maxWidth = 'max-w-6xl', mobileNavigationTrigger }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-primary-50 font-sans">
      {sidebar}
      {mobileNavigationTrigger}
      <main id="main-content" className="pb-24 pt-20 transition-all duration-300 lg:pl-72 lg:pt-8">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>{children}</div>
      </main>
    </div>
  );
}
