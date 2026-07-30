import { Link } from 'react-router-dom';
import { OptimizedImage } from '../ui/OptimizedImage';

interface TutibaBrandProps {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
  onClick?: () => void;
}

export function TutibaBrand({ compact = false, inverted = false, className = '', onClick }: TutibaBrandProps) {
  const titleColor = inverted ? 'text-white' : 'text-primary-900';
  const subtitleColor = inverted ? 'text-primary-300' : 'text-primary-500';

  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Tutiba home"
      className={`inline-flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80 ${className}`}
    >
      <OptimizedImage priority displayWidth={36} src="/tutiba-mark.svg" alt="" width={compact?28:36} height={compact?28:36} className={compact?'h-7 w-7':'h-9 w-9'} />
      <span className="flex flex-col text-left">
        <span className={`font-sans font-bold uppercase leading-none tracking-tight ${titleColor} ${compact ? 'text-lg' : 'text-2xl'}`}>Tutiba</span>
        {!compact && <span className={`mt-1 text-[10px] font-medium uppercase tracking-[0.18em] ${subtitleColor}`}>Cosmeceutical Education</span>}
      </span>
    </Link>
  );
}
