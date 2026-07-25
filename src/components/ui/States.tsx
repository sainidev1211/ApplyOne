import React from 'react';
import { Button } from './Button';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label = 'Loading...' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <div
        className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-transparent border-l-transparent ${sizes[size]}`}
        style={{ borderColor: 'var(--color-primary) transparent transparent transparent' }}
        role="status"
        aria-label={label}
      />
      {label && (
        <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl">
      {icon ? (
        <div className="mb-4 text-text-secondary-light dark:text-text-secondary-dark">{icon}</div>
      ) : (
        <svg
          className="mx-auto h-12 w-12 text-slate-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
      )}
      <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
        {title}
      </h3>
      <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} variant="outline" size="sm">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  retryText?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retryText = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
      <svg
        className="h-10 w-10 text-red-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-base font-semibold text-red-800 dark:text-red-300">{title}</h3>
      <p className="mt-1 text-sm text-red-600 dark:text-red-400 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300">
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
}

interface SuccessStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function SuccessState({ title, message, actionText, onAction }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl">
      <svg
        className="h-10 w-10 text-green-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-base font-semibold text-green-800 dark:text-green-300">{title}</h3>
      <p className="mt-1 text-sm text-green-600 dark:text-green-400 max-w-sm">{message}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-800 dark:text-green-300">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
