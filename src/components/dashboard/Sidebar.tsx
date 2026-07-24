import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Award, Settings, LogOut, Menu, X } from 'lucide-react';
import { FlaskConical, Droplet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Permission } from '../../types/auth';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user } = useAuth();
  const { logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasPermission } = useAuthorization();
  const isAdmin = hasPermission(Permission.ADMIN_ACCESS);
  
  const navItems = [
    { icon: Home, label: 'لوحة التحكم', href: '/dashboard' },
    { icon: BookOpen, label: 'كورساتي', href: '/my-courses' },
    { icon: Award, label: 'الشهادات', href: '/certificate' },
    { icon: Settings, label: 'الإعدادات', href: '/profile' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-primary-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 right-0 h-screen w-72 bg-white border-l border-primary-200 flex flex-col z-50 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-primary-100">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative flex items-center justify-center text-accent-600">
              <FlaskConical className="w-8 h-8" strokeWidth={1.5} />
              <Droplet className="w-3 h-3 absolute bottom-0 right-0 text-accent-400 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary-900 uppercase">Tutiba</span>
          </Link>
          <button 
            className="lg:hidden text-primary-500 hover:text-primary-900"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-8 px-4 flex flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <Link 
                key={index} 
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                    ? 'bg-accent-50 text-accent-700' 
                    : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent-600' : 'text-primary-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-primary-100">
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-primary-600 hover:bg-primary-50 transition-colors mb-2">
              <Settings className="w-5 h-5" />
              <span>لوحة الإدارة</span>
            </Link>
          )}
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-danger-600 hover:bg-danger-50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
