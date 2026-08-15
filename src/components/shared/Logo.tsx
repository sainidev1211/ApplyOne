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
  iconSize = 'h-8 w-8',
  textClass = 'text-xl',
}: LogoProps) {
  const logoIcon = (
    <svg
      className={`${iconSize} flex-shrink-0`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="applyone-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" /> {/* Royal Blue */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Violet/Purple */}
        </linearGradient>
      </defs>
      
      {/* Main Stylized A Ribbon */}
      <path
        d="M20 78L45 28C47 24 53 24 55 28L80 78C82 82 78 86 73 84L60 78L52 62"
        stroke="url(#applyone-logo-grad)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Swoosh cutting through the A */}
      <path
        d="M26 80C42 70 65 52 82 34"
        stroke="url(#applyone-logo-grad)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Sparkle Star at top-right */}
      <path
        d="M84 25C84.5 21 86 19.5 90 19C86 18.5 84.5 17 84 13C83.5 17 82 18.5 78 19C82 19.5 83.5 21 84 25Z"
        fill="url(#applyone-logo-grad)"
      />
    </svg>
  );

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoIcon}
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
