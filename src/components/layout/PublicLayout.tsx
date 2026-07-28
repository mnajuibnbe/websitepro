import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { MarketingNavbar } from './MarketingNavbar';

export function PublicLayout({ children, className = 'bg-primary-50' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen flex flex-col font-sans ${className}`}>
      <MarketingNavbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
