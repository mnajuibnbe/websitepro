import React, { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-primary-900">
            {label}
          </label>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : props['aria-describedby']}
          className={`
            px-4 py-3 bg-white border rounded-lg text-primary-900 placeholder:text-primary-400
            focus:outline-none focus:ring-2 transition-all duration-200
            disabled:bg-primary-50 disabled:text-primary-400 disabled:cursor-not-allowed
            ${error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100 text-danger-500'
              : 'border-primary-300 focus:border-accent-500 focus:ring-accent-200'
            }
            ${className}
          `}
        />
        {error && (
          <span id={errorId} role="alert" className="text-sm font-medium text-danger-500">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
