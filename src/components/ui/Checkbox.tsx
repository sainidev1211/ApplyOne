import React from 'react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, disabled, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start text-left">
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={cn(
              'h-4 w-4 rounded border border-border-light dark:border-border-dark text-primary focus:ring-primary focus:ring-offset-2 dark:bg-card-dark focus:ring-offset-bg-light dark:focus:ring-offset-bg-dark transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
              error && 'border-red-500 text-red-600 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label
              htmlFor={checkboxId}
              className={cn(
                'font-medium text-text-primary-light dark:text-text-primary-dark select-none cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </label>
            {error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
