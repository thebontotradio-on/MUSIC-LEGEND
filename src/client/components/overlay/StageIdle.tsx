import React from 'react';

export const StageIdle: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-10 w-full h-full select-none">
      {/* Badge TBR */}
      <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 mb-6 backdrop-blur-md">
        <span className="w-3.5 h-3.5 rounded-full bg-[#00F0FF] animate-ping" />
        <span className="text-[24px] font-bold tracking-widest text-[#00F0FF] uppercase">
          THE BONTOT RADIO • TIKTOK LIVE
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-[58px] font-black leading-tight tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#FFFFFF] to-[#8A2BE2] drop-shadow-[0_5px_15px_rgba(0,240,255,0.4)] mb-4">
        MUSIC LEGEND LIVE
      </h1>

      {/* Tagline */}
      <div className="text-[32px] font-extrabold tracking-[0.25em] text-[#FFD700] uppercase drop-shadow-[0_2px_8px_rgba(255,215,0,0.5)] mb-8">
        ONE LIVE. ONE CHAMPION.
      </div>

      {/* Guide Card for Bontoters */}
      <div className="glass-panel rounded-3xl p-6 max-w-[850px] w-full border border-white/10 shadow-2xl">
        <div className="text-[28px] font-bold text-[#c084fc] mb-3">
          🎵 CARA IKUTAN MAIN:
        </div>
        <div className="bg-[#0b0c16]/80 rounded-2xl p-4 border border-[#00F0FF]/30 mb-4 text-left">
          <p className="text-[24px] text-gray-300 font-medium mb-1">
            Ketik di komentar TikTok:
          </p>
          <p className="text-[36px] font-black text-[#00F0FF] tracking-wide font-mono">
            !jawab &lt;judul lagu&gt; &lt;penyanyi&gt;
          </p>
          <p className="text-[22px] text-gray-400 mt-1 italic">
            Contoh: <span className="text-white font-semibold">!jawab separuh aku noah</span>
          </p>
        </div>
        <div className="flex items-center justify-between text-[22px] text-gray-400 font-semibold px-2">
          <span>⚡ 1 Pemenang Tercepat Per Soal</span>
          <span>💖 100 Tap2 = 1 VP</span>
        </div>
      </div>
    </div>
  );
};

