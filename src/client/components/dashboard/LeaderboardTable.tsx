import React from 'react';
import { Player } from '../../../server/types.js';
import { Trophy, Flame } from 'lucide-react';

interface LeaderboardTableProps {
  players: Player[];
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ players }) => {
  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#FFD700]" />
          KLASEMEN LIVE (TRANSPARAN: QUIZ + TAP2 VP)
        </h3>
        <span className="text-xs font-semibold text-gray-400">
          Total Peserta: <strong className="text-[#00F0FF]">{players.length}</strong>
        </span>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm italic">
          Belum ada penonton yang menjawab atau melakukan tap2 di sesi ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-gray-400 uppercase font-mono border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Peserta</th>
                <th className="py-2.5 px-3 text-right">Quiz Pts</th>
                <th className="py-2.5 px-3 text-right">Raw Tap2</th>
                <th className="py-2.5 px-3 text-right">Tap2 Pts</th>
                <th className="py-2.5 px-3 text-right">Total VP</th>
                <th className="py-2.5 px-3 text-center">Menang</th>
                <th className="py-2.5 px-3 text-center">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`hover:bg-white/5 transition ${
                    idx === 0
                      ? 'bg-[#FFD700]/10 font-bold text-amber-200'
                      : idx === 1
                      ? 'bg-gray-400/5 text-gray-200'
                      : idx === 2
                      ? 'bg-amber-800/10 text-amber-300'
                      : 'text-gray-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                  </td>
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    {p.avatarUrl && (
                      <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded-full border border-white/20" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold truncate max-w-[150px]">{p.nickname}</span>
                      <span className="text-[10px] text-gray-500 font-mono">@{p.id}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                    {p.quizPoints}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-pink-400">
                    {p.rawTap2}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-pink-300">
                    {p.tap2Points}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-[#00F0FF] text-sm">
                    {p.totalVP}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    {p.wins}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {p.streak >= 3 ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-600/30 text-orange-400 font-bold text-[10px]">
                        <Flame className="w-3 h-3" /> {p.streak}x
                      </span>
                    ) : p.streak > 0 ? (
                      `${p.streak}x`
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

