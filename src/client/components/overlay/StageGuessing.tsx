import React from 'react';
import { Question } from '../../../server/types.js';
import { TBRLogo } from '../common/TBRLogo.js';

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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
        <div className="w-12 h-12 rounded-full border-4 border-[#00F0FF] border-t-transparent animate-spin mb-4" />
        <span className="text-[28px] font-black tracking-widest text-[#00F0FF] uppercase">
          MENYIAPKAN SOAL BERIKUTNYA...
        </span>
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

  const difficultyBadges: Record<string, { label: string; class: string }> = {
    NORMAL: {
      label: 'NORMAL',
      class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    },
    HARD: {
      label: 'HARD',
      class: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
    },
    EXPERT: {
      label: 'EXPERT',
      class: 'bg-rose-500/20 text-rose-300 border-rose-500/50'
    },
    SPECIAL: {
      label: 'SPECIAL',
      class: 'bg-purple-500/20 text-purple-300 border-purple-500/50'
    }
  };

  const diffBadge = difficultyBadges[question.difficulty] || difficultyBadges.NORMAL;

  return (
    <div className="flex flex-col items-center justify-between px-6 py-4 w-full h-full select-none animate-stage-entrance">
      {/* 1. Header Bar: Official Brand, Round #, Category, Difficulty & Points */}
      <div className="flex items-center justify-between w-full max-w-[940px] mb-3">
        <div className="flex items-center gap-3">
          <TBRLogo size="md" variant="glow" />
          <div className="px-4 py-1.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/60 text-[#00F0FF] text-[22px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            ROUND #{roundNumber}
          </div>
          <div className="px-4 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-[20px] font-bold tracking-wide">
            {categoryLabels[question.category] || question.category}
          </div>
          <div className={`px-3 py-1 rounded-xl border text-[16px] font-black uppercase tracking-widest ${diffBadge.class}`}>
            {diffBadge.label}
          </div>
        </div>

        {/* Points Reward Badge */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-[#FFD166]/20 via-[#FFD166]/30 to-[#F59E0B]/20 border-2 border-[#FFD166] text-[#FFD166] shadow-[0_0_20px_rgba(255,209,102,0.35)]">
          <span className="text-[26px]">🏆</span>
          <span className="text-[34px] font-black tracking-tight font-tbr-mono">
            +{question.points} VP
          </span>
        </div>
      </div>

      {/* 2. Main Question Stage Card (The True Hero Element) */}
      <div className="glass-panel-question rounded-3xl p-8 max-w-[940px] w-full relative overflow-hidden flex flex-col justify-between my-auto">
        {/* Sleek top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00F0FF] via-[#8A2BE2] to-[#D946EF]" />

        {/* Question Header & Category Stamp */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-black tracking-widest text-[#00F0FF] uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
            PERTANYAAN RESMI MUSIC LEGEND
          </span>
          <span className="text-[13px] font-mono text-gray-400 uppercase tracking-widest">
            {question.releaseEra ? `Era ${question.releaseEra}` : 'The Bontot Radio'}
          </span>
        </div>

        {/* Prompt - Clear, High Contrast, Dominant Typography */}
        <h2 className="text-[44px] font-black text-[#F8FAFC] leading-[1.32] tracking-tight mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
          {question.prompt}
        </h2>

        {/* Multiple Choice Grid if applicable */}
        {question.options && question.options.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((opt, idx) => (
              <div
                key={idx}
                className="bg-[#05070D]/80 border border-white/20 rounded-2xl px-5 py-3 text-[26px] font-bold text-gray-100 flex items-center shadow-inner"
              >
                <span className="w-9 h-9 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] font-black flex items-center justify-center mr-3 font-mono text-[22px] border border-[#00F0FF]/40">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="truncate">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Supporting Hint Box (Separated and Elegant) */}
        {question.hint && (
          <div className="bg-[#0B1020]/90 border border-[#8A2BE2]/40 rounded-2xl p-4 flex items-start gap-4 shadow-inner">
            <span className="text-[28px] mt-0.5">💡</span>
            <div>
              <span className="text-[14px] font-black text-[#D946EF] uppercase tracking-widest block mb-0.5">
                KATA KUNCI / PETUNJUK:
              </span>
              <p className="text-[28px] font-medium text-slate-200 leading-snug italic">
                "{question.hint}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Streamlined Bottom Answer Instruction Bar */}
      <div className="w-full max-w-[940px] bg-[#0B1020]/90 border border-white/15 rounded-2xl px-6 py-3.5 flex items-center justify-between backdrop-blur-md mt-3 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-[26px]">💬</span>
          <span className="text-[22px] font-medium text-gray-300">
            Ketik di komentar:
          </span>
          <span className="text-[28px] font-black text-[#00F0FF] font-tbr-mono tracking-wide px-3 py-0.5 rounded-lg bg-black/50 border border-[#00F0FF]/30">
            !jawab &lt;judul&gt; &lt;penyanyi&gt;
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/50 text-[#FFD166] text-[18px] font-black tracking-wider">
            ⚡ +50 VP TERCEPAT
          </span>
        </div>
      </div>
    </div>
  );
};
