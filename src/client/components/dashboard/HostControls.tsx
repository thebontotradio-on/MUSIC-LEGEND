import React from 'react';
import { GameState } from '../../../server/types.js';
import { Play, Pause, SkipForward, HelpCircle, Award, Trophy, Square, Star } from 'lucide-react';

interface HostControlsProps {
  gameState: GameState;
  onAction: (action: string, payload?: any) => void;
}

export const HostControls: React.FC<HostControlsProps> = ({ gameState, onAction }) => {
  const isSessionActive = gameState.sessionState === 'ACTIVE';
  const isPaused = gameState.sessionState === 'PAUSED';
  const isGuessing = gameState.stage === 'GUESSING';
  const isWinner = gameState.stage === 'WINNER';

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          🎮 KENDALI HOST (THE BONTOT RADIO)
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSessionActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isPaused
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-gray-700/50 text-gray-400'
            }`}
          >
            STATUS: {gameState.sessionState} ({gameState.stage})
          </span>
          {gameState.sessionId && (
            <span className="text-xs font-mono text-gray-400">
              {gameState.sessionId.slice(-8)}
            </span>
          )}
        </div>
      </div>

      {/* Grid of Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* START GAME */}
        <button
          onClick={() => onAction('start-game')}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition shadow-md active:scale-95"
        >
          <Play className="w-5 h-5" />
          START GAME
        </button>

        {/* START ROUND */}
        <button
          onClick={() => onAction('start-round')}
          disabled={isGuessing}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition shadow-md ${
            isGuessing
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
          }`}
        >
          <Play className="w-5 h-5" />
          START ROUND
        </button>

        {/* BONUS ROUND */}
        <button
          onClick={() => onAction('start-bonus')}
          disabled={isGuessing}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition shadow-md ${
            isGuessing
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
          }`}
        >
          <Star className="w-5 h-5" />
          BONUS ROUND
        </button>

        {/* NEXT (Host Manual Control) */}
        <button
          onClick={() => onAction('next')}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-black transition shadow-lg active:scale-95"
        >
          <SkipForward className="w-5 h-5" />
          NEXT SOAL
        </button>

        {/* REVEAL ANSWER */}
        <button
          onClick={() => onAction('reveal')}
          disabled={!isGuessing || gameState.isQuestionLocked}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition shadow-md ${
            !isGuessing || gameState.isQuestionLocked
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          REVEAL JAWABAN
        </button>

        {/* SKIP ROUND */}
        <button
          onClick={() => onAction('skip')}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition shadow-md active:scale-95"
        >
          <SkipForward className="w-5 h-5" />
          SKIP ROUND
        </button>

        {/* PAUSE / RESUME */}
        {isPaused ? (
          <button
            onClick={() => onAction('resume')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-md active:scale-95"
          >
            <Play className="w-5 h-5" />
            RESUME LIVE
          </button>
        ) : (
          <button
            onClick={() => onAction('pause')}
            disabled={!isSessionActive}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition shadow-md ${
              !isSessionActive
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-amber-700 hover:bg-amber-600 text-white active:scale-95'
            }`}
          >
            <Pause className="w-5 h-5" />
            PAUSE LIVE
          </button>
        )}

        {/* FINAL SHOW */}
        <button
          onClick={() => onAction('final-show')}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black transition shadow-lg active:scale-95"
        >
          <Trophy className="w-5 h-5" />
          FINAL SHOW
        </button>
      </div>

      {/* Host Notice & End Session */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-white/10 text-xs text-gray-400">
        <p className="italic">
          💡 <strong className="text-gray-300">Aturan Host:</strong> Pergantian soal tidak otomatis. Host bebas mengobrol dan menekan NEXT ketika siap. Backsound auto-pause saat ada pemenang dan auto-resume saat NEXT ditekan.
        </p>

        <button
          onClick={() => {
            if (confirm('Yakin ingin mengakhiri sesi LIVE ini dan menyimpannya ke arsip?')) {
              onAction('end-session');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-semibold transition shrink-0"
        >
          <Square className="w-4 h-4" />
          END SESSION & ARSIP
        </button>
      </div>
    </div>
  );
};

