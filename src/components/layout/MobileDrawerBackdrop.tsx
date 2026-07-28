import { useRef, type PointerEvent } from 'react';
import { shouldDismissFromBackdrop } from '../../lib/mobileDrawer';

interface MobileDrawerBackdropProps {
  className: string;
  onDismiss: () => void;
}

/** Dismisses only taps that both start and end on the backdrop. */
export function MobileDrawerBackdrop({ className, onDismiss }: MobileDrawerBackdropProps) {
  const pointerStartedOnBackdrop = useRef<number | null>(null);

  const isBackdropTarget = (event: PointerEvent<HTMLDivElement>) => event.target === event.currentTarget;

  return (
    <div
      className={className}
      aria-hidden="true"
      onPointerDown={event => {
        pointerStartedOnBackdrop.current = isBackdropTarget(event) ? event.pointerId : null;
      }}
      onPointerUp={event => {
        const startedOnBackdrop = pointerStartedOnBackdrop.current === event.pointerId;
        pointerStartedOnBackdrop.current = null;
        if (shouldDismissFromBackdrop(startedOnBackdrop, isBackdropTarget(event))) onDismiss();
      }}
      onPointerCancel={() => { pointerStartedOnBackdrop.current = null; }}
    />
  );
}
