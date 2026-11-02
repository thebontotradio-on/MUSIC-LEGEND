import React, { useState } from 'react';
import { SafeZoneConfig } from '../../../server/types.js';
import { Sliders, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface SafeZoneConfigModalProps {
  currentConfig: SafeZoneConfig;
  showGuides: boolean;
  onToggleGuides: () => void;
  onSave: (config: SafeZoneConfig) => void;
}

export const SafeZoneConfigModal: React.FC<SafeZoneConfigModalProps> = ({
  currentConfig,
  showGuides,
  onToggleGuides,
  onSave
}) => {
  const [config, setConfig] = useState<SafeZoneConfig>({ ...currentConfig });

  const handleChange = (field: keyof SafeZoneConfig, val: number) => {
    setConfig(prev => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    const defaultConfig: SafeZoneConfig = {
      x: 5,
      y: 8,
      width: 90,
      height: 52,
      margin: 24,
      chatExclusionHeight: 38
    };
    setConfig(defaultConfig);
    onSave(defaultConfig);
  };

  return (
    <div className="bg-[#121320] border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#00F0FF]" />
          KONFIGURASI SAFE ZONE & CHAT EXCLUSION (9:16)
        </h3>
        <button
          onClick={onToggleGuides}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            showGuides
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}
        >
          {showGuides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {showGuides ? 'Sembunyikan Garis Panduan' : 'Tampilkan Garis Panduan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Horizontal X */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Posisi Horizontal (X):</span>
            <span className="font-mono font-bold text-[#00F0FF]">{config.x}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            value={config.x}
            onChange={(e) => handleChange('x', parseInt(e.target.value, 10))}
            className="w-full accent-[#00F0FF]"
          />
        </div>

        {/* Vertical Y */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Posisi Vertikal (Y):</span>
            <span className="font-mono font-bold text-[#00F0FF]">{config.y}%</span>
          </div>
          <input
            type="range"
            min={2}
            max={25}
            value={config.y}
            onChange={(e) => handleChange('y', parseInt(e.target.value, 10))}
            className="w-full accent-[#00F0FF]"
          />
        </div>

        {/* Lebar Width */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Lebar Area Game:</span>
            <span className="font-mono font-bold text-[#00F0FF]">{config.width}%</span>
          </div>
          <input
            type="range"
            min={70}
            max={100}
            value={config.width}
            onChange={(e) => handleChange('width', parseInt(e.target.value, 10))}
            className="w-full accent-[#00F0FF]"
          />
        </div>

        {/* Tinggi Height */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Tinggi Area Game:</span>
            <span className="font-mono font-bold text-[#00F0FF]">{config.height}%</span>
          </div>
          <input
            type="range"
            min={40}
            max={75}
            value={config.height}
            onChange={(e) => handleChange('height', parseInt(e.target.value, 10))}
            className="w-full accent-[#00F0FF]"
          />
        </div>

        {/* Margin */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Inner Margin:</span>
            <span className="font-mono font-bold text-[#00F0FF]">{config.margin}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={48}
            value={config.margin}
            onChange={(e) => handleChange('margin', parseInt(e.target.value, 10))}
            className="w-full accent-[#00F0FF]"
          />
        </div>

        {/* Chat Exclusion Zone */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Zona Chat TikTok (Bawah):</span>
            <span className="font-mono font-bold text-rose-400">{config.chatExclusionHeight}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={50}
            value={config.chatExclusionHeight}
            onChange={(e) => handleChange('chatExclusionHeight', parseInt(e.target.value, 10))}
            className="w-full accent-rose-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/10">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Default
        </button>
        <button
          onClick={() => onSave(config)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00F0FF] hover:bg-[#33f3ff] text-black text-xs font-black shadow-md"
        >
          <Save className="w-4 h-4" />
          Simpan Konfigurasi
        </button>
      </div>
    </div>
  );
};

