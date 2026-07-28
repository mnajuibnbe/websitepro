import type { InputHTMLAttributes, ReactNode } from 'react';

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
}

export function AuthField({ label, hint, error, leadingIcon, trailingAction, id, ...inputProps }: AuthFieldProps) {
  if (!id) throw new Error('AuthField requires a stable id');
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [inputProps['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      {label && <label htmlFor={id} className="mb-2 block text-sm font-bold text-primary-900">{label}</label>}
      <div className="relative">
        {leadingIcon && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-primary-400">{leadingIcon}</span>}
        <input
          {...inputProps}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`block w-full rounded-xl border bg-primary-50 py-3 text-primary-900 transition-colors placeholder:text-primary-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${leadingIcon ? 'pl-11' : 'pl-4'} ${trailingAction ? 'pr-12' : 'pr-4'} ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100' : 'border-primary-200 focus:border-accent-500 focus:ring-accent-500'}`}
        />
        {trailingAction && <span className="absolute inset-y-0 right-0 flex items-center">{trailingAction}</span>}
      </div>
      {hint && <p id={hintId} className="mt-2 text-xs text-primary-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-danger-600">{error}</p>}
    </div>
  );
}
