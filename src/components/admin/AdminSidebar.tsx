import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, LogOut, Menu, X, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: BarChart3, label: 'Admin overview', href: '/admin' },
    { icon: BookOpen, label: 'Course management', href: '/admin/courses' },
    { icon: Users, label: 'User management', href: '/admin/users' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        type="button"
        aria-label={isOpen ? 'Close admin navigation' : 'Open admin navigation'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-sm border border-primary-200 text-primary-600"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside aria-label="Admin navigation" className={`fixed top-0 left-0 h-screen w-72 bg-white border-r border-primary-200 shadow-sm flex flex-col transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-primary-100">
          <div className="font-bold text-xl text-primary-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-accent-600 text-white flex items-center justify-center text-sm">
              T
            </span>
            <span>Tutiba Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Administration" className="flex-grow py-8 px-4 flex flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (item.href === '/admin/courses' && currentPath.startsWith('/admin/courses/'));
            return (
              <Link
                key={index}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
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
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-primary-600 hover:bg-primary-50 transition-colors mb-2">
            <Home className="w-5 h-5" />
            <span>Student dashboard</span>
          </Link>
          <button type="button" onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-danger-600 hover:bg-danger-50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
