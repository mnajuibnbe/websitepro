import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}

export function Button({
  className = '',
  variant = 'primary',
  isLoading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  // Tailwind v4's preflight leaves buttons on `cursor: default`, so the pointer
  // is opted back in here. Transitions are limited to compositor-friendly
  // properties instead of `all`, which would also animate layout on hover.
  const baseStyles = 'inline-flex cursor-pointer items-center justify-center gap-2 font-semibold rounded-lg transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  // Padding based on Design System: space-3 (12px) space-6 (24px)
  const sizes = 'px-6 py-3';

  const variants = {
    primary: 'bg-accent-600 text-white hover:bg-accent-700 hover:shadow-md active:bg-accent-800 focus:ring-accent-500 disabled:bg-primary-300 disabled:text-primary-400 disabled:hover:shadow-none',
    secondary: 'bg-transparent border border-accent-600 text-accent-600 hover:bg-accent-50 hover:border-accent-700 active:bg-accent-100 focus:ring-accent-500',
    tertiary: 'bg-transparent text-primary-600 hover:text-primary-900 focus:ring-primary-500',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizes} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!isLoading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
