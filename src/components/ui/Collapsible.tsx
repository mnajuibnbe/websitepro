import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

interface CollapsibleProps {
  children: ReactNode;
  /** Tailwind max-height utility class(es) applied while collapsed, e.g. "max-h-[220px]". Can include responsive variants. */
  collapsedClassName: string;
  /** Gradient fade color shown over the clipped edge while collapsed. Defaults to white, matching the page background. */
  fadeClassName?: string;
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
}

/**
 * Collapses arbitrarily-shaped content (rich text, item lists) to a fixed max-height with a
 * bottom fade and a "Show more/less" toggle. Content is never removed from the DOM, so nothing
 * is lost to search, AT, or copy/paste — only the visual height is clipped.
 */
export function Collapsible({
  children,
  collapsedClassName,
  fadeClassName = 'from-white via-white/90',
  className = '',
  expandLabel = 'Show more',
  collapseLabel = 'Show less',
}: CollapsibleProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Static, never-toggled clone of the collapsed max-height rule. Reading the threshold off this
  // element instead of the animated wrapper avoids a race where a computed-style read taken right
  // after collapsing (while the wrapper's own class/inline-style just changed) could resolve to
  // the wrong value and get `overflows` stuck at false — permanently hiding the toggle button.
  const probeRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const shouldReduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const content = contentRef.current;
    const probe = probeRef.current;
    if (!content || !probe) return;

    const measure = () => {
      const collapsedMaxHeight = parseFloat(getComputedStyle(probe).maxHeight);
      const fullHeight = content.scrollHeight;
      setExpandedHeight(fullHeight);
      if (Number.isFinite(collapsedMaxHeight)) {
        setOverflows(fullHeight > collapsedMaxHeight + 1);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(probe);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const showToggle = overflows || expanded;
  const isClipped = overflows && !expanded;

  return (
    <div className={className}>
      <div ref={probeRef} aria-hidden="true" className={`invisible absolute w-0 h-0 overflow-hidden ${collapsedClassName}`} />
      <div
        ref={wrapperRef}
        id={contentId}
        className={`relative overflow-hidden ${!expanded ? collapsedClassName : ''}`}
        style={
          shouldReduceMotion
            ? undefined
            : {
                maxHeight: expanded ? (expandedHeight ?? undefined) : undefined,
                transition: 'max-height 400ms ease',
              }
        }
      >
        <div ref={contentRef}>{children}</div>
        {isClipped && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${fadeClassName} to-transparent`}
          />
        )}
      </div>
      {showToggle && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded(v => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-accent-700 hover:text-accent-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 rounded"
        >
          {expanded ? collapseLabel : expandLabel}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
