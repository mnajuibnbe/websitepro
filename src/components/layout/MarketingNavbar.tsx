import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TutibaBrand } from './TutibaBrand';

const navigationItems = [
  { label: 'Home', to: '/', matches: (pathname: string) => pathname === '/' },
  { label: 'Courses', to: '/courses', matches: (pathname: string) => pathname.startsWith('/course') },
  { label: 'About', to: '/about', matches: (pathname: string) => pathname === '/about' },
  { label: 'Blog', to: '/blog', matches: (pathname: string) => pathname.startsWith('/blog') },
  { label: 'Contact', to: '/contact', matches: (pathname: string) => pathname === '/contact' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <TutibaBrand className="flex-shrink-0" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {navigationItems.slice(1).map(item => <Link key={item.to} to={item.to} aria-current={item.matches(location.pathname) ? 'page' : undefined} className="relative rounded py-2 text-primary-900 font-medium transition-colors hover:text-accent-700 aria-[current=page]:text-accent-700 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent-600 after:transition-transform aria-[current=page]:after:scale-x-100">{item.label}</Link>)}

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
          <div className="flex items-center lg:hidden">
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
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div id="marketing-navigation-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="mobile-drawer-viewport fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform transform motion-reduce:transition-none">
            <div className="flex items-center justify-between h-20 px-6 border-b border-primary-100">
              <TutibaBrand compact onClick={() => setIsMobileMenuOpen(false)} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                data-drawer-close
                type="button"
                aria-label="Close navigation menu"
                className="text-primary-500 hover:text-primary-900 focus:outline-none bg-primary-50 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col py-6 px-6 space-y-6 overflow-y-auto">
              {navigationItems.map(item => <Link key={item.to} to={item.to} aria-current={item.matches(location.pathname) ? 'page' : undefined} className="rounded-lg px-3 py-2 text-lg font-medium text-primary-900 transition-colors hover:bg-primary-50 hover:text-accent-700 aria-[current=page]:bg-accent-50 aria-[current=page]:text-accent-800" onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>)}
              <hr className="border-primary-100" />
              {isAuthenticated ? (
                <Link to="/dashboard" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              ) : (
                <Link to="/login" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
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
      )}
    </nav>
    </>
  );
}
