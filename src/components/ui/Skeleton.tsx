import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rectangle', width, height, style, ...props }: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    width: width,
    height: height,
    ...style,
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-800',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'rectangle' && 'rounded-lg',
        className
      )}
      style={customStyle}
      {...props}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 w-full py-6">
      <Skeleton variant="text" width="60%" height="2rem" />
      <Skeleton variant="text" width="40%" height="1.25rem" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-border-light dark:border-border-dark rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangle" height={100} />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="rectangle" width={80} height={32} />
      </div>
    </div>
  );
}
