import React, { useState } from 'react';
import { RoundResult } from '../../../server/types.js';
import { TBRLogo } from '../common/TBRLogo.js';

interface StageWinnerProps {
  round: RoundResult | null;
}

export const StageWinner: React.FC<StageWinnerProps> = ({ round }) => {
  const [imageError, setImageError] = useState(false);

  if (!round) return null;

  const winner = round.winner;
  const question = round.question;
  const nickname = winner?.player.nickname || 'Bontoters_Jawara';
  const initial = nickname.charAt(0).toUpperCase();

  // Multi-colored celebratory confetti particles
  const confettiColors = ['#00F0FF', '#FFD166', '#D946EF', '#8A2BE2', '#10B981', '#F59E0B'];
  const confettiPositions = [
    { left: '6%', delay: '0.1s', color: confettiColors[0], size: '14px' },
    { left: '16%', delay: '0.4s', color: confettiColors[1], size: '18px' },
    { left: '26%', delay: '0.2s', color: confettiColors[2], size: '12px' },
    { left: '38%', delay: '0.6s', color: confettiColors[3], size: '16px' },
    { left: '50%', delay: '0.1s', color: confettiColors[4], size: '14px' },
    { left: '62%', delay: '0.5s', color: confettiColors[1], size: '20px' },
    { left: '74%', delay: '0.3s', color: confettiColors[0], size: '15px' },
    { left: '84%', delay: '0.7s', color: confettiColors[2], size: '18px' },
    { left: '94%', delay: '0.2s', color: confettiColors[3], size: '14px' },
    { left: '12%', delay: '1.1s', color: confettiColors[5], size: '16px' },
    { left: '44%', delay: '1.3s', color: confettiColors[0], size: '14px' },
    { left: '80%', delay: '1.0s', color: confettiColors[1], size: '16px' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center px-6 py-6 w-full h-full select-none text-center overflow-hidden">
      {/* 1. Cinematic Volumetric Spotlight Beam */}
      <div className="absolute inset-0 cinematic-spotlight-cone pointer-events-none z-0" />

      {/* 2. Rotating Celebratory Light Rays */}
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 animate-ray-burst opacity-40 bg-[radial-gradient(circle,rgba(0,240,255,0.25)_0%,rgba(138,43,226,0.18)_40%,transparent_70%)]" />

      {/* 3. Confetti Particles Burst */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {confettiPositions.map((c, i) => (
          <div
            key={i}
            className="confetti-piece rounded-sm shadow-md"
            style={{
              left: c.left,
              animationDelay: c.delay,
              backgroundColor: c.color,
              width: c.size,
              height: c.size
            }}
          />
        ))}
      </div>

      {/* 4. Top Celebration Banner with Official TBR Logo */}
      <div className="relative z-20 inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-[#FFD166]/25 via-amber-400/35 to-[#FFD166]/25 border-2 border-[#FFD166] mb-5 shadow-[0_0_35px_rgba(255,209,102,0.5)] animate-pulse-glow">
        <TBRLogo size="sm" variant="gold" />
        <span className="text-[28px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-[#FFD166] to-amber-300 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          WINNER SPOTLIGHT • ROUND #{round.roundNumber}
        </span>
        <span className="text-[28px] animate-bounce">👑</span>
      </div>

      {/* 5. 3D Holographic Winner Showcase Card */}
      <div className="relative z-20 glass-panel-winner rounded-3xl p-8 max-w-[920px] w-full flex flex-col items-center animate-winner-entrance">
        {/* Holographic 3D Avatar Frame (200x200 px) */}
        <div className="relative mb-5">
          {/* Outer Rotating Glowing Neon Ring */}
          <div className="absolute -inset-4 rounded-full holo-ring-outer opacity-85 pointer-events-none border-4 border-dashed border-[#00F0FF] shadow-[0_0_25px_#00F0FF]" />
          
          {/* Inner Rotating Gold Glow Ring */}
          <div className="absolute -inset-2 rounded-full holo-ring-inner opacity-75 pointer-events-none border-2 border-dotted border-[#FFD166] shadow-[0_0_20px_#FFD166]" />

          {/* Large Profile Photo Container (200x200 px) */}
          <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-[#FFD166] shadow-[0_0_40px_rgba(255,209,102,0.7)] bg-[#05070D] flex items-center justify-center">
            {winner?.player.avatarUrl && !imageError ? (
              <img
                src={winner.player.avatarUrl}
                alt={nickname}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1020] via-[#151D36] to-amber-950 text-[#FFD166]">
                <span className="text-[72px] font-black drop-shadow-md">{initial}</span>
                <span className="text-[14px] font-bold uppercase tracking-widest text-[#FFD166]/80">CHAMP</span>
              </div>
            )}
          </div>

          {/* Floating Royal Crown Badge */}
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-[#FFD166] via-yellow-300 to-amber-500 rounded-full w-14 h-14 flex items-center justify-center border-2 border-white shadow-[0_0_20px_rgba(255,209,102,0.9)] text-[28px]">
            👑
          </div>
        </div>

        {/* Winner Nickname (Prominent headline, full display without clipping) */}
        <h2 className="text-[46px] font-black text-white tracking-tight leading-tight mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-full break-words px-4 text-center">
          {nickname}
        </h2>

        {/* Points Awarded Badge (+VP) with Animated Pop & Glow */}
        <div className="inline-flex items-center gap-3 px-8 py-2.5 rounded-2xl bg-gradient-to-r from-[#00F0FF]/25 via-blue-600/30 to-[#8A2BE2]/25 border-2 border-[#00F0FF] text-[#00F0FF] mb-3 shadow-[0_0_30px_rgba(0,240,255,0.4)] animate-point-pop">
          <span className="text-[32px]">⚡</span>
          <span className="text-[46px] font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,240,255,0.8)]">
            +{winner?.pointsAwarded || 150} VP
          </span>
        </div>

        {/* Breakdown Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <span className="px-3.5 py-1 rounded-xl bg-black/50 border border-white/10 text-gray-300 text-[18px] font-mono">
            Base: +{winner?.breakdown.base || 100} VP
          </span>
          {Boolean(winner?.breakdown.speedBonus) && (
            <span className="px-3.5 py-1 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[18px] font-bold">
              ⚡ Tercepat: +{winner.breakdown.speedBonus} VP
            </span>
          )}
          {Boolean(winner?.breakdown.streakBonus) && (
            <span className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#8A2BE2] to-[#D946EF] text-white text-[18px] font-extrabold shadow-md animate-pulse">
              🔥 Streak 3x: +{winner.breakdown.streakBonus} VP
            </span>
          )}
          {Boolean(winner?.breakdown.specialBonus) && (
            <span className="px-3.5 py-1 rounded-xl bg-[#FFD166]/20 border border-[#FFD166]/50 text-[#FFD166] text-[18px] font-black">
              ★ Special: +{winner.breakdown.specialBonus} VP
            </span>
          )}
        </div>

        {/* Revealed Answer Card (High Contrast Cyan & Gold for Maximum Mobile Readability) */}
        <div className="w-full bg-[#05070D]/95 rounded-2xl p-6 border-2 border-[#00F0FF]/40 text-left shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[20px] font-black text-[#00F0FF] uppercase tracking-widest flex items-center gap-2">
              <span>🎵</span> JAWABAN BENAR
            </span>
            <span className="text-[18px] font-bold text-gray-300 bg-white/10 px-3.5 py-1 rounded-lg border border-white/10">
              {question.category.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-[38px] font-black leading-snug tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <span className="text-[#00F0FF] drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">{question.expectedTitle}</span>
            <span className="text-gray-400 mx-3">—</span>
            <span className="text-[#FFD166] drop-shadow-[0_0_12px_rgba(255,209,102,0.4)]">{question.expectedArtist}</span>
          </p>

          {winner?.rawComment && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-gray-300 text-[20px]">
              <span className="text-emerald-400 font-bold">⚡ Jawaban Masuk:</span>
              <span className="italic text-gray-200 truncate">"{winner.rawComment}"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
