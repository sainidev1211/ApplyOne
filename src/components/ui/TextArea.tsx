import React from 'react';
import { cn } from '@/utils/cn';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'flex w-full min-h-[80px] px-3 py-2 text-sm bg-white dark:bg-card-dark border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:opacity-50 disabled:bg-bg-alt-light dark:disabled:bg-bg-alt-dark disabled:pointer-events-none resize-y',
              error
                ? 'border-red-500 focus-visible:ring-red-500 text-red-900 dark:text-red-200'
                : 'border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark focus-visible:ring-primary',
              className
            )}
            {...props}
          />
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

TextArea.displayName = 'TextArea';
