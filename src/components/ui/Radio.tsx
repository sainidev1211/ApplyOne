import React from 'react';
import { cn } from '@/utils/cn';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  options: RadioOption[];
  error?: string;
  name: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, options, error, name, disabled, ...props }, ref) => {
    return (
      <div className="w-full text-left">
        {label && (
          <span className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            {label}
          </span>
        )}
        <div className="space-y-2">
          {options.map((opt) => {
            const radioId = `radio-${name}-${opt.value}`;
            return (
              <div key={opt.value} className="flex items-center">
                <input
                  id={radioId}
                  ref={ref}
                  type="radio"
                  name={name}
                  value={opt.value}
                  disabled={disabled}
                  className={cn(
                    'h-4 w-4 border-border-light dark:border-border-dark text-primary focus:ring-primary focus:ring-offset-2 dark:bg-card-dark focus:ring-offset-bg-light dark:focus:ring-offset-bg-dark cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
                    error && 'border-red-500 text-red-600 focus:ring-red-500',
                    className
                  )}
                  {...props}
                />
                <label
                  htmlFor={radioId}
                  className={cn(
                    'ml-3 text-sm font-medium text-text-primary-light dark:text-text-primary-dark cursor-pointer select-none',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {opt.label}
                </label>
              </div>
            );
          })}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
