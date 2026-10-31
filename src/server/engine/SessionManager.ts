import { SessionState, SessionArchiveSummary, Player, RoundResult, ChampionRewardRecord } from '../types.js';
import { SessionArchiveService } from '../storage/SessionArchive.js';
import { ScoringEngine } from './ScoringEngine.js';

export class SessionManager {
  private currentState: SessionState = 'IDLE';
  private currentSessionId: string = '';
  private currentSessionCode: string = '';
  private startedAt: number = 0;
  private endedAt: number = 0;
  private completedRounds: RoundResult[] = [];
  private currentSessionRewards: ChampionRewardRecord[] = [];
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
    this.currentSessionRewards = [];
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

  public getChampionRewards(): ChampionRewardRecord[] {
    return [...this.currentSessionRewards];
  }

  /**
   * Redeems 1 Free Request Song for an eligible Top 3 champion
   */
  public redeemChampionReward(
    userIdOrRewardId: string,
    requestedSong?: string,
    notes?: string
  ): { success: boolean; message: string; record?: ChampionRewardRecord } {
    const target = this.currentSessionRewards.find(
      (r) => r.userId === userIdOrRewardId || r.id === userIdOrRewardId
    );

    if (!target) {
      return {
        success: false,
        message: 'Peserta bukan pemenang Top 3 dalam sesi ini.'
      };
    }

    if (target.status === 'REDEEMED') {
      return {
        success: false,
        message: `Hadiah Free Request untuk @${target.nickname} sudah pernah digunakan (Maksimal 1 lagu per akun per sesi).`
      };
    }

    // Check if another entry for this user was already redeemed (prevent double reward for same user)
    const alreadyRedeemed = this.currentSessionRewards.some(
      (r) => r.userId === target.userId && r.status === 'REDEEMED'
    );
    if (alreadyRedeemed) {
      return {
        success: false,
        message: `Akun @${target.nickname} sudah pernah menukarkan hadiah dalam sesi ini.`
      };
    }

    target.status = 'REDEEMED';
    target.redeemedAt = Date.now();
    if (requestedSong) target.requestedSong = requestedSong.trim();
    if (notes) target.notes = notes.trim();

    // Persist update in SQLite archive
    this.archiveService.updateSessionRewards(this.currentSessionId, this.currentSessionRewards);

    return {
      success: true,
      message: `Hadiah Free Request untuk @${target.nickname} (Juara ${target.rank}) berhasil ditandai sebagai DIGUNAKAN.`,
      record: { ...target }
    };
  }

  /**
   * Ends session, locks final Top 3, awards 1 Free Request Song per champion, saves archive to SQLite
   */
  public endSession(players: Player[]): SessionArchiveSummary {
    this.currentState = 'ENDED';
    this.endedAt = Date.now();

    const sortedPlayers = ScoringEngine.sortLeaderboard(players);
    const top3 = sortedPlayers.slice(0, 3);
    const championRewards: ChampionRewardRecord[] = top3.map((player, idx) => ({
      id: `rew_${this.currentSessionId}_rank${idx + 1}`,
      sessionId: this.currentSessionId,
      rank: (idx + 1) as 1 | 2 | 3,
      userId: player.id,
      nickname: player.nickname,
      totalVP: player.totalVP,
      rewardTitle: '1 Free Request Song',
      status: 'ELIGIBLE' as const,
      awardedAt: Date.now()
    }));
    this.currentSessionRewards = championRewards;

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
      top3Champions: championRewards,
      championRewards: championRewards,
      players: sortedPlayers,
      rounds: this.completedRounds
    };

    // Save into SQLite
    this.archiveService.saveSessionArchive(summary);

    return summary;
  }
}

