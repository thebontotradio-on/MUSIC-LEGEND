import {
  GameState,
  StageType,
  SessionState,
  SafeZoneConfig,
  Player,
  RoundResult,
  SessionArchiveSummary,
  ChampionRewardRecord
} from '../types.js';
import { RoundManager } from './RoundManager.js';
import { SessionManager } from './SessionManager.js';
import { AnswerValidator } from './AnswerValidator.js';
import { ScoringEngine } from './ScoringEngine.js';
import { Tap2Aggregator, Tap2Event } from './Tap2Aggregator.js';
import { PlayerIdentityManager } from './PlayerIdentity.js';
import { IPlaybackBridge } from '../adapters/IPlaybackBridge.js';
import { ITikTokConnector, CommentEvent } from '../adapters/ITikTokConnector.js';
import { SessionArchiveService } from '../storage/SessionArchive.js';

export type StateListener = (state: GameState) => void;

export class GameEngine {
  private roundManager: RoundManager;
  private sessionManager: SessionManager;
  private tap2Aggregator: Tap2Aggregator;
  private playerManager: PlayerIdentityManager;
  private playbackBridge: IPlaybackBridge;
  private tiktokConnector: ITikTokConnector;
  private archiveService: SessionArchiveService;

  private stage: StageType = 'IDLE';
  private safeZone: SafeZoneConfig;
  private bgmPlaying: boolean = true;
  private bgmVolume: number = 0.6;
  private listeners: StateListener[] = [];
  private lastAnnouncement?: string;

