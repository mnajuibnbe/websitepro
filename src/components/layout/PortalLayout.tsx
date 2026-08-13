import type { ReactNode } from 'react';
import { PageContainer } from './PageContainer';

interface PortalLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  mobileNavigationTrigger?: ReactNode;
  /**
   * The passed-in sidebar's own desktop CSS position, so this shell can
   * reserve the matching space: `fixed` sidebars (AdminSidebar) never occupy
   * document flow, so main needs `lg:pl-72`; `sticky` sidebars (the student
   * Sidebar) do occupy flow, so main needs to be a flex sibling instead —
   * combining both approaches double-reserves the space.
   */
  sidebarPosition?: 'fixed' | 'sticky';
}

/** Shared LTR shell for authenticated student and administration screens. */
export function PortalLayout({ sidebar, children, mobileNavigationTrigger, sidebarPosition = 'fixed' }: PortalLayoutProps) {
  const isSticky = sidebarPosition === 'sticky';
  return (
    <div className={`min-h-screen bg-primary-50 font-sans ${isSticky ? 'lg:flex' : ''}`}>
      {sidebar}
      {mobileNavigationTrigger}
      <main id="main-content" className={`pb-24 pt-20 transition-all duration-300 lg:pt-8 ${isSticky ? 'min-w-0 flex-1' : 'lg:pl-72'}`}>
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
