import React from 'react';
import { Player } from '../../../server/types.js';

interface StageChampionProps {
  leaderboard: Player[];
}

export const StageChampion: React.FC<StageChampionProps> = ({ leaderboard }) => {
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="flex flex-col items-center justify-between px-6 py-6 w-full h-full select-none text-center">
      {/* Title Header */}
      <div className="mb-2">
        <div className="inline-flex items-center gap-2 px-6 py-1.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700] text-[#FFD700] text-[24px] font-black uppercase tracking-widest mb-2 shadow-[0_0_15px_rgba(255,215,0,0.4)]">
          👑 FINAL SHOW — THE BONTOT RADIO
        </div>
        <h1 className="text-[52px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFFFFF] to-[#FFA500] drop-shadow-[0_4px_12px_rgba(255,215,0,0.5)]">
          PANGGUNG JUARA
        </h1>
      </div>

      {/* Podium Cards Layout (Top 3) */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[940px] items-end mb-4">
        {/* 2nd Place (Silver) */}
        <div className="glass-panel rounded-3xl p-4 border border-gray-400 flex flex-col items-center shadow-lg">
          <div className="w-9 h-9 rounded-full bg-gray-400 text-black font-black text-[22px] flex items-center justify-center mb-2">
            2
          </div>
          <div className="w-[84px] h-[84px] rounded-full border-2 border-gray-300 overflow-hidden mb-2 bg-black/40">
            {top2?.avatarUrl ? (
              <img src={top2.avatarUrl} alt={top2.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[36px]">🥈</div>
            )}
          </div>
          <h3 className="text-[26px] font-bold text-white truncate max-w-[220px]">
            {top2?.nickname || '---'}
          </h3>
          <div className="text-[32px] font-black text-gray-200 font-mono mt-1">
            {top2?.totalVP || 0} VP
          </div>
          <div className="text-[20px] text-gray-400 mt-1">
            Quiz: {top2?.quizPoints || 0} | Tap2: {top2?.tap2Points || 0}
          </div>
        </div>

        {/* 1st Place (Gold, Highest) */}
        <div className="glass-panel-gold rounded-3xl p-5 border-2 border-[#FFD700] flex flex-col items-center shadow-2xl relative -translate-y-4">
          <div className="absolute -top-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full px-4 py-1 text-black font-black text-[24px] flex items-center gap-1 shadow-md">
            👑 JUARA 1
          </div>
          <div className="w-[110px] h-[110px] rounded-full border-4 border-[#FFD700] overflow-hidden mb-3 mt-3 shadow-[0_0_25px_rgba(255,215,0,0.6)]">
            {top1?.avatarUrl ? (
              <img src={top1.avatarUrl} alt={top1.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[48px]">👑</div>
            )}
          </div>
          <h2 className="text-[34px] font-black text-[#FFD700] truncate max-w-[260px] tracking-tight">
            {top1?.nickname || '---'}
          </h2>
          <div className="text-[44px] font-black text-white font-mono mt-1 drop-shadow-md">
            {top1?.totalVP || 0} VP
          </div>
          <div className="text-[22px] font-bold text-amber-200 mt-1">
            Quiz: {top1?.quizPoints || 0} | Tap2: {top1?.tap2Points || 0}
          </div>
        </div>

        {/* 3rd Place (Bronze) */}
        <div className="glass-panel rounded-3xl p-4 border border-amber-700 flex flex-col items-center shadow-lg">
          <div className="w-9 h-9 rounded-full bg-amber-700 text-white font-black text-[22px] flex items-center justify-center mb-2">
            3
          </div>
          <div className="w-[84px] h-[84px] rounded-full border-2 border-amber-600 overflow-hidden mb-2 bg-black/40">
            {top3?.avatarUrl ? (
              <img src={top3.avatarUrl} alt={top3.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[36px]">🥉</div>
            )}
          </div>
          <h3 className="text-[26px] font-bold text-white truncate max-w-[220px]">
            {top3?.nickname || '---'}
          </h3>
          <div className="text-[32px] font-black text-amber-400 font-mono mt-1">
            {top3?.totalVP || 0} VP
          </div>
          <div className="text-[20px] text-gray-400 mt-1">
            Quiz: {top3?.quizPoints || 0} | Tap2: {top3?.tap2Points || 0}
          </div>
        </div>
      </div>

      {/* Summary Score Table (Top 5 transparent breakdown) */}
      <div className="glass-panel rounded-2xl p-4 max-w-[940px] w-full text-left">
        <div className="text-[22px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
          <span>Klasemen Akhir (Quiz + Tap2 VP)</span>
          <span className="text-[#00F0FF]">100 Tap2 = 1 VP</span>
        </div>
        <div className="space-y-1.5">
          {leaderboard.slice(0, 5).map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between px-4 py-2 rounded-xl text-[24px] font-bold ${
                idx === 0
                  ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30'
                  : 'bg-black/50 text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center font-mono">#{idx + 1}</span>
                <span className="truncate max-w-[320px]">{player.nickname}</span>
              </div>
              <div className="flex items-center gap-6 font-mono text-[22px]">
                <span className="text-gray-400">Quiz: {player.quizPoints}</span>
                <span className="text-pink-400">Tap2: {player.rawTap2} ({player.tap2Points} VP)</span>
                <span className="text-[#00F0FF] text-[26px] font-black font-mono">
                  {player.totalVP} VP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

