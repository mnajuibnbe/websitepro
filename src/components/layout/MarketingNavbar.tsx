import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Menu, Search, ChevronDown, X, FlaskConical, Droplet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function MarketingNavbar() {
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

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm py-1' : 'bg-transparent py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center text-accent-600">
               <FlaskConical className="w-8 h-8" strokeWidth={1.5} />
               <Droplet className="w-3 h-3 absolute bottom-0 right-0 text-accent-400 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-primary-900 leading-none font-sans uppercase">TUTIBA</span>
              <span className="text-[10px] text-primary-500 font-medium tracking-widest uppercase">Cosmeceutical Education</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <a href="#/courses" className="flex items-center gap-1 cursor-pointer text-primary-900 hover:text-accent-600 font-medium transition-colors">
              <span>Courses</span>
              <ChevronDown className="w-4 h-4" />
            </a>
            <a href="#/about" className="text-primary-900 hover:text-accent-600 font-medium transition-colors">About</a>
            <a href="#/blog" className="text-primary-900 hover:text-accent-600 font-medium transition-colors">Blog</a>
            
            <div className="h-6 w-px bg-primary-200 mx-2"></div>
            
            <button className="text-primary-900 hover:text-accent-600 focus:outline-none transition-colors">
              <Search className="w-5 h-5" />
            </button>
            {isAuthenticated ? (
              <a href="#/dashboard" className="text-primary-900 hover:text-accent-600 font-medium transition-colors">Dashboard</a>
            ) : (
              <a href="#/login" className="text-primary-900 hover:text-accent-600 font-medium transition-colors">Login</a>
            )}
            <Button variant="primary" onClick={() => window.location.hash = '#/courses'}>
              Enroll Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-primary-900 hover:text-accent-600 focus:outline-none">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
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
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform transform">
            <div className="flex items-center justify-between h-20 px-6 border-b border-primary-100">
              <div className="flex items-center gap-3">
                <FlaskConical className="w-7 h-7 text-accent-600" />
                <span className="font-bold text-lg text-primary-900 uppercase">TUTIBA</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-primary-500 hover:text-primary-900 focus:outline-none bg-primary-50 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col py-6 px-6 space-y-6 overflow-y-auto">
              <a href="#/courses" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Courses</a>
              <a href="#/about" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</a>
              <a href="#/blog" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Blog</a>
              <hr className="border-primary-100" />
              {isAuthenticated ? (
                <a href="#/dashboard" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</a>
              ) : (
                <a href="#/login" className="text-lg font-medium text-primary-900 hover:text-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Login</a>
              )}
              <Button variant="primary" className="w-full" onClick={() => {
                window.location.hash = '#/courses';
                setIsMobileMenuOpen(false);
              }}>
                Enroll Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
