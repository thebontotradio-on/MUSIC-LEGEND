import { SessionState, SessionArchiveSummary, Player, RoundResult } from '../types.js';
import { SessionArchiveService } from '../storage/SessionArchive.js';
import { ScoringEngine } from './ScoringEngine.js';

export class SessionManager {
  private currentState: SessionState = 'IDLE';
  private currentSessionId: string = '';
  private currentSessionCode: string = '';
  private startedAt: number = 0;
  private endedAt: number = 0;
  private completedRounds: RoundResult[] = [];
  private archiveService: SessionArchiveService;

  constructor(archiveService: SessionArchiveService) {
    this.archiveService = archiveService;
  }

  public getState(): SessionState {
    return this.currentState;
  }

  public getSessionId(): string {
    return this.currentSessionId;
  }

  public getSessionCode(): string {
    return this.currentSessionCode;
  }

  public isSessionActive(): boolean {
    return this.currentState === 'ACTIVE';
  }

  /**
   * Starts a fresh session. Scores start strictly from 0.
   */
  public startNewSession(): { sessionId: string; sessionCode: string } {
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    this.currentSessionId = `sess_${timestamp}_${randSuffix}`;
    this.currentSessionCode = `LIVE-${dateStr}-${randSuffix}`;
    this.startedAt = timestamp;
    this.endedAt = 0;
    this.completedRounds = [];
    this.currentState = 'ACTIVE';

    return {
      sessionId: this.currentSessionId,
      sessionCode: this.currentSessionCode
    };
  }

  public pauseSession(): void {
    if (this.currentState === 'ACTIVE') {
      this.currentState = 'PAUSED';
    }
  }

  public resumeSession(): void {
    if (this.currentState === 'PAUSED') {
      this.currentState = 'ACTIVE';
    }
  }

  public recordCompletedRound(round: RoundResult): void {
    this.completedRounds.push(round);
  }

  public getCompletedRounds(): RoundResult[] {
    return [...this.completedRounds];
  }

  /**
   * Ends session, saves archive to SQLite database, and returns summary
   */
  public endSession(players: Player[]): SessionArchiveSummary {
    this.currentState = 'ENDED';
    this.endedAt = Date.now();

    const sortedPlayers = ScoringEngine.sortLeaderboard(players);
    const champion = sortedPlayers.length > 0 ? {
      nickname: sortedPlayers[0].nickname,
      totalVP: sortedPlayers[0].totalVP,
      quizPoints: sortedPlayers[0].quizPoints,
      tap2Points: sortedPlayers[0].tap2Points
    } : null;

    const summary: SessionArchiveSummary = {
      id: this.currentSessionId,
      sessionCode: this.currentSessionCode,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      totalRounds: this.completedRounds.length,
      totalParticipants: sortedPlayers.length,
      champion,
      players: sortedPlayers,
      rounds: this.completedRounds
    };

    // Save into SQLite
    this.archiveService.saveSessionArchive(summary);

    return summary;
  }
}

