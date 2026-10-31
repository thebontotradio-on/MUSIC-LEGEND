import React, { useState } from 'react';
import { RoundResult } from '../../../server/types.js';

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

  // Multi-colored confetti flakes for festive celebration
  const confettiColors = ['#00F2FE', '#FFD700', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'];
  const confettiPositions = [
    { left: '8%', delay: '0.1s', color: confettiColors[0], size: '14px' },
    { left: '18%', delay: '0.4s', color: confettiColors[1], size: '18px' },
    { left: '26%', delay: '0.2s', color: confettiColors[2], size: '12px' },
    { left: '38%', delay: '0.6s', color: confettiColors[3], size: '16px' },
    { left: '50%', delay: '0.1s', color: confettiColors[4], size: '14px' },
    { left: '62%', delay: '0.5s', color: confettiColors[1], size: '20px' },
    { left: '72%', delay: '0.3s', color: confettiColors[0], size: '15px' },
    { left: '84%', delay: '0.7s', color: confettiColors[2], size: '18px' },
    { left: '92%', delay: '0.2s', color: confettiColors[3], size: '14px' },
    { left: '12%', delay: '1.1s', color: confettiColors[5], size: '16px' },
    { left: '44%', delay: '1.3s', color: confettiColors[0], size: '14px' },
    { left: '78%', delay: '1.0s', color: confettiColors[1], size: '16px' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center px-6 py-6 w-full h-full select-none text-center overflow-hidden">
      {/* 1. Cinematic Volumetric Spotlight Beam */}
      <div className="absolute inset-0 cinematic-spotlight-cone pointer-events-none z-0" />

      {/* 2. Rotating Celebratory Light Rays */}
      <div className="absolute w-[800px] h-[800px] rounded-full pointer-events-none z-0 animate-ray-burst opacity-40 bg-[radial-gradient(circle,rgba(0,242,254,0.25)_0%,rgba(138,43,226,0.15)_40%,transparent_70%)]" />

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

      {/* 4. Top Celebration Banner */}
      <div className="relative z-20 inline-flex items-center gap-3 px-8 py-3 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 border-2 border-amber-400 mb-6 shadow-[0_0_35px_rgba(255,215,0,0.5)] animate-pulse-glow">
        <span className="text-[34px] animate-bounce">👑</span>
        <span className="text-[32px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          WINNER SPOTLIGHT • ROUND #{round.roundNumber}
        </span>
        <span className="text-[34px] animate-bounce">👑</span>
      </div>

      {/* 5. 3D Holographic Winner Showcase Card */}
      <div className="relative z-20 glass-panel-gold-3d rounded-3xl p-8 max-w-[920px] w-full border-2 border-amber-400/80 shadow-[0_25px_65px_rgba(0,0,0,0.95)] flex flex-col items-center animate-winner-entrance">
        {/* Holographic 3D Avatar Frame */}
        <div className="relative mb-6">
          {/* Outer Rotating Glowing Neon Ring */}
          <div className="absolute -inset-4 rounded-full holo-ring-outer opacity-85 pointer-events-none border-4 border-dashed border-[#00F2FE] shadow-[0_0_25px_#00F2FE]" />
          
          {/* Inner Rotating Violet/Gold Glow Ring */}
          <div className="absolute -inset-2 rounded-full holo-ring-inner opacity-75 pointer-events-none border-2 border-dotted border-amber-300 shadow-[0_0_20px_#F59E0B]" />

          {/* Large Profile Photo Container (180x180 px) */}
          <div className="relative w-[180px] h-[180px] rounded-full overflow-hidden border-4 border-amber-300 shadow-[0_0_40px_rgba(255,215,0,0.7)] bg-[#070B19] flex items-center justify-center">
            {winner?.player.avatarUrl && !imageError ? (
              <img
                src={winner.player.avatarUrl}
                alt={nickname}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-950 text-amber-300">
                <span className="text-[64px] font-black drop-shadow-md">{initial}</span>
                <span className="text-[14px] font-bold uppercase tracking-widest text-amber-400/80">CHAMP</span>
              </div>
            )}
          </div>

          {/* Floating Royal Crown Badge */}
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full w-12 h-12 flex items-center justify-center border-2 border-white shadow-[0_0_15px_rgba(255,215,0,0.8)] text-[26px]">
            👑
          </div>
        </div>

        {/* Winner Nickname (Clear & Prominent 48px) */}
        <h2 className="text-[48px] font-black text-white tracking-tight leading-tight mb-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
          {nickname}
        </h2>

        {/* Points Awarded Badge (+VP) with Animated Pop & Glow */}
        <div className="inline-flex items-center gap-3 px-8 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/25 via-blue-600/30 to-purple-600/25 border-2 border-[#00F2FE] text-[#00F2FE] mb-6 shadow-[0_0_25px_rgba(0,242,254,0.4)] animate-point-pop">
          <span className="text-[32px]">⚡</span>
          <span className="text-[44px] font-black font-mono tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,242,254,0.8)]">
            +{winner?.pointsAwarded || 150} VP
          </span>
          {winner?.breakdown.streakBonus ? (
            <span className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[22px] font-extrabold ml-2 shadow-md animate-pulse">
              🔥 3x STREAK BONUS!
            </span>
          ) : null}
        </div>

        {/* Revealed Answer Card (High Contrast for Mobile Readability) */}
        <div className="w-full bg-[#070B19]/95 rounded-2xl p-6 border-2 border-cyan-400/40 text-left shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[20px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <span>🎵</span> JAWABAN BENAR
            </span>
            <span className="text-[18px] font-bold text-gray-400 bg-white/10 px-3 py-1 rounded-lg">
              {question.category.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-[40px] font-black text-white leading-snug tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            <span className="text-[#00F2FE]">{question.expectedTitle}</span>
            <span className="text-gray-400 mx-3">—</span>
            <span className="text-amber-300">{question.expectedArtist}</span>
          </p>

          {winner?.rawComment && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-gray-300 text-[22px]">
              <span className="text-emerald-400 font-bold">⚡ Tercepat:</span>
              <span className="italic text-gray-200 truncate">"{winner.rawComment}"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
