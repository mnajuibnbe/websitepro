import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DESKTOP_NAVIGATION_QUERY, lockScroll, shouldCloseDrawerForKey } from '../lib/mobileDrawer';

interface MobileDrawerLifecycleOptions {
  authSessionKey?: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

/** Owns the shared lifecycle for authenticated mobile navigation drawers. */
export function useMobileDrawerLifecycle({ authSessionKey, isOpen, setIsOpen }: MobileDrawerLifecycleOptions) {
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(false);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  useEffect(() => {
    close();
  }, [location.hash, location.key, location.pathname, location.search, close]);

  useEffect(() => {
    close();
  }, [authSessionKey, close]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia(DESKTOP_NAVIGATION_QUERY);
    const synchronizeBreakpoint = (matches: boolean) => {
      setIsDesktop(matches);
      if (matches) close();
    };
    const handleBreakpointChange = (event: MediaQueryListEvent) => synchronizeBreakpoint(event.matches);

    synchronizeBreakpoint(desktopBreakpoint.matches);
    desktopBreakpoint.addEventListener('change', handleBreakpointChange);
    return () => desktopBreakpoint.removeEventListener('change', handleBreakpointChange);
  }, [close]);

  useEffect(() => {
    if (!isOpen || isDesktop) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (shouldCloseDrawerForKey(event.key)) close();
    };
    const restoreBodyScroll = lockScroll(document.body);

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      restoreBodyScroll();
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, isDesktop, isOpen]);

  return {
    close,
    currentPath: location.pathname,
    isDesktop,
    isDrawerInteractive: isOpen || isDesktop,
  };
}
