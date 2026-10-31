import { Player } from '../types.js';
import { ScoringEngine } from './ScoringEngine.js';

export class PlayerIdentityManager {
  // Primary index: userId -> Player
  private players: Map<string, Player> = new Map();

  /**
   * Resets all player scores for a brand new live session
   */
  public reset(): void {
    this.players.clear();
  }

  /**
   * Gets or creates a player in the active session.
   * `userId` is the sole immutable primary key.
   * If a player with this `userId` already exists, their nickname and avatar are updated if changed,
   * while preserving all accumulated quiz points, raw tap2, tap2 points, and streaks.
   */
  public getOrCreate(id: string, nickname: string, avatarUrl?: string): Player {
    const cleanId = (id || '').trim();
    if (!cleanId) {
      throw new Error('Player userId cannot be empty. userId must be provided as primary identity.');
    }

    const cleanNickname = (nickname || '').trim() || `Bontoter_${cleanId.slice(-4)}`;

    let player = this.players.get(cleanId);
    if (!player) {
      player = {
        id: cleanId,
        nickname: cleanNickname,
        avatarUrl: avatarUrl || this.generateDefaultAvatar(cleanNickname || cleanId),
        quizPoints: 0,
        rawTap2: 0,
        tap2Points: 0,
        totalVP: 0,
        wins: 0,
        streak: 0
      };
      this.players.set(cleanId, player);
    } else {
      // Update nickname if changed (handles user renaming their TikTok handle)
      if (cleanNickname && cleanNickname !== player.nickname) {
        player.nickname = cleanNickname;
      }
      // Update avatar if provided
      if (avatarUrl && avatarUrl !== player.avatarUrl) {
        player.avatarUrl = avatarUrl;
      }
    }
    return player;
  }

  /**
   * Awards quiz points and increments win count & streak for the specified userId
   */
  public awardQuizWin(id: string, pointsAwarded: number, timestamp: number): Player {
    const cleanId = (id || '').trim();
    const player = this.players.get(cleanId);
    if (!player) {
      throw new Error(`Player with userId '${cleanId}' not found in active session.`);
    }

    player.quizPoints += pointsAwarded;
    player.wins += 1;
    player.streak += 1;
    player.lastWinTimestamp = timestamp;

    // Recalculate combined total VP: Quiz Point + Tap2 Point
    const scored = ScoringEngine.calculateTotalVP(player.quizPoints, player.rawTap2);
    player.tap2Points = scored.tap2Points;
    player.totalVP = scored.totalVP;

    // Reset streaks of other players
    for (const [otherId, otherPlayer] of this.players.entries()) {
      if (otherId !== cleanId) {
        otherPlayer.streak = 0;
      }
    }

    return player;
  }

  /**
   * Adds raw tap2 count to a player by userId and recalculates tap2 points and total VP
   */
  public addTap2(id: string, nickname: string, tapDelta: number, avatarUrl?: string): Player {
    const cleanId = (id || '').trim();
    const player = this.getOrCreate(cleanId, nickname, avatarUrl);
    player.rawTap2 += tapDelta;

    // Recalculate combined total VP: Quiz Point + Tap2 Point
    const scored = ScoringEngine.calculateTotalVP(player.quizPoints, player.rawTap2);
    player.tap2Points = scored.tap2Points;
    player.totalVP = scored.totalVP;

    return player;
  }

  /**
   * Returns all unique players in the session (exactly one Player record per userId)
   */
  public getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Returns a player by userId
   */
  public getPlayer(id: string): Player | undefined {
    const cleanId = (id || '').trim();
    return this.players.get(cleanId);
  }

  /**
   * Generates a deterministic SVG data URI avatar if no TikTok profile picture is available
   */
  private generateDefaultAvatar(seed: string): string {
    const colors = ['#00F0FF', '#8A2BE2', '#FF007F', '#FFD700', '#00E676', '#FF9100'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    const initial = (seed[0] || 'B').toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#0a0a14" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#grad)" stroke="${color}" stroke-width="4"/>
      <text x="50%" y="54%" font-family="sans-serif" font-weight="900" font-size="40" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
