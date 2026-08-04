import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

interface CountUpProps {
  value: string;
  className?: string;
  duration?: number;
}

function parseValue(value: string) {
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  if (!match) return { prefix: '', number: 0, suffix: value, hasComma: false };
  const [, prefix, numberText, suffix] = match;
  return { prefix, number: parseInt(numberText.replace(/,/g, ''), 10), suffix, hasComma: numberText.includes(',') };
}

function formatNumber(value: number, hasComma: boolean) {
  const rounded = Math.round(value);
  return hasComma ? rounded.toLocaleString('en-US') : String(rounded);
}

export function CountUp({ value, className, duration = 1.4 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const { prefix, number, suffix, hasComma } = parseValue(value);
  const [display, setDisplay] = useState(shouldReduceMotion ? number : 0);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) {
      setDisplay(number);
      return;
    }
    const controls = animate(0, number, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: latest => setDisplay(latest),
    });
    return () => controls.stop();
  }, [isInView, number, shouldReduceMotion, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(display, hasComma)}
      {suffix}
    </span>
  );
}
