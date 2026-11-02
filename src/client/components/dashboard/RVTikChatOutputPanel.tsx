import React, { useState } from 'react';
import { MessageSquare, Send, Copy, Check, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import type { RVTikChatOutputStatus, RVTikChatOutputMode } from '../../../server/types.js';

interface RVTikChatOutputPanelProps {
  status?: RVTikChatOutputStatus;
  onDispatchCommand: (commandId?: string, mode?: RVTikChatOutputMode) => Promise<void>;
  onToggleAutoSend: (enabled: boolean) => Promise<void>;
  onSetMode: (mode: RVTikChatOutputMode) => Promise<void>;
}

export const RVTikChatOutputPanel: React.FC<RVTikChatOutputPanelProps> = ({
  status,
  onDispatchCommand,
  onToggleAutoSend,
  onSetMode
}) => {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const lastCmd = status?.lastCommand;
  const activeMode = status?.activeMode || 'CLIPBOARD_ASSIST';
  const autoSend = status?.autoSendEnabled || false;

  const handleCopyAndSend = async () => {
    if (!lastCmd) return;
    setSending(true);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(lastCmd.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      await onDispatchCommand(lastCmd.id, activeMode);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#00F0FF]" />
          RVTIK CHAT COMMAND OUTPUT (TIKTOK LIVE REQUEST)
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer bg-white/5 px-3 py-1 rounded-lg border border-white/10">
            <input
              type="checkbox"
              checked={autoSend}
              onChange={(e) => onToggleAutoSend(e.target.checked)}
              className="accent-[#00F0FF]"
            />
            <span>{activeMode === 'CLIPBOARD_ASSIST' ? 'Auto-Salin ke Clipboard saat Pemenang' : 'Auto-Send saat Pemenang Terkunci'}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mode Selector & Status info */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4 text-xs space-y-3">
          <div className="font-bold text-gray-300 uppercase flex items-center justify-between">
            <span>Metode Pengiriman:</span>
            <span className="text-[10px] text-gray-400 font-mono">STANDALONE ED.</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => onSetMode('CLIPBOARD_ASSIST')}
              className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                activeMode === 'CLIPBOARD_ASSIST'
                  ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white font-bold'
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>📋 Clipboard Assist (Rekomendasi)</span>
                {activeMode === 'CLIPBOARD_ASSIST' && <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />}
              </div>
              <p className="text-[10px] font-normal text-gray-400 mt-0.5">
                Salin otomatis & notifikasi host untuk tempel di kolom chat LIVE.
              </p>
            </button>

            <button
              onClick={() => onSetMode('WINDOW_AUTOMATION')}
              className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                activeMode === 'WINDOW_AUTOMATION'
                  ? 'bg-purple-500/10 border-purple-500 text-white font-bold'
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>🖥️ Desktop Window SendKeys</span>
                {activeMode === 'WINDOW_AUTOMATION' && <ShieldCheck className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-[10px] font-normal text-gray-400 mt-0.5">
                Kirim langsung ke jendela TikTok Live Studio yang aktif di Windows.
              </p>
            </button>

            <button
              onClick={() => onSetMode('SIMULATION')}
              className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                activeMode === 'SIMULATION'
                  ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>🧪 Simulation Mode (Offline)</span>
                {activeMode === 'SIMULATION' && <ShieldCheck className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[10px] font-normal text-gray-400 mt-0.5">
                Uji alur tanpa menyentuh clipboard atau aplikasi desktop.
              </p>
            </button>
          </div>
        </div>

        {/* Current Command Display */}
        <div className="lg:col-span-2 bg-[#0b0c16] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Perintah Lagu Jawaban untuk RVTik:
              </span>
              {lastCmd && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lastCmd.verifiedInChat
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : lastCmd.status === 'COPIED_TO_CLIPBOARD'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : lastCmd.status === 'SENT'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : lastCmd.status === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {lastCmd.verifiedInChat
                    ? 'TERVERIFIKASI DI CHAT LIVE'
                    : lastCmd.status === 'COPIED_TO_CLIPBOARD'
                    ? 'TERSALIN KE CLIPBOARD (MENUNGGU PASTE OLEH HOST)'
                    : `STATUS: ${lastCmd.status}`}
                </span>
              )}
            </div>

            {lastCmd ? (
              <div className="bg-black/50 border border-white/10 rounded-xl p-3 my-2">
                <div className="text-lg font-mono font-bold text-[#00F0FF] select-all">
                  {lastCmd.command}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2 font-mono">
                  <span>Pemenang: <strong className="text-white">@{lastCmd.winnerNickname || 'Pemenang'}</strong></span>
                  <span>•</span>
                  <span>Lagu: <strong className="text-white">{lastCmd.songTitle} — {lastCmd.artist}</strong></span>
                  <span>•</span>
                  <span>Waktu: {new Date(lastCmd.sentAt).toLocaleTimeString()}</span>
                </div>
                {lastCmd.errorMessage && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {lastCmd.errorMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-black/30 border border-dashed border-white/10 rounded-xl p-6 text-center text-gray-500 text-xs italic my-2">
                Belum ada pemenang yang terkunci. Perintah `!play &lt;judul&gt; &lt;penyanyi&gt;` akan otomatis diformat di sini saat penonton menjawab benar.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 mt-2">
            <div className="text-[11px] text-gray-400">
              {lastCmd?.verifiedInChat ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  RVTik mendeteksi perintah di chat & memasukkan lagu ke antrean. Host silakan tekan PUTAR di RVTik.
                </span>
              ) : (
                <span>Kirim perintah agar terbaca oleh RVTik di kolom chat TikTok LIVE.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!lastCmd || sending}
                onClick={handleCopyAndSend}
                className="px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-blue-600 hover:from-[#00F0FF]/90 hover:to-blue-600/90 disabled:opacity-40 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin & Kirim ke Chat'}</span>
              </button>

              <button
                disabled={!lastCmd || sending}
                onClick={() => onDispatchCommand(lastCmd?.id, activeMode)}
                className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded-xl transition"
                title="Kirim Ulang / Retry"
              >
                <RefreshCw className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

