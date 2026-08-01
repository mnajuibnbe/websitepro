import type { ReactNode } from 'react';
import { PageContainer } from './PageContainer';

interface PortalLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  mobileNavigationTrigger?: ReactNode;
}

/** Shared LTR shell for authenticated student and administration screens. */
export function PortalLayout({ sidebar, children, mobileNavigationTrigger }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-primary-50 font-sans">
      {sidebar}
      {mobileNavigationTrigger}
      <main id="main-content" className="pb-24 pt-20 transition-all duration-300 lg:pl-72 lg:pt-8">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
