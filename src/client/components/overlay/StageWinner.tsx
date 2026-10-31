import React from 'react';
import { RoundResult } from '../../../server/types.js';

interface StageWinnerProps {
  round: RoundResult | null;
}

export const StageWinner: React.FC<StageWinnerProps> = ({ round }) => {
  if (!round) return null;

  const winner = round.winner;
  const question = round.question;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 w-full h-full select-none text-center">
      {/* Celebration Banner */}
      <div className="inline-flex items-center gap-3 px-8 py-2.5 rounded-full bg-gradient-to-r from-[#FFD700]/30 via-[#FFA500]/30 to-[#FFD700]/30 border-2 border-[#FFD700] mb-6 shadow-[0_0_25px_rgba(255,215,0,0.5)] animate-pulse-glow">
        <span className="text-[32px]">🎉</span>
        <span className="text-[30px] font-black tracking-widest text-[#FFD700] uppercase">
          PEMENANG ROUND #{round.roundNumber}!
        </span>
        <span className="text-[32px]">🎉</span>
      </div>

      {/* Winner Spotlight Card */}
      <div className="glass-panel-gold rounded-3xl p-8 max-w-[880px] w-full shadow-[0_15px_45px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col items-center">
        {/* Profile Avatar */}
        <div className="relative mb-5">
          <div className="w-[140px] h-[140px] rounded-full border-4 border-[#FFD700] overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.6)] bg-black/50 flex items-center justify-center">
            {winner?.player.avatarUrl ? (
              <img
                src={winner.player.avatarUrl}
                alt={winner.player.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[64px]">👑</span>
            )}
          </div>
          {/* Winner Crown Badge */}
          <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full w-10 h-10 flex items-center justify-center border-2 border-white shadow-lg text-[22px]">
            👑
          </div>
        </div>

        {/* Winner Nickname (38-48px) */}
        <h2 className="text-[46px] font-black text-white tracking-tight leading-tight mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {winner?.player.nickname || 'Bontoter'}
        </h2>

        {/* Points Awarded Badge (36-44px) */}
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] mb-5">
          <span className="text-[30px]">⚡</span>
          <span className="text-[40px] font-black font-mono tracking-tight">
            +{winner?.pointsAwarded || 150} VP
          </span>
          {winner?.breakdown.streakBonus ? (
            <span className="px-3 py-1 rounded-xl bg-purple-600/80 text-white text-[22px] font-bold ml-2">
              🔥 3x Streak Bonus!
            </span>
          ) : null}
        </div>

        {/* Answer Revealed Card */}
        <div className="w-full bg-black/75 rounded-2xl p-5 border border-white/20 text-left">
          <span className="text-[22px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
            JAWABAN BENAR:
          </span>
          <p className="text-[38px] font-black text-[#00F0FF] leading-snug tracking-wide">
            {question.expectedTitle} — {question.expectedArtist}
          </p>
          {winner?.rawComment && (
            <p className="text-[22px] text-gray-400 mt-2 italic">
              Komentar tercepat: "{winner.rawComment}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

