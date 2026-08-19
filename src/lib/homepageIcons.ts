import {
  Award,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
  GraduationCap,
  Heart,
  Laptop,
  Layers,
  Microscope,
  Play,
  PlayCircle,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export const HOMEPAGE_ICON_OPTIONS: Record<string, LucideIcon> = {
  Microscope,
  UsersRound,
  PlayCircle,
  RefreshCw,
  Laptop,
  BookOpen,
  BookOpenCheck,
  ScanSearch,
  FlaskConical,
  Layers,
  ShieldCheck,
  FileText,
  Play,
  GraduationCap,
  CheckCircle2,
  Star,
  Sparkles,
  Clock3,
  Award,
  Target,
  Heart,
};

export const HOMEPAGE_ICON_KEYS = Object.keys(HOMEPAGE_ICON_OPTIONS);

export function resolveHomepageIcon(key: string): LucideIcon {
  return HOMEPAGE_ICON_OPTIONS[key] || Sparkles;
}
