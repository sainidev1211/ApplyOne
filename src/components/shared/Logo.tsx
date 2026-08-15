import React from 'react';

interface LogoProps {
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  iconSize?: string;
  textClass?: string;
}

export function Logo({
  showText = true,
  showTagline = false,
  className = '',
  iconSize = 'h-9 w-9',
  textClass = 'text-xl',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="ApplyOne Logo"
        className={`${iconSize} object-contain rounded-lg flex-shrink-0`}
      />
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`${textClass} font-sans font-extrabold tracking-tight leading-none`}>
            <span className="text-slate-900 dark:text-white transition-colors duration-300">Apply</span>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">One</span>
          </div>
          {showTagline && (
            <span className="text-[7.5px] font-sans font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase mt-1 leading-none">
              One Apply. Endless Opportunities.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
