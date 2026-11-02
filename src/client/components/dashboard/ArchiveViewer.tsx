import React, { useEffect, useState } from 'react';
import { SessionArchiveSummary } from '../../../server/types.js';
import { Archive, ChevronDown, ChevronRight, Trophy, Users, Calendar } from 'lucide-react';

export const ArchiveViewer: React.FC = () => {
  const [archives, setArchives] = useState<SessionArchiveSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/archives');
      if (res.ok) {
        const data = await res.json();
        setArchives(data);
      }
    } catch (err) {
      console.error('Failed to load archives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Archive className="w-5 h-5 text-[#FFD700]" />
          ARSIP SESI LIVE (SQLITE PERSISTENCE)
        </h3>
        <button
          onClick={fetchArchives}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 rounded-lg transition"
        >
          {loading ? 'Memuat...' : 'Muat Ulang Arsip'}
        </button>
      </div>

      {archives.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-xs italic">
          Belum ada sesi LIVE yang diarsipkan di database SQLite.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {archives.map((sess) => {
            const isExpanded = expandedId === sess.id;
            return (
              <div
                key={sess.id}
                className="bg-[#0b0c16] border border-white/10 rounded-xl overflow-hidden transition"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sess.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#00F0FF]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{sess.sessionCode}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ({new Date(sess.startedAt).toLocaleString()})
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#00F0FF]" /> {sess.totalParticipants} Peserta
                        </span>
                        <span>•</span>
                        <span>{sess.totalRounds} Round</span>
                      </div>
                    </div>
                  </div>

                  {sess.champion && (
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#FFD700] flex items-center gap-1 justify-end">
                        <Trophy className="w-3.5 h-3.5" /> {sess.champion.nickname}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {sess.champion.totalVP} VP (Quiz: {sess.champion.quizPoints} | Tap2: {sess.champion.tap2Points})
                      </span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-3 bg-black/40 border-t border-white/10 text-xs space-y-3">
                    {/* Champion Rewards Section */}
                    {sess.championRewards && sess.championRewards.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                        <div className="font-bold text-amber-300 text-xs mb-1.5 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Penerima Hadiah 1 Free Request Song:</span>
                        </div>
                        <div className="space-y-1 text-[11px] font-mono">
                          {sess.championRewards.map((rew) => (
                            <div key={rew.id} className="flex items-center justify-between py-0.5 border-b border-white/5 last:border-0">
                              <span className="text-white">
                                Juara #{rew.rank}: <strong className="text-amber-200">@{rew.nickname}</strong> ({rew.totalVP} VP)
                              </span>
                              <span className={rew.status === 'REDEEMED' ? 'text-gray-400' : 'text-emerald-400 font-bold'}>
                                {rew.status === 'REDEEMED'
                                  ? `✓ Digunakan: ${rew.requestedSong || 'Lagu Pilihan'}`
                                  : '★ Belum Digunakan'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="mb-1 font-bold text-gray-300">Riwayat Soal:</div>
                      <div className="space-y-1 font-mono text-[11px]">
                        {sess.rounds.map((r) => (
                          <div key={r.roundNumber} className="flex justify-between text-gray-400 py-0.5">
                            <span>
                              Round #{r.roundNumber}: {r.question.expectedTitle} — {r.question.expectedArtist}
                            </span>
                            <span className="text-emerald-400">
                              {r.winner ? `✓ ${r.winner.player.nickname} (+${r.winner.pointsAwarded} VP)` : 'Dilewati'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

