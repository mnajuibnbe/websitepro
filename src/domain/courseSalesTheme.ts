import { FlaskConical, Scissors, Sparkles, Sprout, type LucideIcon } from 'lucide-react';

export interface CourseSalesTheme {
  accentBorder: string;
  badge: string;
  icon: LucideIcon;
  panel: string;
}

export function getCourseSalesTheme(category: string | null | undefined): CourseSalesTheme {
  if (category === 'Skin Care') {
    return { accentBorder: 'border-rose-300', badge: 'bg-rose-100 text-rose-800', icon: Sparkles, panel: 'from-rose-50 to-white' };
  }
  if (category === 'Hair Care') {
    return { accentBorder: 'border-violet-300', badge: 'bg-violet-100 text-violet-800', icon: Scissors, panel: 'from-violet-50 to-white' };
  }
  if (category === 'Cosmetic Science') {
    return { accentBorder: 'border-cyan-300', badge: 'bg-cyan-100 text-cyan-800', icon: FlaskConical, panel: 'from-cyan-50 to-white' };
  }
  return { accentBorder: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-800', icon: Sprout, panel: 'from-emerald-50 to-white' };
}
