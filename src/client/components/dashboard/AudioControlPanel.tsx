import React from 'react';
import { GameState } from '../../../server/types.js';
import { Volume2, VolumeX, Play, Pause, Radio, Music } from 'lucide-react';

interface AudioControlPanelProps {
  gameState: GameState;
  onUpdateAudio: (playing?: boolean, volume?: number) => void;
  onTestPlayback: () => void;
}

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({
  gameState,
  onUpdateAudio,
  onTestPlayback
}) => {
  const { audio, playbackStatus } = gameState;

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <Radio className="w-5 h-5 text-[#8A2BE2]" />
        SISTEM DUA JALUR AUDIO (TBR)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Jalur A: Game Background Music */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#00F0FF] flex items-center gap-1.5 uppercase">
              <Music className="w-4 h-4" />
              Jalur A: Backsound Game
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                audio.bgmPlaying
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {audio.bgmPlaying ? 'SEDANG BERPUTAR' : 'DIJEDA'}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 mb-3">
            Web Audio Synth / Chrome Audio Output (Auto-pause saat ada pemenang, auto-resume saat NEXT).
          </p>

          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => onUpdateAudio(!audio.bgmPlaying)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                audio.bgmPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {audio.bgmPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {audio.bgmPlaying ? 'Jeda BGM' : 'Putar BGM'}
            </button>

            <div className="flex items-center gap-2 flex-1">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(audio.bgmVolume * 100)}
                onChange={(e) => onUpdateAudio(undefined, parseInt(e.target.value, 10) / 100)}
                className="w-full accent-[#00F0FF]"
              />
              <span className="text-xs font-mono text-gray-300 w-8">
                {Math.round(audio.bgmVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Jalur B: Answer Song Playback Bridge */}
        <div className="bg-[#0b0c16] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#FFD700] flex items-center gap-1.5 uppercase">
              <Radio className="w-4 h-4" />
              Jalur B: Playback Bridge
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

          <p className="text-[11px] text-gray-400 mb-2">
            Target integrasi: Mesin Playback BONTOT STUDIO ({playbackStatus.endpoint}).
          </p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
            <span className="text-[10px] text-gray-400 italic">
              *Poin kuis tetap diberikan walau playback offline.
            </span>
            <button
              onClick={onTestPlayback}
              className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 border border-white/20 transition"
            >
              Cek Koneksi Bridge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

