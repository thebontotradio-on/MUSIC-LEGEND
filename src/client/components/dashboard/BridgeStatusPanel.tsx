import React from 'react';
import { PlaybackBridgeStatus, TikTokConnectorStatus } from '../../../server/types.js';
import { Radio, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface BridgeStatusPanelProps {
  playbackStatus: PlaybackBridgeStatus;
  tiktokStatus: TikTokConnectorStatus;
  onRefreshBridge: () => void;
}

export const BridgeStatusPanel: React.FC<BridgeStatusPanelProps> = ({
  playbackStatus,
  tiktokStatus,
  onRefreshBridge
}) => {
  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <Activity className="w-5 h-5 text-[#00F0FF]" />
        STATUS ADAPTER & LOG PANGGILAN BRIDGE
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* TikTok Connector Status */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase">
              TikTok Connector
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                tiktokStatus.mode === 'SIMULATION'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              MODE: {tiktokStatus.mode}
            </span>
          </div>

          <div className="space-y-1 text-gray-400 font-mono">
            <div className="flex justify-between">
              <span>Target Username:</span>
              <span className="text-white">@{tiktokStatus.liveUsername || 'thebontotradio'}</span>
            </div>
            <div className="flex justify-between">
              <span>Viewer Aktif:</span>
              <span className="text-emerald-400 font-bold">{tiktokStatus.activeViewersCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Komentar Diproses:</span>
              <span className="text-white">{tiktokStatus.totalCommentsProcessed}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Like Diterima:</span>
              <span className="text-pink-400">{tiktokStatus.totalLikesReceived}</span>
            </div>
          </div>
        </div>

        {/* Playback Bridge Status */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase">
              Playback Bridge (Bontot Studio)
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                playbackStatus.connected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {playbackStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="space-y-1 text-gray-400 font-mono">
            <div className="flex justify-between">
              <span>Adapter Mode:</span>
              <span className="text-white">{playbackStatus.mode}</span>
            </div>
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="text-gray-300 truncate max-w-[200px]">{playbackStatus.endpoint}</span>
            </div>
            <div className="flex justify-between">
              <span>Status Koneksi:</span>
              <span className={playbackStatus.connected ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                {playbackStatus.connected ? 'Siap Menerima Panggilan' : 'Offline / Unreachable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call History Log */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <span className="text-xs font-bold text-gray-300 uppercase block mb-2">
          Log Pemanggilan Playback Terakhir:
        </span>
        {playbackStatus.recentCalls.length === 0 ? (
          <p className="text-gray-500 text-xs italic">Belum ada pemanggilan lagu jawaban.</p>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
            {playbackStatus.recentCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded border border-white/5"
              >
                <div className="flex items-center gap-2">
                  {call.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="text-white font-semibold">
                    {call.songTitle} — {call.artist}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  {call.errorMessage && (
                    <span className="text-rose-400 text-[10px] truncate max-w-[240px]">
                      {call.errorMessage}
                    </span>
                  )}
                  <span>{new Date(call.requestedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

