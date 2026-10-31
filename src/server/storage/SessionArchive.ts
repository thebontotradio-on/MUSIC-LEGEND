import { AppDatabase } from './Database.js';
import { SessionArchiveSummary, SafeZoneConfig, RoundResult, Player } from '../types.js';

export class SessionArchiveService {
  private db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  /**
   * Saves or updates a completed session in SQLite
   */
  public saveSessionArchive(summary: SessionArchiveSummary): void {
    const rawDb = this.db.getRawDb();

    const stmt = rawDb.prepare(`
      INSERT INTO sessions (
        id, session_code, started_at, ended_at, total_rounds,
        total_participants, champion_nickname, champion_total_vp, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        ended_at = excluded.ended_at,
        total_rounds = excluded.total_rounds,
        total_participants = excluded.total_participants,
        champion_nickname = excluded.champion_nickname,
        champion_total_vp = excluded.champion_total_vp,
        data_json = excluded.data_json
    `);

    stmt.run(
      summary.id,
      summary.sessionCode,
      summary.startedAt,
      summary.endedAt,
      summary.totalRounds,
      summary.totalParticipants,
      summary.champion?.nickname || null,
      summary.champion?.totalVP || 0,
      JSON.stringify(summary)
    );

    // Save rounds into round_history
    const roundStmt = rawDb.prepare(`
      INSERT OR REPLACE INTO round_history (
        id, session_id, round_number, question_id, question_prompt,
        expected_title, expected_artist, winner_id, winner_nickname,
        points_awarded, started_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of summary.rounds) {
      const roundId = `${summary.id}_R${r.roundNumber}`;
      roundStmt.run(
        roundId,
        summary.id,
        r.roundNumber,
        r.question.id,
        r.question.prompt,
        r.question.expectedTitle,
        r.question.expectedArtist,
        r.winner?.player.id || null,
        r.winner?.player.nickname || null,
        r.winner?.pointsAwarded || 0,
        r.startedAt,
        r.endedAt || Date.now()
      );
    }
  }

  /**
   * Retrieves list of all archived sessions (ordered by most recent)
   */
  public getAllSessions(): SessionArchiveSummary[] {
    const rawDb = this.db.getRawDb();
    const rows = rawDb.prepare(`
      SELECT data_json FROM sessions ORDER BY started_at DESC
    `).all() as { data_json: string }[];

    return rows.map(r => JSON.parse(r.data_json) as SessionArchiveSummary);
  }

  /**
   * Retrieves single session archive by ID
   */
  public getSessionById(sessionId: string): SessionArchiveSummary | null {
    const rawDb = this.db.getRawDb();
    const row = rawDb.prepare(`
      SELECT data_json FROM sessions WHERE id = ?
    `).get(sessionId) as { data_json: string } | undefined;

    if (!row) return null;
    return JSON.parse(row.data_json) as SessionArchiveSummary;
  }

  /**
   * SafeZone config persistence
   */
  public saveSafeZoneConfig(config: SafeZoneConfig): void {
    const rawDb = this.db.getRawDb();
    const stmt = rawDb.prepare(`
      INSERT INTO config_settings (key, value, updated_at)
      VALUES ('safe_zone', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(JSON.stringify(config), Date.now());
  }

  public getSafeZoneConfig(): SafeZoneConfig | null {
    const rawDb = this.db.getRawDb();
    const row = rawDb.prepare(`
      SELECT value FROM config_settings WHERE key = 'safe_zone'
    `).get() as { value: string } | undefined;

    if (!row) return null;
    try {
      return JSON.parse(row.value) as SafeZoneConfig;
    } catch {
      return null;
    }
  }
}

