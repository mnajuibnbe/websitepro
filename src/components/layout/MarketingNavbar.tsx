import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Menu, Search, X, FlaskConical, Droplet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function MarketingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setIsMobileMenuOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
    <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-primary-900 shadow-lg focus:not-sr-only">Skip to main content</a>
    <nav aria-label="Primary navigation"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm py-1' : 'bg-transparent py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="relative flex items-center justify-center text-accent-600">
               <FlaskConical className="w-8 h-8" strokeWidth={1.5} />
               <Droplet className="w-3 h-3 absolute bottom-0 right-0 text-accent-400 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-primary-900 leading-none font-sans uppercase">TUTIBA</span>
              <span className="text-[10px] text-primary-500 font-medium tracking-widest uppercase">Cosmeceutical Education</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <Link to="/courses" aria-current={location.pathname.startsWith('/course') ? 'page' : undefined} className="text-primary-900 hover:text-accent-600 font-medium transition-colors aria-[current=page]:text-accent-700">Courses</Link>
            <Link to="/about" aria-current={location.pathname === '/about' ? 'page' : undefined} className="text-primary-900 hover:text-accent-600 font-medium transition-colors aria-[current=page]:text-accent-700">About</Link>
            <Link to="/blog" aria-current={location.pathname.startsWith('/blog') ? 'page' : undefined} className="text-primary-900 hover:text-accent-600 font-medium transition-colors aria-[current=page]:text-accent-700">Blog</Link>
            <Link to="/contact" aria-current={location.pathname === '/contact' ? 'page' : undefined} className="text-primary-900 hover:text-accent-600 font-medium transition-colors aria-[current=page]:text-accent-700">Contact</Link>

            <div className="h-6 w-px bg-primary-200 mx-2"></div>

            <button type="button" aria-label="Search courses" onClick={() => navigate('/courses')} className="text-primary-900 hover:text-accent-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>

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
          <div className="flex items-center gap-4 lg:hidden">
            <button type="button" aria-label="Search courses" onClick={() => navigate('/courses')} className="text-primary-900 hover:text-accent-600">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="text-primary-900 hover:text-accent-600 focus:outline-none"
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
          <div
            className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <div role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform transform">
            <div className="flex items-center justify-between h-20 px-6 border-b border-primary-100">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
                <FlaskConical className="w-7 h-7 text-accent-600" />
                <span className="font-bold text-lg text-primary-900 uppercase">TUTIBA</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="text-primary-500 hover:text-primary-900 focus:outline-none bg-primary-50 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col py-6 px-6 space-y-6 overflow-y-auto">
              <Link to="/courses" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Courses</Link>
              <Link to="/about" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
              <Link to="/blog" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
              <Link to="/contact" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
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
