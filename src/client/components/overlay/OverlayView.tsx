import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../../../server/types.js';
import { ThreeStageEngine } from '../../three/ThreeStageEngine.js';
import { StageIdle } from './StageIdle.js';
import { StageGuessing } from './StageGuessing.js';
import { StageWinner } from './StageWinner.js';
import { StageChampion } from './StageChampion.js';
import { SafeZoneGuides } from './SafeZoneGuides.js';
import { soundSystem } from '../../audio/SoundSystem.js';

interface OverlayViewProps {
  gameState: GameState;
  showGuides?: boolean;
}

export const OverlayView: React.FC<OverlayViewProps> = ({ gameState, showGuides = false }) => {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeStageEngine | null>(null);
  const previousStage = useRef(gameState.stage);

  // Initialize Three.js scene
  useEffect(() => {
    if (threeContainerRef.current && !engineRef.current) {
      engineRef.current = new ThreeStageEngine(threeContainerRef.current);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Update Three.js stage and sound system when gameState changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setStage(gameState.stage);
    }

    // Audio backsound synchronization
    soundSystem.setVolume(gameState.audio.bgmVolume);
    if (gameState.audio.bgmPlaying) {
      soundSystem.startBGM();
    } else {
      soundSystem.pauseBGM();
    }

    // Trigger celebratory fanfare on stage transition to WINNER
    if (previousStage.current !== 'WINNER' && gameState.stage === 'WINNER') {
      soundSystem.playWinFanfare();
    }

    previousStage.current = gameState.stage;
  }, [gameState.stage, gameState.audio.bgmPlaying, gameState.audio.bgmVolume]);

  const { safeZone } = gameState;

  return (
    <div className="obs-portrait-container select-none relative mx-auto">
      {/* 3D WebGL Canvas Layer (Full 1080x1920) */}
      <div
        ref={threeContainerRef}
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      />

      {/* Subtle Dark Vignette & Scanline */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10" />

      {/* Top Brand Bar */}
      <div className="absolute top-4 left-0 right-0 px-8 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#00F0FF] animate-ping" />
          <span className="text-[22px] font-black tracking-widest text-[#00F0FF] uppercase">
            THE BONTOT RADIO
          </span>
        </div>
        <div className="text-[20px] font-bold text-gray-400 uppercase tracking-widest">
          MUSIC LEGEND LIVE
        </div>
      </div>

      {/* GAME SAFE ZONE AREA (Configurable Position & Dimensions) */}
      <div
        className="absolute z-30 flex flex-col items-center justify-center transition-all duration-300"
        style={{
          left: `${safeZone.x}%`,
          top: `${safeZone.y}%`,
          width: `${safeZone.width}%`,
          height: `${safeZone.height}%`,
          padding: `${safeZone.margin}px`
        }}
      >
        {gameState.stage === 'IDLE' && <StageIdle />}
        {gameState.stage === 'GUESSING' && (
          <StageGuessing
            roundNumber={gameState.roundNumber}
            question={gameState.currentQuestion}
            isLocked={gameState.isQuestionLocked}
          />
        )}
        {gameState.stage === 'WINNER' && (
          <StageWinner round={gameState.currentRound} />
        )}
        {gameState.stage === 'CHAMPION' && (
          <StageChampion leaderboard={gameState.leaderboard} />
        )}
      </div>

      {/* CHAT EXCLUSION ZONE (Bottom screen reserved for TikTok comments) */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none transition-all duration-300 flex flex-col justify-end p-6"
        style={{ height: `${safeZone.chatExclusionHeight}%` }}
      >
        {/* Dark subtle background gradient behind TikTok comment stream for max readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent -z-10" />

        {/* Minimalist Live Activity Ticker */}
        <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between border-t border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">💖</span>
            <span className="text-[20px] font-bold text-pink-400">
              Tap2 Screen: 100 Tap2 = 1 VP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-mono text-gray-400">
              {gameState.leaderboard.length} Peserta Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Optional Debug Safe Zone Guides */}
      <SafeZoneGuides safeZone={safeZone} showGuides={showGuides} />
    </div>
  );
};

