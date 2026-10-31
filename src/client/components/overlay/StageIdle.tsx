import React from 'react';
import { TBRLogo } from '../common/TBRLogo.js';

export const StageIdle: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-10 w-full h-full select-none">
      {/* Official TBR Logo & Pill Badge */}
      <div className="flex flex-col items-center mb-4">
        <TBRLogo size="xl" variant="glow" className="mb-4 hover:scale-105 transition-transform" />
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/15 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.3)]">
          <span className="w-3.5 h-3.5 rounded-full bg-[#00F0FF] animate-ping" />
          <span className="text-[22px] font-black tracking-widest text-[#00F0FF] uppercase">
            THE BONTOT RADIO • TIKTOK LIVE
          </span>
        </div>
      </div>

      {/* Main Game Show Title */}
      <h1 className="text-[56px] font-black leading-tight tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#FFFFFF] to-[#8A2BE2] drop-shadow-[0_5px_20px_rgba(0,240,255,0.5)] mb-3">
        MUSIC LEGEND LIVE
      </h1>

      {/* Tagline */}
      <div className="text-[30px] font-black tracking-[0.25em] text-[#FFD166] uppercase drop-shadow-[0_2px_10px_rgba(255,209,102,0.6)] mb-8">
        ONE LIVE. ONE CHAMPION.
      </div>

      {/* Guide Card for Bontoters */}
      <div className="glass-panel rounded-3xl p-7 max-w-[850px] w-full border border-white/10 shadow-2xl">
        <div className="text-[26px] font-bold text-[#D946EF] mb-3 flex items-center justify-center gap-2">
          <span>🎵</span> CARA IKUTAN MAIN:
        </div>
        <div className="bg-[#05070D]/90 rounded-2xl p-5 border border-[#00F0FF]/30 mb-5 text-left shadow-inner">
          <p className="text-[22px] text-gray-300 font-medium mb-1.5">
            Ketik di kolom chat TikTok:
          </p>
          <p className="text-[34px] font-black text-[#00F0FF] tracking-wide font-mono">
            !jawab &lt;judul lagu&gt; &lt;penyanyi&gt;
          </p>
          <p className="text-[20px] text-gray-400 mt-2 italic">
            Contoh: <span className="text-white font-semibold">!jawab separuh aku noah</span>
          </p>
        </div>
        <div className="flex items-center justify-between text-[20px] text-gray-300 font-semibold px-3">
          <span className="flex items-center gap-1.5">
            <span>⚡</span> 1 Pemenang Tercepat Per Soal
          </span>
          <span className="flex items-center gap-1.5">
            <span>💖</span> 100 Tap2 = 1 VP
          </span>
        </div>
      </div>
    </div>
  );
};
