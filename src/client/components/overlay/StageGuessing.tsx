import React from 'react';
import { Question } from '../../../server/types.js';

interface StageGuessingProps {
  roundNumber: number;
  question: Question | null;
  isLocked: boolean;
}

export const StageGuessing: React.FC<StageGuessingProps> = ({
  roundNumber,
  question,
  isLocked
}) => {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full text-[34px] font-bold text-gray-400">
        Menyiapkan Soal Berikutnya...
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    TEBAK_JUDUL: '🎯 TEBAK JUDUL LAGU',
    TEBAK_PENYANYI: '🎤 TEBAK PENYANYI / BAND',
    TEKA_TEKI: '🧩 TEKA-TEKI MUSIK',
    TRIVIA: '📚 TRIVIA MUSIK',
    TEBAK_ERA: '⏳ TEBAK ERA / TAHUN',
    EMOJI_PUZZLE: '🧩 PUZZLE EMOJI',
    NOSTALGIA_80S: '📻 NOSTALGIA 80-AN',
    NOSTALGIA_90S: '📼 NOSTALGIA 90-AN',
    NOSTALGIA_2000S: '💿 NOSTALGIA 2000-AN',
    PILIHAN_GANDA: '📝 PILIHAN GANDA',
    SPECIAL_CHALLENGE: '🔥 SPECIAL CHALLENGE',
    TEBAK_GENRE: '🎷 TEBAK GENRE MUSIK',
    TEBAK_SOUNDTRACK: '🎬 SOUNDTRACK FILM',
    TEBAK_INSTRUMEN: '🪕 INSTRUMEN MUSIK',
    TEBAK_PETUNJUK: '🔍 TEBAK DARI PETUNJUK',
    MUSIK_DAERAH: '🏝️ MUSIK DAERAH NUSANTARA'
  };

  const difficultyColors: Record<string, string> = {
    NORMAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    HARD: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    EXPERT: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
    SPECIAL: 'bg-purple-500/20 text-purple-300 border-purple-500/50'
  };

  return (
    <div className="flex flex-col items-center justify-between px-6 py-6 w-full h-full select-none">
      {/* Header bar: Round badge, category, and points */}
      <div className="flex items-center justify-between w-full max-w-[920px] mb-4">
        <div className="flex items-center gap-3">
          <div className="px-5 py-2 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/60 text-[#00F0FF] text-[26px] font-black uppercase tracking-wider">
            ROUND #{roundNumber}
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-white text-[24px] font-bold tracking-wide">
            {categoryLabels[question.category] || question.category}
          </div>
        </div>

        {/* Points Badge */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700] text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.3)]">
          <span className="text-[28px]">🏆</span>
          <span className="text-[38px] font-black tracking-tight font-mono">
            +{question.points} VP
          </span>
        </div>
      </div>

      {/* Main Question Card with High Contrast */}
      <div className="glass-panel rounded-3xl p-8 max-w-[920px] w-full border-2 border-[#00F0FF]/40 shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Glow indicator line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00F0FF] via-[#8A2BE2] to-[#FF007F]" />

        {/* Prompt */}
        <p className="text-[48px] font-black text-white leading-[1.3] tracking-tight mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {question.prompt}
        </p>

        {/* Multiple choice options if available */}
        {question.options && question.options.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((opt, idx) => (
              <div
                key={idx}
                className="bg-black/60 border border-white/20 rounded-2xl px-5 py-3 text-[28px] font-bold text-gray-200"
              >
                <span className="text-[#00F0FF] mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </div>
            ))}
          </div>
        )}

        {/* Hint Box */}
        {question.hint && (
          <div className="bg-[#101322]/90 border border-purple-500/40 rounded-2xl p-4 flex items-start gap-4">
            <span className="text-[32px]">💡</span>
            <div>
              <span className="text-[22px] font-bold text-purple-400 uppercase tracking-wider block">
                PETUNJUK:
              </span>
              <p className="text-[34px] font-semibold text-gray-200 leading-snug">
                {question.hint}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Answer Instruction Bar */}
      <div className="w-full max-w-[920px] bg-black/80 border border-white/15 rounded-2xl px-6 py-3.5 flex items-center justify-between backdrop-blur-md mt-4">
        <div className="flex items-center gap-3">
          <span className="text-[26px]">💬</span>
          <span className="text-[26px] font-medium text-gray-300">
            Jawab di komentar:
          </span>
          <span className="text-[30px] font-black text-[#00F0FF] font-mono tracking-wide">
            !jawab &lt;judul&gt; &lt;penyanyi&gt;
          </span>
        </div>
        <div className="text-[24px] font-bold text-[#FFD700]">
          +50 VP First Winner!
        </div>
      </div>
    </div>
  );
};

