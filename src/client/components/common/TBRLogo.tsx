import React, { useState } from 'react';

export const OFFICIAL_TBR_LOGO_CDN =
  'https://cdn.phototourl.com/member/2026-10-09-7c58114c-cd1c-40b7-bbc1-452abbad7a17.jpg';
export const OFFICIAL_TBR_LOGO_LOCAL = '/assets/tbr-logo.jpg';

interface TBRLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  imgClassName?: string;
  showText?: boolean;
  subText?: string;
  variant?: 'glow' | 'gold' | 'subtle' | 'plain';
}

export const TBRLogo: React.FC<TBRLogoProps> = ({
  size = 'md',
  className = '',
  imgClassName = '',
  showText = false,
  subText,
  variant = 'glow'
}) => {
  // Try local first, then fallback to official CDN URL, then fallback to SVG
  const [srcIndex, setSrcIndex] = useState<number>(0);
  const sources = [OFFICIAL_TBR_LOGO_LOCAL, OFFICIAL_TBR_LOGO_CDN];

  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6 min-w-[24px]',
    sm: 'w-8 h-8 min-w-[32px]',
    md: 'w-12 h-12 min-w-[48px]',
    lg: 'w-16 h-16 min-w-[64px]',
    xl: 'w-24 h-24 min-w-[96px]',
    '2xl': 'w-32 h-32 min-w-[128px]',
    custom: ''
  };

  const variantBorders: Record<string, string> = {
    glow: 'border border-[#00F0FF]/60 shadow-[0_0_15px_rgba(0,240,255,0.4)]',
    gold: 'border-2 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.6)]',
    subtle: 'border border-white/20 shadow-sm',
    plain: 'border-0 shadow-none'
  };

  const handleImageError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      // Mark as fully failed (render SVG fallback)
      setSrcIndex(sources.length);
    }
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentBorderClass = variantBorders[variant] || variantBorders.glow;

  const isFailed = srcIndex >= sources.length;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`relative ${currentSizeClass} aspect-square rounded-full overflow-hidden flex items-center justify-center bg-[#070B19] ${currentBorderClass} flex-shrink-0`}
      >
        {!isFailed ? (
          <img
            src={sources[srcIndex]}
            alt="THE BONTOT RADIO Official Logo"
            className={`w-full h-full object-cover transition-transform duration-300 ${imgClassName}`}
            onError={handleImageError}
            loading="eager"
          />
        ) : (
          // Graceful SVG fallback if both local and CDN fail
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#00F0FF]/20 via-[#121326] to-[#8A2BE2]/20 text-[#00F0FF]">
            <svg
              className="w-1/2 h-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span className="text-[8px] font-black tracking-tighter uppercase text-white mt-0.5">
              TBR
            </span>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-[20px] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#8A2BE2] uppercase leading-none">
            THE BONTOT RADIO
          </span>
          {subText ? (
            <span className="text-[12px] font-semibold text-gray-400 tracking-widest uppercase mt-0.5">
              {subText}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#00F0FF]/80 tracking-widest uppercase mt-0.5">
              OFFICIAL BROADCAST
            </span>
          )}
        </div>
      )}
    </div>
  );
};
