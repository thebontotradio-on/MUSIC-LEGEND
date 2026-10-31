import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

import { AppDatabase } from '../src/server/storage/Database.js';
import { SessionArchiveService } from '../src/server/storage/SessionArchive.js';
import { RoundManager } from '../src/server/engine/RoundManager.js';
import { SessionManager } from '../src/server/engine/SessionManager.js';
import { Tap2Aggregator } from '../src/server/engine/Tap2Aggregator.js';
import { PlayerIdentityManager } from '../src/server/engine/PlayerIdentity.js';
import { MockPlaybackBridge } from '../src/server/adapters/MockPlaybackBridge.js';
import { MockTikTokConnector } from '../src/server/adapters/MockTikTokConnector.js';
import { GameEngine } from '../src/server/engine/GameEngine.js';
import { QUESTION_CATALOG } from '../src/server/catalog/questions.js';

function setupRegressionEngine(dbName: string) {
  const dbPath = path.resolve(process.cwd(), 'data', dbName);
  if (fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch {}
  }
  const db = new AppDatabase(dbPath);
  const archive = new SessionArchiveService(db);
  const roundMgr = new RoundManager(QUESTION_CATALOG);
  const sessionMgr = new SessionManager(archive);
  const tap2Agg = new Tap2Aggregator();
  const playerMgr = new PlayerIdentityManager();
  const mockPlayback = new MockPlaybackBridge();
  const mockTikTok = new MockTikTokConnector();

  const engine = new GameEngine(
    roundMgr,
    sessionMgr,
    tap2Agg,
    playerMgr,
    mockPlayback,
    mockTikTok,
    archive
  );

  return { db, archive, roundMgr, sessionMgr, tap2Agg, playerMgr, mockPlayback, mockTikTok, engine };
}

// ----------------------------------------------------
// REGRESSION TEST 1 & 2:
// Komentar benar dan Tap2 dari userId sama menghasilkan SATU peserta
// dengan Quiz Points dan Tap2 Points terakumulasi dengan benar (150 + 1 = 151 VP)
// ----------------------------------------------------
test('REGRESSION 1 & 2: Komentar benar dan Tap2 dari userId sama menghasilkan SATU peserta dan skor terakumulasi benar', () => {
  const { engine } = setupRegressionEngine('reg_single_player.db');
  engine.startGame();
  engine.startRound('Q001'); // Separuh Aku - Noah (100 base + 50 speed bonus = 150 VP)

  const USER_ID = 'tiktok_uid_9988';
  const NICKNAME = 'Bontoters_Jawara';

  // 1. Submit winning comment
  engine.handleComment({
    userId: USER_ID,
    nickname: NICKNAME,
    text: '!jawab separuh aku noah',
    timestamp: Date.now()
  });

  // 2. Submit 100 Tap2 likes
  engine.handleLike({
    eventId: 'like_ev_1',
    userId: USER_ID,
    nickname: NICKNAME,
    likeCount: 100,
    timestamp: Date.now()
  });

  const state = engine.getState();
  const players = Object.values(state.players);

  // MUST BE EXACTLY ONE PLAYER RECORD
  assert.strictEqual(players.length, 1, 'Hanya boleh ada 1 pemain terdaftar untuk userId yang sama');
  assert.strictEqual(state.leaderboard.length, 1, 'Leaderboard hanya boleh menampilkan 1 baris');

  const p = players[0];
  assert.strictEqual(p.id, USER_ID);
  assert.strictEqual(p.nickname, NICKNAME);
  assert.strictEqual(p.quizPoints, 150, 'Quiz Points harus 150');
  assert.strictEqual(p.rawTap2, 100, 'Raw Tap2 harus 100');
  assert.strictEqual(p.tap2Points, 1, 'Tap2 Points harus 1');
  assert.strictEqual(p.totalVP, 151, 'Total VP harus 150 + 1 = 151 VP');
  assert.strictEqual(p.wins, 1);
});

// ----------------------------------------------------
// REGRESSION TEST 3:
// Nickname sama tetapi userId berbeda menghasilkan DUA peserta (tidak tertukar)
// ----------------------------------------------------
test('REGRESSION 3: Nickname sama tetapi userId berbeda menghasilkan DUA peserta terpisah', () => {
  const { engine } = setupRegressionEngine('reg_same_nickname.db');
  engine.startGame();

  // User A with nickname "Budi" sends 200 likes
  engine.handleLike({
    userId: 'user_A',
    nickname: 'Budi',
    likeCount: 200,
    timestamp: Date.now()
  });

  // User B with the SAME nickname "Budi" sends 300 likes
  engine.handleLike({
    userId: 'user_B',
    nickname: 'Budi',
    likeCount: 300,
    timestamp: Date.now()
  });

  const state = engine.getState();
  const players = Object.values(state.players);

  assert.strictEqual(players.length, 2, 'Dua userId berbeda dengan nickname sama harus menghasilkan 2 pemain');
  assert.strictEqual(state.players['user_A'].rawTap2, 200);
  assert.strictEqual(state.players['user_A'].tap2Points, 2);
  assert.strictEqual(state.players['user_B'].rawTap2, 300);
  assert.strictEqual(state.players['user_B'].tap2Points, 3);
});

