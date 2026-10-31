import React, { useState } from 'react';
import { GameState, SafeZoneConfig } from '../../../server/types.js';
import { HostControls } from './HostControls.js';
import { ChampionRewardsPanel } from './ChampionRewardsPanel.js';
import { RVTikChatOutputPanel } from './RVTikChatOutputPanel.js';
import { SafeZoneConfigModal } from './SafeZoneConfigModal.js';
import { AudioControlPanel } from './AudioControlPanel.js';
import { SimulatorPanel } from './SimulatorPanel.js';
import { LeaderboardTable } from './LeaderboardTable.js';
import { BridgeStatusPanel } from './BridgeStatusPanel.js';
import { ArchiveViewer } from './ArchiveViewer.js';
import { OverlayView } from '../overlay/OverlayView.js';
import { Radio, ExternalLink } from 'lucide-react';

interface HostDashboardProps {
  gameState: GameState;
  onAction: (endpoint: string, body?: any) => Promise<any>;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ gameState, onAction }) => {
  const [showGuides, setShowGuides] = useState(false);

  const handleHostControl = async (action: string, payload?: any) => {
    switch (action) {
      case 'start-game':
        await onAction('/api/host/start-game');
        break;
      case 'start-round':
        await onAction('/api/host/start-round');
        break;
      case 'start-bonus':
        await onAction('/api/host/start-bonus');
        break;
      case 'next':
        await onAction('/api/host/next');
        break;
      case 'skip':
        await onAction('/api/host/skip');
        break;
      case 'reveal':
        await onAction('/api/host/reveal');
        break;
      case 'pause':
        await onAction('/api/host/pause');
        break;
      case 'resume':
        await onAction('/api/host/resume');
        break;
      case 'show-podium':
      case 'final-show':
        await onAction('/api/host/show-podium');
        break;
      case 'hide-podium':
        await onAction('/api/host/hide-podium');
        break;
      case 'repeat-announcement':
        await onAction('/api/host/repeat-announcement');
        break;
      case 'redeem-reward':
        await onAction('/api/host/redeem-reward', payload);
        break;
      case 'end-session':
        await onAction('/api/host/end-session');
        break;
    }
  };

  const handleUpdateAudio = async (playing?: boolean, volume?: number) => {
    await onAction('/api/host/audio', { playing, volume });
  };

  const handleTestPlayback = async () => {
    await onAction('/api/bridge/test-playback');
  };

  const handleSaveSafeZone = async (config: SafeZoneConfig) => {
    await onAction('/api/host/safe-zone', config);
  };

  const handleSimulateComment = async (text: string, nickname?: string, userId?: string) => {
    await onAction('/api/host/simulate-comment', { text, nickname, userId });
  };

  const handleSimulateLike = async (count: number, nickname?: string, userId?: string, isCumulative?: boolean) => {
    await onAction('/api/host/simulate-like', { count, nickname, userId, isCumulative });
  };

  const handleDispatchRVTik = async (commandId?: string, mode?: any) => {
    await onAction('/api/rvtik/send', { commandId, mode });
  };

  const handleToggleAutoSendRVTik = async (enabled: boolean) => {
    await onAction('/api/rvtik/auto-send', { enabled });
  };

  const handleSetRVTikMode = async (mode: any) => {
    await onAction('/api/rvtik/mode', { mode });
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-white p-4 md:p-6 select-none font-sans">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-[#00F0FF]" />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#8A2BE2]">
              MUSIC LEGEND LIVE — DASHBOARD HOST
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            THE BONTOT RADIO • Sesi: <span className="font-mono text-[#FFD700]">{gameState.sessionId || 'Belum Aktif'}</span> • Tagline: <strong className="text-gray-300">ONE LIVE. ONE CHAMPION.</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/overlay"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/60 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Buka OBS Overlay (1080x1920)
          </a>
        </div>
      </header>

      {/* Main Grid: Left Controls & Status, Right Live 9:16 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Controls, Tables, Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Host Action Buttons */}
          <HostControls gameState={gameState} onAction={handleHostControl} />

          {/* Champion Rewards & Podium Controls */}
          <ChampionRewardsPanel gameState={gameState} onAction={handleHostControl} />

          {/* RVTik Chat Command Output Panel (TikTok LIVE Request Integration) */}
          <RVTikChatOutputPanel
            status={gameState.rvtikChatStatus}
            onDispatchCommand={handleDispatchRVTik}
            onToggleAutoSend={handleToggleAutoSendRVTik}
            onSetMode={handleSetRVTikMode}
          />

          {/* Audio Systems (Channels A & B) */}
          <AudioControlPanel
            gameState={gameState}
            onUpdateAudio={handleUpdateAudio}
            onTestPlayback={handleTestPlayback}
          />

          {/* Safe Zone Live Sliders */}
          <SafeZoneConfigModal
            currentConfig={gameState.safeZone}
            showGuides={showGuides}
            onToggleGuides={() => setShowGuides(!showGuides)}
            onSave={handleSaveSafeZone}
          />

          {/* TikTok & Like Simulator (Dev Mode) */}
          <SimulatorPanel
            gameState={gameState}
            onSimulateComment={handleSimulateComment}
            onSimulateLike={handleSimulateLike}
          />

          {/* Real-time Transparent Leaderboard */}
          <LeaderboardTable players={gameState.leaderboard} />

          {/* Bridge Adapter Status & Call Logs */}
          <BridgeStatusPanel
            playbackStatus={gameState.playbackStatus}
            tiktokStatus={gameState.tiktokStatus}
            onRefreshBridge={handleTestPlayback}
          />

          {/* Session Archive SQLite Viewer */}
          <ArchiveViewer />
        </div>

        {/* Right Column (4 cols): Live 9:16 Portrait Preview */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="bg-[#121320] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live OBS Preview (9:16 Portrait)
                </span>
                <span className="text-[10px] font-mono text-gray-400">1080 x 1920</span>
              </div>

              {/* Scaled Preview Frame */}
              <div
                className="relative overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl bg-black"
                style={{
                  width: '320px',
                  height: '568px' // 320 * (16 / 9) = 568.88
                }}
              >
                <div
                  className="absolute top-0 left-0 origin-top-left pointer-events-none"
                  style={{
                    transform: `scale(${320 / 1080})`,
                    width: '1080px',
                    height: '1920px'
                  }}
                >
                  <OverlayView gameState={gameState} showGuides={showGuides} />
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mt-3 text-center">
                Tampilan persis yang ditangkap oleh Browser Source OBS Studio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

