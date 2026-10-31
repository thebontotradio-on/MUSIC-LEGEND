import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export class AppDatabase {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const finalPath = dbPath || path.resolve(process.cwd(), 'data', 'music_legend.db');
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(finalPath);
    this.initTables();
  }

  private initTables(): void {
    // Sessions archive table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_code TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        total_rounds INTEGER DEFAULT 0,
        total_participants INTEGER DEFAULT 0,
        champion_nickname TEXT,
        champion_total_vp INTEGER,
        data_json TEXT
      );
    `);

    // Individual rounds archive table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS round_history (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        question_id TEXT,
        question_prompt TEXT,
        expected_title TEXT,
        expected_artist TEXT,
        winner_id TEXT,
        winner_nickname TEXT,
        points_awarded INTEGER,
        started_at INTEGER,
        ended_at INTEGER,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `);

    // Configuration / settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  public getRawDb(): DatabaseSync {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}