// ----------------------------------------------------
// REGRESSION TEST 4:
// Nickname berubah tetapi userId tetap sama tidak membuat peserta baru
// ----------------------------------------------------
test('REGRESSION 4: Nickname berubah tetapi userId tetap sama tidak membuat peserta baru', () => {
  const { engine } = setupRegressionEngine('reg_rename_user.db');
  engine.startGame();
  engine.startRound('Q001');

  const USER_ID = 'user_dynamic';

  // 1. Answer with initial nickname "Bontoter_Lama"
  engine.handleComment({
    userId: USER_ID,
    nickname: 'Bontoter_Lama',
    text: '!jawab separuh aku noah',
    timestamp: Date.now()
  });

  assert.strictEqual(engine.getState().players[USER_ID].nickname, 'Bontoter_Lama');
  assert.strictEqual(engine.getState().players[USER_ID].quizPoints, 150);

  // 2. User taps screen with NEW nickname "Bontoter_Sultan"
  engine.handleLike({
    userId: USER_ID,
    nickname: 'Bontoter_Sultan',
    likeCount: 200,
    timestamp: Date.now()
  });

  const state = engine.getState();
  const players = Object.values(state.players);

  assert.strictEqual(players.length, 1, 'Tidak boleh membuat peserta baru ketika nickname berubah');
  assert.strictEqual(players[0].id, USER_ID);
  assert.strictEqual(players[0].nickname, 'Bontoter_Sultan', 'Nickname harus diperbarui ke nama baru');
  assert.strictEqual(players[0].quizPoints, 150, 'Poin kuis sebelumnya tidak boleh hilang');
  assert.strictEqual(players[0].rawTap2, 200);
  assert.strictEqual(players[0].totalVP, 152); // 150 + 2 = 152
});

// ----------------------------------------------------
// REGRESSION TEST 5:
// Event Tap2 duplikat tidak menambah poin
// ----------------------------------------------------
test('REGRESSION 5: Event Tap2 duplikat (eventId sama atau like kumulatif tidak bertambah) tidak menambah poin', () => {
  const { engine } = setupRegressionEngine('reg_tap2_dedup.db');
  engine.startGame();

  const USER_ID = 'tapper_dedup';

  // First tap event with eventId
  engine.handleLike({
    eventId: 'DUP_EVENT_99',
    userId: USER_ID,
    nickname: 'Tapper',
    likeCount: 100,
    timestamp: Date.now()
  });

  assert.strictEqual(engine.getState().players[USER_ID].rawTap2, 100);

  // Duplicate event with same eventId
  engine.handleLike({
    eventId: 'DUP_EVENT_99',
    userId: USER_ID,
    nickname: 'Tapper',
    likeCount: 100,
    timestamp: Date.now()
  });

  assert.strictEqual(engine.getState().players[USER_ID].rawTap2, 100, 'Duplicate eventId harus diabaikan');

  // Cumulative test: 300 cumulative likes
  engine.handleLike({
    userId: USER_ID,
    nickname: 'Tapper',
    likeCount: 300,
    isCumulative: true,
    timestamp: Date.now()
  });

  assert.strictEqual(engine.getState().players[USER_ID].rawTap2, 300);

  // Same cumulative count repeated (no new likes)
  engine.handleLike({
    userId: USER_ID,
    nickname: 'Tapper',
    likeCount: 300,
    isCumulative: true,
    timestamp: Date.now()
  });

  assert.strictEqual(engine.getState().players[USER_ID].rawTap2, 300, 'Stale cumulative likes tidak boleh menambah poin');
});

// ----------------------------------------------------
// REGRESSION TEST 6:
// Beberapa event komentar dan Tap2 tetap memperbarui peserta yang sama
// ----------------------------------------------------
test('REGRESSION 6: Multi-round komentar dan multi-event Tap2 tetap memperbarui satu peserta yang sama', () => {
  const { engine } = setupRegressionEngine('reg_multiround.db');
  engine.startGame();

  const USER_ID = 'legend_player';
  const NICK = 'Sang Juara';

  // Round 1
  engine.startRound('Q001'); // 150 VP
  engine.handleComment({
    userId: USER_ID,
    nickname: NICK,
    text: '!jawab separuh aku noah',
    timestamp: Date.now()
  });
  engine.next();

  // Tap2 batch 1: 150 likes
  engine.handleLike({ userId: USER_ID, nickname: NICK, likeCount: 150, timestamp: Date.now() });

  // Round 2
  engine.startRound('Q002'); // Dan - Sheila on 7 (100 base + 50 speed = 150 VP)
  engine.handleComment({
    userId: USER_ID,
    nickname: NICK,
    text: '!jawab dan sheila on 7',
    timestamp: Date.now()
  });
  engine.next();

  // Tap2 batch 2: 250 likes (total raw tap2 = 400 -> 4 VP)
  engine.handleLike({ userId: USER_ID, nickname: NICK, likeCount: 250, timestamp: Date.now() });

  const state = engine.getState();
  const player = state.players[USER_ID];

  assert.strictEqual(Object.keys(state.players).length, 1);
  assert.strictEqual(player.wins, 2);
  assert.strictEqual(player.streak, 2);
  assert.strictEqual(player.quizPoints, 300); // 150 + 150
  assert.strictEqual(player.rawTap2, 400);
  assert.strictEqual(player.tap2Points, 4);
  assert.strictEqual(player.totalVP, 304); // 300 + 4
});

