export const DESKTOP_NAVIGATION_QUERY = '(min-width: 1024px)';

export function shouldCloseDrawerForKey(key: string) {
  return key === 'Escape';
}

export function shouldDismissFromBackdrop(startedOnBackdrop: boolean, endedOnBackdrop: boolean) {
  return startedOnBackdrop && endedOnBackdrop;
}

interface ScrollLockTarget {
  style: {
    overflow: string;
  };
}

interface ScrollLockState {
  count: number;
  previousOverflow: string;
}

const scrollLocks = new WeakMap<ScrollLockTarget, ScrollLockState>();

/** Locks a scroll container and restores it after the final owner releases it. */
export function lockScroll(target: ScrollLockTarget) {
  const activeLock = scrollLocks.get(target);
  if (activeLock) {
    activeLock.count += 1;
  } else {
    scrollLocks.set(target, { count: 1, previousOverflow: target.style.overflow });
    target.style.overflow = 'hidden';
  }

  let restored = false;

  return () => {
    if (restored) return;
    restored = true;

    const lock = scrollLocks.get(target);
    if (!lock) return;
    lock.count -= 1;
    if (lock.count > 0) return;

    target.style.overflow = lock.previousOverflow;
    scrollLocks.delete(target);
  };
}
