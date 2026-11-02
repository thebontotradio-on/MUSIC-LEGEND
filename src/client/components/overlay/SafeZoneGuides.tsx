import React from 'react';
import { SafeZoneConfig } from '../../../server/types.js';

interface SafeZoneGuidesProps {
  safeZone: SafeZoneConfig;
  showGuides: boolean;
}

export const SafeZoneGuides: React.FC<SafeZoneGuidesProps> = ({ safeZone, showGuides }) => {
  if (!showGuides) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Safe Zone outline (Green dashed border as in TikTok LIVE guideline) */}
      <div
        className="absolute border-2 border-emerald-400/80 border-dashed bg-emerald-500/5 transition-all duration-300"
        style={{
          left: `${safeZone.x}%`,
          top: `${safeZone.y}%`,
          width: `${safeZone.width}%`,
          height: `${safeZone.height}%`,
          margin: `${safeZone.margin}px`
        }}
      >
        <div className="absolute -top-7 left-2 px-3 py-0.5 rounded bg-emerald-500 text-black text-[18px] font-black uppercase tracking-wider">
          SAFE ZONE GAME ({safeZone.width}% x {safeZone.height}%)
        </div>
      </div>

      {/* Chat Exclusion Zone at bottom (Red outline indicator) */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t-2 border-rose-500/60 border-dashed bg-rose-500/10 flex items-center justify-center transition-all duration-300"
        style={{ height: `${safeZone.chatExclusionHeight}%` }}
      >
        <div className="px-4 py-1.5 rounded-full bg-rose-600/90 text-white text-[20px] font-bold shadow-lg">
          🚫 ZONA CHAT TIKTOK (BEBAS DARI ELEMEN GAME)
        </div>
      </div>
    </div>
  );
};