  constructor(
    roundManager: RoundManager,
    sessionManager: SessionManager,
    tap2Aggregator: Tap2Aggregator,
    playerManager: PlayerIdentityManager,
    playbackBridge: IPlaybackBridge,
    tiktokConnector: ITikTokConnector,
    archiveService: SessionArchiveService
  ) {
    this.roundManager = roundManager;
    this.sessionManager = sessionManager;
    this.tap2Aggregator = tap2Aggregator;
    this.playerManager = playerManager;
    this.playbackBridge = playbackBridge;
    this.tiktokConnector = tiktokConnector;
    this.archiveService = archiveService;

    // Load persisted safe zone or default
    this.safeZone = this.archiveService.getSafeZoneConfig() || {
      x: 5,
      y: 8,
      width: 90,
      height: 52,
      margin: 24,
      chatExclusionHeight: 38
    };

    // Attach listeners to TikTok connector
    this.tiktokConnector.onComment((comment) => this.handleComment(comment));
    this.tiktokConnector.onLike((like) => this.handleLike(like));
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error notifying game state listener:', err);
      }
    }
  }

  public getState(): GameState {
    const playersList = this.playerManager.getAllPlayers();
    const sortedLeaderboard = ScoringEngine.sortLeaderboard(playersList);
    const playersMap: Record<string, Player> = {};
    for (const p of playersList) {
      playersMap[p.id] = p;
    }

    return {
      stage: this.stage,
      sessionState: this.sessionManager.getState(),
      sessionId: this.sessionManager.getSessionId(),
      roundNumber: this.roundManager.getRoundNumber(),
      currentQuestion: this.roundManager.getCurrentQuestion(),
      currentRound: this.roundManager.getCurrentRound(),
      isQuestionLocked: this.roundManager.isQuestionLocked(),
      players: playersMap,
      leaderboard: sortedLeaderboard,
      top3Champions: this.sessionManager.getChampionRewards(),
      championRewards: this.sessionManager.getChampionRewards(),
      podiumVisible: this.stage === 'CHAMPION',
      safeZone: this.safeZone,
      audio: {
        bgmPlaying: this.bgmPlaying,
        bgmVolume: this.bgmVolume
      },
      playbackStatus: this.playbackBridge.getStatus(),
      tiktokStatus: this.tiktokConnector.getStatus(),
      announcement: this.lastAnnouncement
    };
  }

  // --- HOST CONTROLS ---

  public startGame(): void {
    this.playerManager.reset();
    this.tap2Aggregator.reset();
    this.roundManager.reset();
    this.sessionManager.startNewSession();
    this.stage = 'IDLE';
    this.bgmPlaying = true;
    this.lastAnnouncement = 'Game Session Baru Dimulai!';
    this.notify();
  }

  public startRound(specificQuestionId?: string): RoundResult {
    if (!this.sessionManager.isSessionActive()) {
      this.startGame();
    }

    const round = this.roundManager.startNewRound(specificQuestionId, false);
    this.stage = 'GUESSING';
    this.bgmPlaying = true;
    this.lastAnnouncement = `Round #${round.roundNumber}: ${round.question.prompt}`;
    this.notify();
    return round;
  }

  public startBonusRound(specificQuestionId?: string): RoundResult {
    if (!this.sessionManager.isSessionActive()) {
      this.startGame();
    }

    const round = this.roundManager.startNewRound(specificQuestionId, true);
    this.stage = 'GUESSING';
    this.bgmPlaying = true;
    this.lastAnnouncement = `⭐ BONUS ROUND #${round.roundNumber}!`;
    this.notify();
    return round;
  }

  /**
   * Manual Host NEXT control:
   * Moves from WINNER or GUESSING stage to IDLE stage, resumes BGM.
   * Host is in full manual control without automatic timer rushing.
   */
  public next(): void {
    const currentRound = this.roundManager.getCurrentRound();
    if (currentRound) {
      this.sessionManager.recordCompletedRound(currentRound);
    }
    this.roundManager.endRound();
    this.stage = 'IDLE';
    this.bgmPlaying = true;
    this.lastAnnouncement = 'Host siap melanjutkan ke soal berikutnya.';
    this.notify();
  }

  public skip(): void {
    const currentRound = this.roundManager.getCurrentRound();
    if (currentRound) {
      this.roundManager.revealAnswer();
      this.sessionManager.recordCompletedRound(currentRound);
    }
    this.stage = 'IDLE';
    this.bgmPlaying = true;
    this.lastAnnouncement = 'Soal dilewati oleh Host.';
    this.notify();
  }

  public revealAnswer(): void {
    if (this.stage === 'GUESSING' && !this.roundManager.isQuestionLocked()) {
      this.roundManager.revealAnswer();
      this.lastAnnouncement = `Jawaban dibuka: ${this.roundManager.getCurrentQuestion()?.expectedTitle} - ${this.roundManager.getCurrentQuestion()?.expectedArtist}`;
      this.notify();
    }
  }

  public pauseSession(): void {
    this.sessionManager.pauseSession();
    this.bgmPlaying = false;
    this.lastAnnouncement = 'Sesi Live Dijeda.';
    this.notify();
  }

  public resumeSession(): void {
    this.sessionManager.resumeSession();
    this.bgmPlaying = true;
    this.lastAnnouncement = 'Sesi Live Dilanjutkan.';
    this.notify();
  }

  public finalShow(): void {
    this.stage = 'CHAMPION';
    this.bgmPlaying = true;
    this.lastAnnouncement = '👑 FINAL SHOW — PODIUM JUARA TOP 3!';
    this.notify();
  }

  public showPodium(): void {
    this.stage = 'CHAMPION';
    this.bgmPlaying = true;
    this.lastAnnouncement = '👑 PODIUM JUARA TOP 3 DITAMPILKAN!';
    this.notify();
  }

  public hidePodium(): void {
    this.stage = 'IDLE';
    this.lastAnnouncement = 'Podium juara ditutup, kembali ke mode standby.';
    this.notify();
  }

  public repeatChampionAnnouncement(): void {
    const rewards = this.sessionManager.getChampionRewards();
    if (rewards.length > 0) {
      const names = rewards.map(r => `Juara ${r.rank}: @${r.nickname}`).join(', ');
      this.lastAnnouncement = `🏆 SELAMAT KEPADA PARA JUARA! ${names}. Masing-masing mendapatkan 1 FREE REQUEST SONG!`;
    } else {
      this.lastAnnouncement = '👑 PENGUMUMAN JUARA MUSIC LEGEND LIVE!';
    }
    this.notify();
  }

  public redeemChampionReward(
    userIdOrId: string,
    requestedSong?: string,
    notes?: string
  ): { success: boolean; message: string; record?: ChampionRewardRecord } {
    const res = this.sessionManager.redeemChampionReward(userIdOrId, requestedSong, notes);
    if (res.success && res.record) {
      this.lastAnnouncement = `🎁 HADIAH DIGUNAKAN: @${res.record.nickname} menukarkan 1 Free Request Song (${res.record.requestedSong || 'Lagu Pilihan'})!`;
    }
    this.notify();
    return res;
  }

  public getChampionRewards(): ChampionRewardRecord[] {
    return this.sessionManager.getChampionRewards();
  }

  public endSession(): SessionArchiveSummary {
    const currentRound = this.roundManager.getCurrentRound();
    if (currentRound) {
      const alreadyRecorded = this.sessionManager.getCompletedRounds().some(
        r => r.roundNumber === currentRound.roundNumber
      );
      if (!alreadyRecorded) {
        this.sessionManager.recordCompletedRound(currentRound);
      }
    }

    const summary = this.sessionManager.endSession(this.playerManager.getAllPlayers());
    this.stage = 'CHAMPION';
    this.bgmPlaying = false;
    this.lastAnnouncement = 'Sesi Telah Berakhir & Diarsipkan. Hadiah 1 Free Request Song aktif untuk Top 3 Juara!';
    this.notify();
    return summary;
  }

  public setAudioControl(playing?: boolean, volume?: number): void {
    if (typeof playing === 'boolean') {
      this.bgmPlaying = playing;
    }
    if (typeof volume === 'number') {
      this.bgmVolume = Math.max(0, Math.min(1, volume));
    }
    this.notify();
  }

  public updateSafeZone(config: Partial<SafeZoneConfig>): void {
    this.safeZone = { ...this.safeZone, ...config };
    this.archiveService.saveSafeZoneConfig(this.safeZone);
    this.notify();
  }

  // --- EVENT INGESTION ---

  public handleComment(comment: CommentEvent): void {
    // Only process quiz answers during ACTIVE session and GUESSING stage
    if (!this.sessionManager.isSessionActive() || this.stage !== 'GUESSING') {
      return;
    }

    // If question is already locked by a winner, ignore subsequent answers
    if (this.roundManager.isQuestionLocked()) {
      return;
    }

    const currentQuestion = this.roundManager.getCurrentQuestion();
    if (!currentQuestion) return;

    // Validate comment with AnswerValidator
    const validation = AnswerValidator.validate(comment.text, currentQuestion);
    if (!validation.isCorrect) {
      return; // Invalid or wrong answer
    }

    // Retrieve or register player
    const player = this.playerManager.getOrCreate(
      comment.userId,
      comment.nickname,
      comment.avatarUrl
    );

    // Calculate score & bonuses (speed bonus + streak bonus)
    const scoringResult = ScoringEngine.calculateQuizPoints(
      currentQuestion,
      player.streak,
      true
    );

    // ATOMIC LOCK: Try locking the winner for this round
    const lockSuccess = this.roundManager.lockWinner({
      player,
      pointsAwarded: scoringResult.totalPointsAwarded,
      breakdown: {
        base: scoringResult.basePoints,
        speedBonus: scoringResult.speedBonus,
        streakBonus: scoringResult.streakBonus,
        specialBonus: scoringResult.specialBonus
      },
      rawComment: comment.text,
      answeredAt: comment.timestamp
    });

    if (!lockSuccess) {
      // Race condition lost: Another correct answer was processed microseconds earlier!
      return;
    }

    // Award points to player and update streaks
    this.playerManager.awardQuizWin(
      player.id,
      scoringResult.totalPointsAwarded,
      comment.timestamp
    );

    // Audio system: Pause BGM when answer is won
    this.bgmPlaying = false;

    // Switch stage to WINNER
    this.stage = 'WINNER';
    this.lastAnnouncement = `🎉 ${player.nickname} MENANG! (+${scoringResult.totalPointsAwarded} VP)`;

    // PHASE 4 REQUIREMENT B: Decouple playback per round winner
    // Answering correctly adds score without triggering playback of answer song.
    // Normal viewer song requests and radio playback continue undisturbed.

    this.notify();
  }

  public handleLike(like: Tap2Event): void {
    const delta = this.tap2Aggregator.processTap(like, this.sessionManager.isSessionActive());
    if (delta > 0) {
      this.playerManager.addTap2(
        like.userId,
        like.nickname,
        delta,
        like.avatarUrl
      );
      this.notify();
    }
  }

  public getArchiveService(): SessionArchiveService {
    return this.archiveService;
  }

  public getPlaybackBridge(): IPlaybackBridge {
    return this.playbackBridge;
  }

  public getTikTokConnector(): ITikTokConnector {
    return this.tiktokConnector;
  }
}
