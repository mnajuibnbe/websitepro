import { Link } from 'react-router-dom';
import { Home, BookOpen, Award, Settings, LogOut, X, GraduationCap } from 'lucide-react';
import { FlaskConical, Droplet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Permission } from '../../types/auth';
import { useMobileDrawerLifecycle } from '../../hooks/useMobileDrawerLifecycle';
import { MobileDrawerBackdrop } from '../layout/MobileDrawerBackdrop';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout, user } = useAuth();
  const { close, currentPath, isDrawerInteractive } = useMobileDrawerLifecycle({ authSessionKey: user?.id, isOpen, setIsOpen });
  const { hasPermission } = useAuthorization();
  const isAdmin = hasPermission(Permission.ADMIN_ACCESS);

  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'My Courses', href: '/my-courses' },
    { icon: Award, label: 'Certificates', href: '/certificate' },
    { icon: Settings, label: 'Settings', href: '/profile' },
    { icon: GraduationCap, label: 'Become an instructor', href: '/instructor/apply' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <MobileDrawerBackdrop
          className="fixed inset-0 bg-primary-900/50 z-40 lg:hidden backdrop-blur-sm"
          onDismiss={close}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Student navigation drawer"
        aria-hidden={!isDrawerInteractive || undefined}
        inert={!isDrawerInteractive || undefined}
        data-state={isOpen ? 'open' : 'closed'}
        className={`mobile-drawer-viewport fixed lg:sticky inset-y-0 left-0 w-[min(18rem,100vw)] bg-white border-r border-primary-200 flex min-h-0 flex-col z-50 transition-transform duration-300 motion-reduce:transition-none transform ${
          !isDrawerInteractive ? 'pointer-events-none lg:pointer-events-auto ' : ''
        }${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Logo */}
        <div className="min-h-20 shrink-0 flex items-center justify-between px-6 pt-[env(safe-area-inset-top)] border-b border-primary-100">
          <Link to="/" onClick={close} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative flex items-center justify-center text-accent-600">
              <FlaskConical className="w-8 h-8" strokeWidth={1.5} />
              <Droplet className="w-3 h-3 absolute bottom-0 right-0 text-accent-400 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-primary-900 uppercase">Tutiba</span>
          </Link>
          <button
            type="button"
            aria-label="Close student navigation"
            className="lg:hidden flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-50 hover:text-primary-900"
            onClick={close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Student navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-8 px-4 flex flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
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
          {isAdmin && (
            <Link to="/admin" onClick={close} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-primary-600 hover:bg-primary-50 transition-colors mb-2">
              <Settings className="w-5 h-5" />
              <span>Admin Dashboard</span>
            </Link>
          )}
          <button type="button" onClick={() => { close(); void logout(); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-danger-600 hover:bg-danger-50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
