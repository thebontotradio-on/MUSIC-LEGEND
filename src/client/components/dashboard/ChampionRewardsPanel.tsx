import React, { useState } from 'react';
import type { ChampionRewardRecord, GameState } from '../../../server/types.js';
import { Trophy, Gift, CheckCircle, Clock, Copy, Check, Eye, EyeOff, Volume2 } from 'lucide-react';

interface ChampionRewardsPanelProps {
  gameState: GameState;
  onAction: (action: string, payload?: any) => void;
}

export const ChampionRewardsPanel: React.FC<ChampionRewardsPanelProps> = ({
  gameState,
  onAction
}) => {
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [songTitleInput, setSongTitleInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rewards = gameState.championRewards || [];
  const isPodiumActive = gameState.stage === 'CHAMPION';

  const handleRedeem = (userId: string) => {
    onAction('redeem-reward', {
      userId,
      requestedSong: songTitleInput.trim() || undefined,
      notes: `Ditandai oleh Host pada ${new Date().toLocaleTimeString('id-ID')}`
    });
    setSelectedRewardId(null);
    setSongTitleInput('');
  };

  const handleCopyHostAssist = (reward: ChampionRewardRecord) => {
    const text = `!play ${reward.requestedSong || 'Lagu Pilihan'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(reward.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-amber-400 to-yellow-500 text-black border-amber-400';
      case 2:
        return 'from-slate-300 to-gray-400 text-black border-slate-300';
      case 3:
        return 'from-amber-700 to-amber-600 text-white border-amber-600';
      default:
        return 'from-cyan-500 to-blue-500 text-white border-cyan-400';
    }
  };

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" />
          KENDALI PODIUM & HADIAH JUARA (1 FREE REQUEST SONG)
        </h3>

        {/* Podium View Controls for Host */}
        <div className="flex flex-wrap items-center gap-2">
          {isPodiumActive ? (
            <button
              onClick={() => onAction('hide-podium')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-white/10 text-xs font-bold transition"
            >
              <EyeOff className="w-4 h-4 text-gray-400" />
              TUTUP PODIUM DI OBS
            </button>
          ) : (
            <button
              onClick={() => onAction('show-podium')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black transition shadow-md"
            >
              <Eye className="w-4 h-4" />
              TAMPILKAN PODIUM DI OBS
            </button>
          )}

          <button
            onClick={() => onAction('repeat-announcement')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700/80 hover:bg-purple-600 text-white text-xs font-bold transition"
            title="Ulang pengumuman juara di ticker & dialog"
          >
            <Volume2 className="w-4 h-4" />
            ULANG PENGUMUMAN
          </button>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="bg-[#0b0c16] border border-dashed border-white/10 rounded-xl p-6 text-center text-gray-400 text-xs italic">
          Belum ada sesi yang diselesaikan. Klik <strong>END SESSION & ARSIP</strong> saat permainan kuis selesai untuk mengunci Top 3 Juara dan mengaktifkan hak 1 Free Request Song.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rewards.map((reward) => {
              const isRedeemed = reward.status === 'REDEEMED';
              const rankColor = getRankColor(reward.rank);

              return (
                <div
                  key={reward.id}
                  className={`bg-[#0b0c16] rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isRedeemed
                      ? 'border-white/10 opacity-75'
                      : 'border-amber-500/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                  }`}
                >
                  <div>
                    {/* Header: Rank & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border bg-gradient-to-r ${rankColor}`}
                      >
                        JUARA #{reward.rank}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          isRedeemed
                            ? 'bg-gray-800 text-gray-400 border border-gray-700'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        }`}
                      >
                        {isRedeemed ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            SUDAH DIGUNAKAN
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            BELUM DIGUNAKAN
                          </>
                        )}
                      </span>
                    </div>

                    {/* Nickname & Points */}
                    <div className="my-2">
                      <h4 className="text-base font-black text-white truncate">
                        @{reward.nickname}
                      </h4>
                      <div className="text-xs text-gray-400 font-mono flex items-center justify-between mt-1">
                        <span>Total: <strong className="text-cyan-400">{reward.totalVP} VP</strong></span>
                        <span className="text-[10px] text-gray-500">ID: {reward.userId.slice(-8)}</span>
                      </div>
                    </div>

                    {/* Song Details if Redeemed */}
                    {reward.requestedSong && (
                      <div className="bg-black/50 border border-white/5 rounded-lg p-2 my-2 text-xs">
                        <span className="text-[10px] text-gray-400 block uppercase">Lagu Pilihan Juara:</span>
                        <span className="font-bold text-amber-300">{reward.requestedSong}</span>
                        {reward.redeemedAt && (
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            Klaim: {new Date(reward.redeemedAt).toLocaleTimeString('id-ID')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
                    {!isRedeemed ? (
                      selectedRewardId === reward.id ? (
                        <div className="space-y-2 bg-black/60 p-2.5 rounded-lg border border-amber-500/30">
                          <input
                            type="text"
                            placeholder="Judul lagu pilihan juara..."
                            value={songTitleInput}
                            onChange={(e) => setSongTitleInput(e.target.value)}
                            className="w-full bg-[#121320] border border-white/20 rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRedeem(reward.userId)}
                              className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition"
                            >
                              Konfirmasi Klaim
                            </button>
                            <button
                              onClick={() => setSelectedRewardId(null)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRewardId(reward.id);
                            setSongTitleInput('');
                          }}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs rounded-lg transition shadow flex items-center justify-center gap-1.5"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Tandai Hadiah Digunakan
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleCopyHostAssist(reward)}
                        className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-white/5 transition flex items-center justify-center gap-1.5"
                        title="Bantu input manual jika akun juara terkena limit 1 lagu di RVTik"
                      >
                        {copiedId === reward.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tersalin ke Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Bantu Request Manual (!play)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-400 italic pt-1">
            ℹ️ <strong>Aturan Hadiah:</strong> Setiap juara berhak atas 1 Free Request Song per sesi. Sistem mencegah akun yang sama mengklaim hadiah dua kali dalam satu sesi. Hadiah dicatat dalam arsip sesi dan tidak mengubah antrean request normal.
          </p>
        </div>
      )}
    </div>
  );
};
