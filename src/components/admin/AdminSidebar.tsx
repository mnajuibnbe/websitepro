import { Link } from 'react-router-dom';
import { Home, BookOpen, Users, LogOut, Menu, X, BarChart3, GraduationCap, ClipboardCheck, Tags, PanelsTopLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMobileDrawerLifecycle } from '../../hooks/useMobileDrawerLifecycle';
import { MobileDrawerBackdrop } from '../layout/MobileDrawerBackdrop';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const { logout, user } = useAuth();
  const { close, currentPath, isDrawerInteractive } = useMobileDrawerLifecycle({ authSessionKey: user?.id, isOpen, setIsOpen });

  const navItems = user?.role === 'admin' ? [
    { icon: BarChart3, label: 'Admin overview', href: '/admin' },
    { icon: BookOpen, label: 'Course management', href: '/admin/courses' },
    { icon: Tags, label: 'Course categories', href: '/admin/course-categories' },
    { icon: PanelsTopLeft, label: 'Homepage settings', href: '/admin/homepage' },
    { icon: Users, label: 'User management', href: '/admin/users' },
    { icon: GraduationCap, label: 'Instructor applications', href: '/admin/instructors' },
    { icon: ClipboardCheck, label: 'Course reviews', href: '/admin/course-reviews' },
    { icon: ClipboardCheck, label: 'Learner reviews', href: '/admin/reviews' },
  ] : [
    { icon: BookOpen, label: 'My authored courses', href: '/instructor/courses' },
    { icon: GraduationCap, label: 'Create course', href: '/instructor/courses/new' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      {!isOpen && <button
        type="button"
        aria-label="Open admin navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-50 min-h-11 min-w-11 rounded-xl border border-primary-200 bg-white p-2 text-primary-600 shadow-sm lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>}

      {/* Sidebar */}
      <aside aria-label="Admin navigation" aria-hidden={!isDrawerInteractive || undefined} inert={!isDrawerInteractive || undefined} data-state={isOpen ? 'open' : 'closed'} className={`mobile-drawer-viewport fixed inset-y-0 right-0 w-[min(18rem,100vw)] min-h-0 bg-white border-l border-primary-200 shadow-sm flex flex-col transition-transform duration-300 motion-reduce:transition-none z-40 lg:left-0 lg:right-auto lg:border-l-0 lg:border-r ${!isDrawerInteractive ? 'pointer-events-none lg:pointer-events-auto ' : ''}${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="min-h-16 shrink-0 flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] border-b border-primary-100">
          <div className="font-bold text-xl text-primary-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-accent-600 text-white flex items-center justify-center text-sm">
              T
            </span>
            <span>{user?.role === 'admin' ? 'Tutiba Admin' : 'Tutiba Instructor'}</span>
          </div>
          <button type="button" aria-label="Close admin navigation" onClick={close} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-50 hover:text-primary-900 lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Administration" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-8 px-4 flex flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (item.href === '/admin/courses' && currentPath.startsWith('/admin/courses/'));
            return (
              <Link
                key={index}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={close}
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
        <div className="shrink-0 border-t border-primary-100 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link to="/dashboard" onClick={close} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-primary-600 hover:bg-primary-50 transition-colors mb-2">
            <Home className="w-5 h-5" />
            <span>Student dashboard</span>
          </Link>
          <button type="button" onClick={() => { close(); void logout(); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-danger-600 hover:bg-danger-50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <MobileDrawerBackdrop
          className="fixed inset-0 bg-primary-900/20 backdrop-blur-sm z-30 lg:hidden"
          onDismiss={close}
        />
      )}
    </>
  );
}
