import { FlaskConical, Droplet } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <span aria-hidden="true" className="relative flex shrink-0 items-center justify-center text-accent-600">
        <FlaskConical className={compact ? 'h-7 w-7' : 'h-9 w-9'} strokeWidth={1.5} />
        <Droplet className={`absolute bottom-0 right-0 fill-current text-accent-400 ${compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}`} />
      </span>
      <span className="flex flex-col text-left">
        <span className={`font-sans font-bold uppercase leading-none tracking-tight ${titleColor} ${compact ? 'text-lg' : 'text-2xl'}`}>Tutiba</span>
        {!compact && <span className={`mt-1 text-[10px] font-medium uppercase tracking-[0.18em] ${subtitleColor}`}>Cosmeceutical Education</span>}
      </span>
    </Link>
  );
}
