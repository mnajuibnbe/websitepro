import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { BookOpen, Home, Info, LayoutDashboard, LogIn, Mail, Menu, Newspaper, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TutibaBrand } from './TutibaBrand';
import { PageContainer } from './PageContainer';

const navigationItems = [
  { icon: Home, label: 'Home', to: '/', matches: (pathname: string) => pathname === '/' },
  { icon: BookOpen, label: 'Courses', to: '/courses', matches: (pathname: string) => pathname.startsWith('/course') },
  { icon: Info, label: 'About', to: '/about', matches: (pathname: string) => pathname === '/about' },
  { icon: Newspaper, label: 'Blog', to: '/blog', matches: (pathname: string) => pathname.startsWith('/blog') },
  { icon: Mail, label: 'Contact', to: '/contact', matches: (pathname: string) => pathname === '/contact' },
] as const;

export function MarketingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hasSolidBackground = location.pathname !== '/' || isScrolled || isMobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const mainContent = document.getElementById('main-content');
    const previousOverflow = document.body.style.overflow;
    const mainWasInert = mainContent?.inert ?? false;
    const closeButton = drawerRef.current?.querySelector<HTMLButtonElement>('[data-drawer-close]');
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll('a[href], button:not([disabled])')) as HTMLElement[];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    if (mainContent) mainContent.inert = true;
    window.addEventListener('keydown', handleKeyDown);
    closeButton?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (mainContent) mainContent.inert = mainWasInert;
      window.removeEventListener('keydown', handleKeyDown);
      menuTriggerRef.current?.focus();
    };
  }, [isMobileMenuOpen]);

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  return (
    <>
    <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-primary-900 shadow-lg focus:not-sr-only">Skip to main content</a>
    <nav aria-label="Primary navigation"
      className={`fixed top-0 w-full z-50 transition-all duration-300 motion-reduce:transition-none ${
        hasSolidBackground ? 'bg-white/95 shadow-sm backdrop-blur-md py-1' : 'bg-transparent py-2'
      }`}
    >
      <PageContainer>
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-6 md:h-20">

          {/* Logo */}
          <TutibaBrand className="flex-shrink-0" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:justify-center lg:gap-7">
            {navigationItems.map(item => <Link key={item.to} to={item.to} aria-current={item.matches(location.pathname) ? 'page' : undefined} className="relative rounded py-2 text-primary-900 font-medium transition-colors hover:text-accent-700 aria-[current=page]:text-accent-700 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent-600 after:transition-transform aria-[current=page]:after:scale-x-100">{item.label}</Link>)}
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-end lg:gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="text-primary-900 hover:text-accent-600 font-medium transition-colors">Dashboard</Link>
            ) : (
              <Link to="/login" className="text-primary-900 hover:text-accent-600 font-medium transition-colors">Login</Link>
            )}

            <Button variant="primary" onClick={() => navigate('/courses')}>
              Enroll Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="col-start-3 flex items-center justify-end lg:hidden">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="marketing-navigation-drawer"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary-900 hover:bg-primary-100 hover:text-accent-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </PageContainer>

      {/* Mobile Drawer — anchored to the same right edge as its trigger. */}
        <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? '' : 'pointer-events-none'}`}>
          {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          )}

          {/* Drawer */}
          <div
            id="marketing-navigation-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            aria-hidden={!isMobileMenuOpen || undefined}
            inert={!isMobileMenuOpen || undefined}
            data-state={isMobileMenuOpen ? 'open' : 'closed'}
            className={`mobile-drawer-viewport fixed inset-y-0 right-0 flex w-[min(18rem,100vw)] min-h-0 flex-col border-l border-primary-200 bg-white shadow-xl transition-transform duration-300 motion-reduce:transition-none ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="min-h-20 shrink-0 flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] border-b border-primary-100">
              <TutibaBrand compact onClick={() => setIsMobileMenuOpen(false)} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                data-drawer-close
                type="button"
                aria-label="Close navigation menu"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-50 hover:text-primary-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-8 px-4 flex flex-col gap-2">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = item.matches(location.pathname);
                return <Link key={item.to} to={item.to} aria-current={isActive ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all ${isActive ? 'bg-accent-50 text-accent-700' : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'}`} onClick={() => setIsMobileMenuOpen(false)}><Icon className={`h-5 w-5 ${isActive ? 'text-accent-600' : 'text-primary-400'}`} /><span>{item.label}</span></Link>;
              })}
            </div>

            <div className="shrink-0 border-t border-primary-100 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {isAuthenticated ? (
                <Link to="/dashboard" className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-900" onClick={() => setIsMobileMenuOpen(false)}><LayoutDashboard className="h-5 w-5 text-primary-400" /> Dashboard</Link>
              ) : (
                <Link to="/login" className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-900" onClick={() => setIsMobileMenuOpen(false)}><LogIn className="h-5 w-5 text-primary-400" /> Login</Link>
              )}
              <Button variant="primary" className="w-full" onClick={() => {
                navigate('/courses');
                setIsMobileMenuOpen(false);
              }}>
                Enroll Now
              </Button>
            </div>
          </div>
        </div>
    </nav>
    </>
  );
}