// ----------------------------------------------------
// REGRESSION TEST 7:
// Leaderboard menampilkan hasil gabungan yang benar
// ----------------------------------------------------
test('REGRESSION 7: Leaderboard menampilkan hasil gabungan yang benar dan terurut sesuai tie-breaker', () => {
  const { engine } = setupRegressionEngine('reg_leaderboard.db');
  engine.startGame();

  // Player 1: answers question (150 VP) and taps 100 (1 VP) -> Total 151 VP
  engine.startRound('Q001');
  engine.handleComment({ userId: 'p1', nickname: 'Bontoters_Jawara', text: '!jawab separuh aku noah', timestamp: Date.now() });
  engine.handleLike({ userId: 'p1', nickname: 'Bontoters_Jawara', likeCount: 100, timestamp: Date.now() });
  engine.next();

  // Player 2: only taps 1500 times -> 15 VP
  engine.handleLike({ userId: 'p2', nickname: 'Bontoter_Tapper', likeCount: 1500, timestamp: Date.now() });

  const state = engine.getState();
  assert.strictEqual(state.leaderboard.length, 2);

  // Rank 1: p1
  assert.strictEqual(state.leaderboard[0].id, 'p1');
  assert.strictEqual(state.leaderboard[0].totalVP, 151);
  assert.strictEqual(state.leaderboard[0].quizPoints, 150);
  assert.strictEqual(state.leaderboard[0].rawTap2, 100);
  assert.strictEqual(state.leaderboard[0].tap2Points, 1);

  // Rank 2: p2
  assert.strictEqual(state.leaderboard[1].id, 'p2');
  assert.strictEqual(state.leaderboard[1].totalVP, 15);
});

// ----------------------------------------------------
// REGRESSION TEST 8:
// Arsip sesi menyimpan hasil gabungan dengan benar
// ----------------------------------------------------
test('REGRESSION 8: Arsip sesi menyimpan hasil gabungan yang benar ke SQLite', () => {
  const { engine, archive } = setupRegressionEngine('reg_archive.db');
  engine.startGame();

  engine.startRound('Q001');
  engine.handleComment({ userId: 'champ_uid', nickname: 'Bontoters_Jawara', text: '!jawab separuh aku noah', timestamp: Date.now() });
  engine.handleLike({ userId: 'champ_uid', nickname: 'Bontoters_Jawara', likeCount: 200, timestamp: Date.now() });
  engine.next();

  const summary = engine.endSession();

  assert.strictEqual(summary.totalParticipants, 1);
  assert.strictEqual(summary.champion?.nickname, 'Bontoters_Jawara');
  assert.strictEqual(summary.champion?.totalVP, 152); // 150 quiz + 2 tap2
  assert.strictEqual(summary.champion?.quizPoints, 150);
  assert.strictEqual(summary.champion?.tap2Points, 2);

  // Verify reload from SQLite database
  const loadedArchive = archive.getSessionById(summary.id);
  assert.ok(loadedArchive);
  assert.strictEqual(loadedArchive.totalParticipants, 1);
  assert.strictEqual(loadedArchive.players.length, 1);
  assert.strictEqual(loadedArchive.players[0].id, 'champ_uid');
  assert.strictEqual(loadedArchive.players[0].totalVP, 152);
});

// ----------------------------------------------------
// REGRESSION TEST 9:
// Sesi LIVE baru tetap dimulai dari nol
// ----------------------------------------------------
test('REGRESSION 9: Sesi LIVE baru tetap dimulai dari nol tanpa membawa poin dari sesi lama', () => {
  const { engine } = setupRegressionEngine('reg_reset_clean.db');
  engine.startGame();

  engine.handleLike({ userId: 'p_test', nickname: 'Tester', likeCount: 1000, timestamp: Date.now() });
  assert.strictEqual(engine.getState().players['p_test'].totalVP, 10);

  // Start fresh session
  engine.startGame();
  const freshState = engine.getState();

  assert.strictEqual(Object.keys(freshState.players).length, 0);
  assert.strictEqual(freshState.leaderboard.length, 0);
  assert.strictEqual(freshState.roundNumber, 0);
});

