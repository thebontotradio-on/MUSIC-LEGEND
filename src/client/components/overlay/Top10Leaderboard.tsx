import React from 'react';
import type { Player } from '../../../server/types.js';
import { TBRLogo } from '../common/TBRLogo.js';

interface Top10LeaderboardProps {
  leaderboard: Player[];
  activeRound?: number;
}

export const Top10Leaderboard: React.FC<Top10LeaderboardProps> = ({
  leaderboard,
  activeRound
}) => {
  const top10 = leaderboard.slice(0, 10);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-[#FFD166] to-amber-500 text-black shadow-[0_0_15px_rgba(255,209,102,0.7)] border-[#FFD166]',
          icon: '👑',
          label: '1',
          nameColor: 'text-[#FFD166]',
          vpGradient: 'from-[#FFD166] to-yellow-200'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-[#C7D0DA] to-slate-400 text-black shadow-[0_0_12px_rgba(199,208,218,0.6)] border-[#C7D0DA]',
          icon: '🥈',
          label: '2',
          nameColor: 'text-[#C7D0DA]',
          vpGradient: 'from-[#C7D0DA] to-white'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-[#CD7F32] to-amber-700 text-white shadow-[0_0_12px_rgba(205,127,50,0.6)] border-[#CD7F32]',
          icon: '🥉',
          label: '3',
          nameColor: 'text-[#CD7F32]',
          vpGradient: 'from-[#CD7F32] to-amber-200'
        };
      default:
        return {
          bg: 'bg-[#0B1020] text-[#00F0FF] border-[#00F0FF]/30 shadow-sm',
          icon: null,
          label: String(rank),
          nameColor: 'text-white',
          vpGradient: 'from-[#00F0FF] to-white'
        };
    }
  };

  return (
    <div className="flex flex-col items-center justify-between px-6 py-5 w-full h-full select-none text-center">
      {/* Header Bar */}
      <div className="mb-2 w-full max-w-[940px]">
        <div className="flex items-center justify-center gap-3 mb-1.5">
          <TBRLogo size="md" variant="glow" />
          <div className="inline-flex items-center gap-2 px-5 py-1 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/60 text-[#00F0FF] text-[20px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
            KLASEMEN SEMENTARA • TOP 10
          </div>
        </div>
        <h1 className="text-[40px] font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#8A2BE2] drop-shadow-[0_4px_12px_rgba(0,240,255,0.5)]">
          MUSIC LEGEND LIVE
        </h1>
        <div className="flex items-center justify-center gap-3 text-[16px] text-gray-400 font-mono mt-0.5">
          {activeRound && activeRound > 0 ? (
            <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold">
              RONDE #{activeRound}
            </span>
          ) : null}
          <span>● REAL-TIME ENGINE VP</span>
          <span>•</span>
          <span>{leaderboard.length} Total Peserta</span>
        </div>
      </div>

      {/* Top 10 List Rows */}
      <div className="w-full max-w-[940px] space-y-1.5 flex-1 flex flex-col justify-start overflow-hidden my-1">
        {top10.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-gray-400 my-auto">
            <span className="text-[44px] mb-2">🎵</span>
            <p className="text-[26px] font-bold text-white mb-1.5">
              Belum Ada Skor di Sesi Ini
            </p>
            <p className="text-[19px] text-gray-400 max-w-lg">
              Ketik <span className="text-[#00F0FF] font-mono font-bold">!jawab &lt;judul&gt; &lt;penyanyi&gt;</span> di kolom chat TikTok atau Tap-Tap layar untuk meraih Viewer Points (VP)!
            </p>
          </div>
        ) : (
          top10.map((player, index) => {
            const rank = index + 1;
            const badge = getRankBadge(rank);
            const isTop3 = rank <= 3;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between px-4 py-2 rounded-2xl border transition-all duration-300 ${
                  isTop3
                    ? rank === 1
                      ? 'bg-gradient-to-r from-[#FFD166]/20 via-amber-500/10 to-[#05070D]/90 border-[#FFD166]/80 shadow-[0_0_15px_rgba(255,209,102,0.25)]'
                      : rank === 2
                      ? 'bg-gradient-to-r from-[#C7D0DA]/20 via-slate-400/10 to-[#05070D]/90 border-[#C7D0DA]/70 shadow-[0_0_10px_rgba(199,208,218,0.2)]'
                      : 'bg-gradient-to-r from-[#CD7F32]/20 via-amber-800/10 to-[#05070D]/90 border-[#CD7F32]/70 shadow-[0_0_10px_rgba(205,127,50,0.2)]'
                    : 'bg-[#0B1020]/90 border-white/10 hover:border-[#00F0FF]/30'
                }`}
              >
                {/* Left: Rank & Player Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl font-black text-[20px] font-mono flex items-center justify-center shrink-0 border ${badge.bg}`}
                  >
                    {badge.label}
                  </div>

                  <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-black/50 shrink-0 flex items-center justify-center text-[18px]">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span>{badge.icon || '👤'}</span>
                    )}
                  </div>

                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[23px] font-extrabold ${badge.nameColor} truncate max-w-[420px] tracking-tight`}>
                        {player.nickname}
                      </span>
                      {player.streak >= 2 && (
                        <span className="px-2 py-0.5 rounded text-[13px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                          🔥 {player.streak}x
                        </span>
                      )}
                    </div>
                    <div className="text-[14px] text-gray-400 font-mono">
                      Quiz: <strong className="text-gray-200">{player.quizPoints}</strong> | Tap2: <strong className="text-pink-300">{player.tap2Points}</strong> ({player.rawTap2.toLocaleString()}) | Menang: <strong className="text-amber-300">{player.wins}</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Total VP Hero Number */}
                <div className="text-right shrink-0 pl-3">
                  <div className={`text-[30px] font-black text-transparent bg-clip-text bg-gradient-to-r ${badge.vpGradient} font-mono drop-shadow-[0_2px_8px_rgba(0,240,255,0.4)]`}>
                    {player.totalVP.toLocaleString()}
                  </div>
                  <div className="text-[12px] font-bold text-[#00F0FF] uppercase tracking-wider">
                    VIEWER POINTS
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Banner */}
      <div className="glass-panel rounded-2xl px-5 py-2 max-w-[940px] w-full flex items-center justify-between text-[16px] text-gray-300 border border-white/10 mt-1">
        <div className="flex items-center gap-2">
          <span>🎁</span>
          <span className="font-bold text-[#FFD166]">
            Top 3 Juara di akhir sesi mendapatkan hadiah 1 Free Request Song!
          </span>
        </div>
        <div className="font-mono text-[#00F0FF] font-bold text-[15px]">
          !jawab &lt;lagu&gt; &lt;penyanyi&gt;
        </div>
      </div>
    </div>
  );
};
