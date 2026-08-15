import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'span' | 'li';
}

const MOTION_TAGS = { div: motion.div, span: motion.span, li: motion.li } as const;

// A smaller trigger margin on short/small viewports keeps grouped sections from
// appearing to fire out of sync while scrolling — on mobile, less of the page
// is offscreen to begin with, so an 80px margin can delay a reveal well past
// the point the element is already visible.
function useViewportMargin() {
  const [isSmallScreen, setIsSmallScreen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsSmallScreen(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isSmallScreen ? '-20px' : '-80px';
}

export function Reveal({ children, className, delay = 0, y = 16, as = 'div' }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const margin = useViewportMargin();

  if (shouldReduceMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const MotionTag = MOTION_TAGS[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
