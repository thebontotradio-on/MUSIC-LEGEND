import React, { useState } from 'react';
import { GameState } from '../../../server/types.js';
import { Send, Heart, User, CheckCircle2, AlertTriangle, Fingerprint, Zap } from 'lucide-react';

interface SimulatorPanelProps {
  gameState: GameState;
  onSimulateComment: (text: string, nickname?: string, userId?: string) => void;
  onSimulateLike: (count: number, nickname?: string, userId?: string, isCumulative?: boolean) => void;
}

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  gameState,
  onSimulateComment,
  onSimulateLike
}) => {
  const [commentText, setCommentText] = useState('!jawab separuh aku noah');
  const [nickname, setNickname] = useState('Bontoters_Jawara');
  const [userId, setUserId] = useState('user_jawara_01');
  const [customLikes, setCustomLikes] = useState(100);

  const currentQ = gameState.currentQuestion;

  const handleQuickAnswer = (variant: string) => {
    if (!currentQ) return;
    let text = '';
    if (variant === 'standard') {
      text = `!jawab ${currentQ.expectedTitle} ${currentQ.expectedArtist}`;
    } else if (variant === 'inverted') {
      text = `!jawab ${currentQ.expectedArtist} ${currentQ.expectedTitle}`;
    } else if (variant === 'typo') {
      const titleTypo = currentQ.expectedTitle.slice(0, -1) + 'a';
      text = `!jawab ${titleTypo} ${currentQ.expectedArtist}`;
    } else if (variant === 'wrong') {
      text = `!jawab Balonku Ada Lima Dangdut`;
    }
    onSimulateComment(text, nickname, userId);
  };

  // One-click combined test: Quiz answer + Tap2 100x from the same userId
  const handleCombinedScenario = () => {
    const answer = currentQ
      ? `!jawab ${currentQ.expectedTitle} ${currentQ.expectedArtist}`
      : '!jawab separuh aku noah';

    // 1. Send winning comment
    onSimulateComment(answer, nickname, userId);
    // 2. Send 100 Tap2
    setTimeout(() => {
      onSimulateLike(100, nickname, userId);
    }, 200);
  };

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          SIMULATOR TIKTOK (TEST & DEV MODE)
        </h3>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
          DEVELOPMENT MODE
        </span>
      </div>

      {/* Player Identity Input Bar (Ensuring single consistent identity) */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1 mb-1">
            <Fingerprint className="w-3.5 h-3.5 text-[#00F0FF]" />
            User ID (Primary Key Konsisten):
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. user_jawara_01"
            className="w-full bg-[#0b0c16] border border-[#00F0FF]/40 rounded-lg px-3 py-1.5 text-xs text-[#00F0FF] font-mono font-bold"
          />
        </div>

        <div className="flex-1 w-full">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1 mb-1">
            <User className="w-3.5 h-3.5 text-[#FFD700]" />
            Nickname (Nama Tampil di Layar):
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Bontoters_Jawara"
            className="w-full bg-[#0b0c16] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
          />
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-4">
          <button
            onClick={handleCombinedScenario}
            title="Kirim !jawab benar dan Tap2 100x dari userId yang sama untuk memverifikasi 1 baris leaderboard"
            className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Uji Gabungan: Jawaban + Tap2 (1 ID)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Comment Simulator */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4">
          <span className="text-xs font-bold text-[#00F0FF] uppercase block mb-2">
            💬 Simulasi Komentar !jawab
          </span>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="!jawab <judul> <penyanyi>"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <button
              onClick={() => onSimulateComment(commentText, nickname, userId)}
              className="px-3 py-1.5 bg-[#00F0FF] hover:bg-[#33f3ff] text-black text-xs font-black rounded-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick buttons based on active question */}
          {currentQ && (
            <div className="space-y-1.5 mt-3 pt-2 border-t border-white/10">
              <span className="text-[10px] text-gray-400 font-semibold block">
                Preset Cepat untuk Soal #{gameState.roundNumber}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleQuickAnswer('standard')}
                  className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-[11px] text-emerald-300 font-semibold transition"
                >
                  ✓ Judul + Artis
                </button>
                <button
                  onClick={() => handleQuickAnswer('inverted')}
                  className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/50 text-[11px] text-indigo-300 font-semibold transition"
                >
                  ✓ Artis + Judul
                </button>
                <button
                  onClick={() => handleQuickAnswer('typo')}
                  className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-[11px] text-amber-300 font-semibold transition"
                >
                  ~ Typo Ringan
                </button>
                <button
                  onClick={() => handleQuickAnswer('wrong')}
                  className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-[11px] text-rose-300 font-semibold transition"
                >
                  ✕ Jawaban Salah
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tap2 / Like Simulator */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4">
          <span className="text-xs font-bold text-pink-400 uppercase block mb-2">
            💖 Simulasi Tap2 (100 Tap2 = 1 VP)
          </span>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => onSimulateLike(100, nickname, userId)}
              className="flex-1 px-3 py-2 rounded-lg bg-pink-950/80 hover:bg-pink-900 border border-pink-500/50 text-xs font-bold text-pink-300 transition flex items-center justify-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500" />
              +100 Tap2 (1 VP)
            </button>
            <button
              onClick={() => onSimulateLike(500, nickname, userId)}
              className="flex-1 px-3 py-2 rounded-lg bg-pink-900 hover:bg-pink-800 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-pink-400" />
              +500 Tap2 (5 VP)
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={1}
              value={customLikes}
              onChange={(e) => setCustomLikes(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-24 bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <button
              onClick={() => onSimulateLike(customLikes, nickname, userId)}
              className="flex-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-white/10 rounded-lg transition"
            >
              Kirim Custom Tap2 (+{Math.floor(customLikes / 100)} VP)
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mt-2">
            Deduplikasi aktif per <code className="text-[#00F0FF] font-mono">{userId}</code>. Selisih like kumulatif dihitung otomatis.
          </p>
        </div>
      </div>
    </div>
  );
};
