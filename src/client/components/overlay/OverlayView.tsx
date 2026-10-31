import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../../../server/types.js';
import { ThreeStageEngine } from '../../three/ThreeStageEngine.js';
import { StageIdle } from './StageIdle.js';
import { StageGuessing } from './StageGuessing.js';
import { StageWinner } from './StageWinner.js';
import { StageChampion } from './StageChampion.js';
import { Top10Leaderboard } from './Top10Leaderboard.js';
import { SafeZoneGuides } from './SafeZoneGuides.js';
import { TBRLogo } from '../common/TBRLogo.js';
import { soundSystem } from '../../audio/SoundSystem.js';
import { QUESTION_CATALOG } from '../../../server/catalog/questions.js';
import type { Player, RoundResult } from '../../../server/types.js';

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
        <div className="flex items-center gap-3">
          <TBRLogo size="md" variant="glow" />
          <div className="flex flex-col">
            <span className="text-[24px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#8A2BE2] uppercase leading-none">
              THE BONTOT RADIO
            </span>
            <span className="text-[13px] font-mono tracking-widest text-[#00F0FF]/80 uppercase mt-1">
              OFFICIAL MUSIC ARENA
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-[#00F0FF]/30 px-4 py-1.5 rounded-2xl backdrop-blur-md">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
          <span className="text-[18px] font-black text-gray-200 uppercase tracking-widest">
            MUSIC LEGEND LIVE
          </span>
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
        {(() => {
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const stageParam = urlParams?.get('stage')?.toUpperCase() || urlParams?.get('preview')?.toUpperCase();

          const isLeaderboardView = stageParam === 'LEADERBOARD' || (typeof window !== 'undefined' && (
            window.location?.search?.includes('view=leaderboard') ||
            window.location?.hash?.includes('view=leaderboard') ||
            window.location?.search?.includes('widget=overlay-music-legend-leaderboard') ||
            window.location?.hash?.includes('widget=overlay-music-legend-leaderboard')
          ));

          const currentStage = stageParam || gameState.stage;

          // Realistic mock data fallback for previewing in OBS / Test Harness
          const mockLeaderboard: Player[] = [
            {
              id: 'u1',
              nickname: 'Sultan_Bontot',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
              totalVP: 1250,
              quizPoints: 900,
              tap2Points: 350,
              wins: 6,
              rawTap2: 35000,
              streak: 3,
              lastWinTimestamp: 5000
            },
            {
              id: 'u2',
              nickname: 'Ratu_Jogja',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
              totalVP: 950,
              quizPoints: 750,
              tap2Points: 200,
              wins: 5,
              rawTap2: 20000,
              streak: 1,
              lastWinTimestamp: 4800
            },
            {
              id: 'u3',
              nickname: 'RockStar_Melody',
              avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
              totalVP: 720,
              quizPoints: 500,
              tap2Points: 220,
              wins: 3,
              rawTap2: 22000,
              streak: 0,
              lastWinTimestamp: 4500
            },
            {
              id: 'u4',
              nickname: 'Bontoters_Sejati',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
              totalVP: 580,
              quizPoints: 400,
              tap2Points: 180,
              wins: 2,
              rawTap2: 18000,
              streak: 0,
              lastWinTimestamp: 4200
            },
            {
              id: 'u5',
              nickname: 'Melody_Nusantara',
              avatarUrl: '',
              totalVP: 450,
              quizPoints: 300,
              tap2Points: 150,
              wins: 2,
              rawTap2: 15000,
              streak: 0,
              lastWinTimestamp: 4000
            },
            {
              id: 'u6',
              nickname: 'Ahmad_Gitaris',
              avatarUrl: '',
              totalVP: 380,
              quizPoints: 250,
              tap2Points: 130,
              wins: 1,
              rawTap2: 13000,
              streak: 0,
              lastWinTimestamp: 3800
            },
            {
              id: 'u7',
              nickname: 'Dian_Nostalgia',
              avatarUrl: '',
              totalVP: 310,
              quizPoints: 200,
              tap2Points: 110,
              wins: 1,
              rawTap2: 11000,
              streak: 0,
              lastWinTimestamp: 3600
            },
            {
              id: 'u8',
              nickname: 'Indra_Harmoni',
              avatarUrl: '',
              totalVP: 260,
              quizPoints: 150,
              tap2Points: 110,
              wins: 1,
              rawTap2: 11000,
              streak: 0,
              lastWinTimestamp: 3400
            },
            {
              id: 'u9',
              nickname: 'Siti_Keroncong',
              avatarUrl: '',
              totalVP: 210,
              quizPoints: 100,
              tap2Points: 110,
              wins: 1,
              rawTap2: 11000,
              streak: 0,
              lastWinTimestamp: 3200
            },
            {
              id: 'u10',
              nickname: 'Budi_Bass',
              avatarUrl: '',
              totalVP: 180,
              quizPoints: 100,
              tap2Points: 80,
              wins: 1,
              rawTap2: 8000,
              streak: 0,
              lastWinTimestamp: 3000
            }
          ];

          const activeLeaderboard = gameState.leaderboard.length > 0 ? gameState.leaderboard : mockLeaderboard;

          if (isLeaderboardView) {
            return (
              <Top10Leaderboard
                leaderboard={activeLeaderboard}
                activeRound={gameState.roundNumber || 3}
              />
            );
          }

          if (currentStage === 'IDLE') {
            return gameState.leaderboard.length > 0 ? (
              <Top10Leaderboard
                leaderboard={gameState.leaderboard}
                activeRound={gameState.roundNumber}
              />
            ) : (
              <StageIdle />
            );
          }

          if (currentStage === 'GUESSING') {
            const displayQuestion = gameState.currentQuestion || QUESTION_CATALOG[0];
            return (
              <StageGuessing
                roundNumber={gameState.roundNumber || 1}
                question={displayQuestion}
                isLocked={gameState.isQuestionLocked}
              />
            );
          }

          if (currentStage === 'WINNER') {
            const displayRound: RoundResult = gameState.currentRound || {
              roundNumber: gameState.roundNumber || 1,
              question: gameState.currentQuestion || QUESTION_CATALOG[0],
              winner: {
                player: mockLeaderboard[3], // Bontoters_Sejati with avatar photo
                answeredAt: Date.now(),
                pointsAwarded: 150,
                breakdown: { base: 100, speedBonus: 50, streakBonus: 0, specialBonus: 0 },
                rawComment: '!jawab separuh aku noah'
              },
              revealedWithoutWinner: false,
              startedAt: Date.now() - 30000,
              endedAt: Date.now()
            };
            return <StageWinner round={displayRound} />;
          }

          if (currentStage === 'CHAMPION') {
            return (
              <StageChampion
                leaderboard={activeLeaderboard}
                championRewards={gameState.championRewards}
              />
            );
          }

          return <StageIdle />;
        })()}
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

