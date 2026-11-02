import React from 'react';
import type { Player, ChampionRewardRecord } from '../../../server/types.js';
import { TBRLogo } from '../common/TBRLogo.js';

interface StageChampionProps {
  leaderboard: Player[];
  championRewards?: ChampionRewardRecord[];
}

export const StageChampion: React.FC<StageChampionProps> = ({ leaderboard, championRewards }) => {
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const getRewardStatus = (rank: 1 | 2 | 3) => {
    const reward = championRewards?.find((r) => r.rank === rank);
    if (!reward) return { isRedeemed: false, label: '★ 1 FREE REQUEST SONG' };
    return {
      isRedeemed: reward.status === 'REDEEMED',
      label: reward.status === 'REDEEMED' ? '✓ HADIAH DIGUNAKAN' : '★ 1 FREE REQUEST SONG'
    };
  };

  const rew1 = getRewardStatus(1);
  const rew2 = getRewardStatus(2);
  const rew3 = getRewardStatus(3);

  return (
    <div className="flex flex-col items-center justify-between px-6 py-5 w-full h-full select-none text-center">
      {/* Title Header with Official TBR Logo */}
      <div className="mb-2 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 mb-1.5">
          <TBRLogo size="md" variant="gold" />
          <div className="inline-flex items-center gap-2 px-6 py-1.5 rounded-full bg-[#FFD166]/20 border border-[#FFD166] text-[#FFD166] text-[22px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,209,102,0.4)]">
            👑 THE BONTOT RADIO • FINAL SHOW
          </div>
        </div>
        <h1 className="text-[48px] font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FFD166] via-[#FFFFFF] to-[#FFA500] drop-shadow-[0_4px_16px_rgba(255,209,102,0.6)]">
          PANGGUNG JUARA TOP 3
        </h1>
      </div>

      {/* Podium Cards Layout (Top 3) */}
      <div className="grid grid-cols-3 gap-3.5 w-full max-w-[940px] items-end mb-2">
        {/* 2nd Place (Silver - Left) */}
        <div className="glass-panel-podium-silver rounded-3xl p-4 flex flex-col items-center shadow-lg relative min-h-[360px] justify-between">
          <div className="flex flex-col items-center w-full">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#C7D0DA] to-slate-400 text-black font-black text-[22px] flex items-center justify-center mb-2 shadow-[0_0_12px_rgba(199,208,218,0.5)] border border-white">
              2
            </div>
            {/* Avatar Circle (96px) */}
            <div className="w-[96px] h-[96px] rounded-full border-4 border-[#C7D0DA] overflow-hidden mb-2 bg-[#05070D] shadow-[0_0_20px_rgba(199,208,218,0.4)]">
              {top2?.avatarUrl ? (
                <img src={top2.avatarUrl} alt={top2.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[40px]">🥈</div>
              )}
            </div>
            {/* Username: Full wrap without clipping */}
            <h3 className="text-[22px] font-extrabold text-[#C7D0DA] leading-tight break-words w-full px-2 text-center drop-shadow-sm min-h-[50px] flex items-center justify-center">
              {top2?.nickname || '---'}
            </h3>
          </div>

          <div className="flex flex-col items-center w-full mt-2">
            <div className="text-[32px] font-black text-white font-mono drop-shadow-[0_2px_8px_rgba(199,208,218,0.5)]">
              {top2?.totalVP?.toLocaleString() || 0} VP
            </div>
            <div className="text-[15px] text-gray-300 font-mono mt-0.5">
              Quiz: {top2?.quizPoints || 0} | Tap2: {top2?.tap2Points || 0}
            </div>
            {/* Reward Badge */}
            <div className={`mt-2.5 px-3 py-1 rounded-full text-[13px] font-black border uppercase tracking-wider ${
              rew2.isRedeemed
                ? 'bg-gray-700/60 text-gray-300 border-gray-600'
                : 'bg-[#C7D0DA]/20 text-[#C7D0DA] border-[#C7D0DA] shadow-[0_0_12px_rgba(199,208,218,0.4)]'
            }`}>
              {rew2.label}
            </div>
          </div>
        </div>

        {/* 1st Place (Gold - Center, Elevated) */}
        <div className="glass-panel-podium-gold rounded-3xl p-5 flex flex-col items-center shadow-2xl relative -translate-y-5 min-h-[410px] justify-between z-10">
          <div className="flex flex-col items-center w-full">
            <div className="absolute -top-5 bg-gradient-to-r from-amber-400 via-[#FFD166] to-yellow-400 rounded-full px-5 py-1 text-black font-black text-[22px] flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,209,102,0.8)] border-2 border-white">
              👑 JUARA 1
            </div>
            {/* Avatar Circle (116px) */}
            <div className="w-[116px] h-[116px] rounded-full border-4 border-[#FFD166] overflow-hidden mb-2 mt-4 bg-[#05070D] shadow-[0_0_35px_rgba(255,209,102,0.7)]">
              {top1?.avatarUrl ? (
                <img src={top1.avatarUrl} alt={top1.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[52px]">👑</div>
              )}
            </div>
            {/* Username: Full wrap without clipping */}
            <h2 className="text-[28px] font-black text-[#FFD166] leading-tight break-words w-full px-2 text-center tracking-tight drop-shadow-md min-h-[60px] flex items-center justify-center">
              {top1?.nickname || '---'}
            </h2>
          </div>

          <div className="flex flex-col items-center w-full mt-2">
            <div className="text-[44px] font-black text-white font-mono drop-shadow-[0_2px_12px_rgba(255,209,102,0.8)]">
              {top1?.totalVP?.toLocaleString() || 0} VP
            </div>
            <div className="text-[17px] font-bold text-amber-200 font-mono mt-0.5">
              Quiz: {top1?.quizPoints || 0} | Tap2: {top1?.tap2Points || 0}
            </div>
            {/* Reward Badge */}
            <div className={`mt-2.5 px-4 py-1.5 rounded-full text-[14px] font-black border uppercase tracking-wider ${
              rew1.isRedeemed
                ? 'bg-gray-700/60 text-gray-300 border-gray-600'
                : 'bg-[#FFD166]/25 text-[#FFD166] border-[#FFD166] shadow-[0_0_18px_rgba(255,209,102,0.6)] animate-pulse'
            }`}>
              {rew1.label}
            </div>
          </div>
        </div>

        {/* 3rd Place (Bronze - Right) */}
        <div className="glass-panel-podium-bronze rounded-3xl p-4 flex flex-col items-center shadow-lg relative min-h-[360px] justify-between">
          <div className="flex flex-col items-center w-full">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#CD7F32] to-amber-700 text-white font-black text-[22px] flex items-center justify-center mb-2 shadow-[0_0_12px_rgba(205,127,50,0.5)] border border-white">
              3
            </div>
            {/* Avatar Circle (96px) */}
            <div className="w-[96px] h-[96px] rounded-full border-4 border-[#CD7F32] overflow-hidden mb-2 bg-[#05070D] shadow-[0_0_20px_rgba(205,127,50,0.4)]">
              {top3?.avatarUrl ? (
                <img src={top3.avatarUrl} alt={top3.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[40px]">🥉</div>
              )}
            </div>
            {/* Username: Full wrap without clipping */}
            <h3 className="text-[22px] font-extrabold text-[#CD7F32] leading-tight break-words w-full px-2 text-center drop-shadow-sm min-h-[50px] flex items-center justify-center">
              {top3?.nickname || '---'}
            </h3>
          </div>

          <div className="flex flex-col items-center w-full mt-2">
            <div className="text-[32px] font-black text-amber-200 font-mono drop-shadow-[0_2px_8px_rgba(205,127,50,0.5)]">
              {top3?.totalVP?.toLocaleString() || 0} VP
            </div>
            <div className="text-[15px] text-gray-300 font-mono mt-0.5">
              Quiz: {top3?.quizPoints || 0} | Tap2: {top3?.tap2Points || 0}
            </div>
            {/* Reward Badge */}
            <div className={`mt-2.5 px-3 py-1 rounded-full text-[13px] font-black border uppercase tracking-wider ${
              rew3.isRedeemed
                ? 'bg-gray-700/60 text-gray-300 border-gray-600'
                : 'bg-[#CD7F32]/25 text-[#CD7F32] border-[#CD7F32] shadow-[0_0_12px_rgba(205,127,50,0.4)]'
            }`}>
              {rew3.label}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Reward Announcement Banner */}
      <div className="glass-panel rounded-2xl px-6 py-2.5 max-w-[940px] w-full text-center border-2 border-[#FFD166]/50 bg-[#05070D]/90 mb-2 shadow-[0_0_20px_rgba(255,209,102,0.2)]">
        <span className="text-[21px] font-black text-[#FFD166] uppercase tracking-wide">
          🎁 JUARA 1, 2, DAN 3 MASING-MASING MENDAPATKAN 1 FREE REQUEST SONG
        </span>
        <p className="text-[16px] text-gray-300 mt-0.5">
          Sampaikan lagu pilihanmu ke Host untuk diputar di THE BONTOT RADIO • (1 akun 1 lagu per sesi)
        </p>
      </div>

      {/* Summary Score Table (Top 5 Transparent Breakdown) */}
      <div className="glass-panel rounded-2xl p-3.5 max-w-[940px] w-full text-left">
        <div className="text-[18px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex justify-between">
          <span>Klasemen Akhir (Quiz + Tap2 VP)</span>
          <span className="text-[#00F0FF] font-mono">100 Tap2 = 1 VP</span>
        </div>
        <div className="space-y-1">
          {leaderboard.slice(0, 5).map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between px-3.5 py-1.5 rounded-xl text-[20px] font-bold ${
                idx === 0
                  ? 'bg-[#FFD166]/15 text-[#FFD166] border border-[#FFD166]/40'
                  : 'bg-black/50 text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-mono text-[18px]">#{idx + 1}</span>
                <span className="truncate max-w-[320px]">{player.nickname}</span>
              </div>
              <div className="flex items-center gap-5 font-mono text-[18px]">
                <span className="text-gray-400">Quiz: {player.quizPoints}</span>
                <span className="text-pink-400">Tap2: {player.rawTap2.toLocaleString()} ({player.tap2Points} VP)</span>
                <span className="text-[#00F0FF] text-[22px] font-black font-mono">
                  {player.totalVP.toLocaleString()} VP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
