import React from 'react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, id, disabled, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'flex w-full h-10 px-3 py-2 text-sm bg-white dark:bg-card-dark border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:opacity-50 disabled:bg-bg-alt-light dark:disabled:bg-bg-alt-dark disabled:pointer-events-none appearance-none',
              error
                ? 'border-red-500 focus-visible:ring-red-500 text-red-900 dark:text-red-200'
                : 'border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark focus-visible:ring-primary',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary-light dark:text-text-secondary-dark">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
