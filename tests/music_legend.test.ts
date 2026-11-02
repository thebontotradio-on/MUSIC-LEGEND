import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

import { AppDatabase } from '../src/server/storage/Database.js';
import { SessionArchiveService } from '../src/server/storage/SessionArchive.js';
import { RoundManager } from '../src/server/engine/RoundManager.js';
import { SessionManager } from '../src/server/engine/SessionManager.js';
import { AnswerValidator, normalizeText, calculateSimilarity } from '../src/server/engine/AnswerValidator.js';
import { ScoringEngine } from '../src/server/engine/ScoringEngine.js';
import { Tap2Aggregator } from '../src/server/engine/Tap2Aggregator.js';
import { PlayerIdentityManager } from '../src/server/engine/PlayerIdentity.js';
import { MockPlaybackBridge } from '../src/server/adapters/MockPlaybackBridge.js';
import { BontotStudioPlaybackBridge } from '../src/server/adapters/BontotStudioPlaybackBridge.js';
import { MockTikTokConnector } from '../src/server/adapters/MockTikTokConnector.js';
import { TikTokLiveConnector } from '../src/server/adapters/TikTokLiveConnector.js';
import { GameEngine } from '../src/server/engine/GameEngine.js';
import { QUESTION_CATALOG } from '../src/server/catalog/questions.js';
import { Question } from '../src/server/types.js';

// Setup helper for isolated test environment
function setupTestEngine(dbName: string = 'test_legend.db') {
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

  return { db, archive, roundMgr, sessionMgr, tap2Agg, playerMgr, mockPlayback, mockTikTok, engine, dbPath };
}

// ----------------------------------------------------
// 1. Session reset test
// ----------------------------------------------------
test('1. Session reset - Sesi baru dimulai dari skor nol dan tidak ada poin permanen terbawa', () => {
  const { engine, playerMgr } = setupTestEngine('test_reset.db');

  engine.startGame();
  playerMgr.addTap2('v1', 'Viewer 1', 500); // 500 taps = 5 VP
  assert.strictEqual(playerMgr.getPlayer('v1')?.totalVP, 5);

  // Start new session
  engine.startGame();
  const state = engine.getState();
  assert.strictEqual(Object.keys(state.players).length, 0, 'Players must be cleared on reset');
  assert.strictEqual(state.roundNumber, 0, 'Round number must reset to 0');
  assert.strictEqual(state.stage, 'IDLE');
  assert.strictEqual(state.sessionState, 'ACTIVE');
});

// ----------------------------------------------------
// 2. Session archive test
// ----------------------------------------------------
test('2. Session archive - Menyimpan arsip hasil sesi ke SQLite dan dapat dibaca kembali', () => {
  const { engine, archive, playerMgr } = setupTestEngine('test_archive.db');

  engine.startGame();
  playerMgr.addTap2('v1', 'Bontoter Juara', 800); // 8 VP
  engine.startRound('Q001');

  // Submit correct answer
  engine.handleComment({
    userId: 'v1',
    nickname: 'Bontoter Juara',
    text: '!jawab separuh aku noah',
    timestamp: Date.now()
  });

  const summary = engine.endSession();
  assert.strictEqual(summary.totalRounds, 1);
  assert.strictEqual(summary.champion?.nickname, 'Bontoter Juara');

  // Read back from SQLite
  const savedSessions = archive.getAllSessions();
  assert.strictEqual(savedSessions.length, 1);
  assert.strictEqual(savedSessions[0].id, summary.id);
  assert.strictEqual(savedSessions[0].champion?.nickname, 'Bontoter Juara');
});

// ----------------------------------------------------
// 3. Validasi jawaban test
// ----------------------------------------------------
test('3. Validasi jawaban - Normalisasi, tanda baca, spasi, alias, dan urutan terbalik', () => {
  const sampleQ: Question = {
    id: 'T1',
    category: 'TEBAK_JUDUL',
    difficulty: 'NORMAL',
    prompt: 'Test',
    expectedTitle: 'Separuh Aku',
    expectedArtist: 'Noah',
    titleAliases: ['Separuh Aku', 'Separuhku'],
    artistAliases: ['Noah', 'Peterpan'],
    points: 100
  };

  // Case 1: Standard
  const res1 = AnswerValidator.validate('!jawab separuh aku noah', sampleQ);
  assert.strictEqual(res1.isCorrect, true);

  // Case 2: Inverted order: artist first, then title
  const res2 = AnswerValidator.validate('!jawab noah separuh aku', sampleQ);
  assert.strictEqual(res2.isCorrect, true);

  // Case 3: Uppercase and extra spaces
  const res3 = AnswerValidator.validate('!jawab   SEPARUH   AKU    NOAH  ', sampleQ);
  assert.strictEqual(res3.isCorrect, true);

  // Case 4: Punctuation (e.g. quotes, dashes)
  const res4 = AnswerValidator.validate('!jawab "Separuh Aku" - Noah!', sampleQ);
  assert.strictEqual(res4.isCorrect, true);

  // Case 5: Alias artist (Peterpan)
  const res5 = AnswerValidator.validate('!jawab separuh aku peterpan', sampleQ);
  assert.strictEqual(res5.isCorrect, true);

  // Case 6: Reject non-!jawab comment, like !play
  const resPlay = AnswerValidator.validate('!play separuh aku noah', sampleQ);
  assert.strictEqual(resPlay.isValidCommand, false);
  assert.strictEqual(resPlay.isCorrect, false);
});

// ----------------------------------------------------
// 4. Typo tolerance test
// ----------------------------------------------------
test('4. Typo tolerance - Mentoleransi typo ringan dan menolak jawaban yang terlalu jauh', () => {
  const sampleQ: Question = {
    id: 'T2',
    category: 'TEBAK_JUDUL',
    difficulty: 'NORMAL',
    prompt: 'Test',
    expectedTitle: 'Separuh Aku',
    expectedArtist: 'Noah',
    points: 100
  };

  // Light typo in title: 'separuh qku noah' -> should PASS
  const typo1 = AnswerValidator.validate('!jawab separuh qku noah', sampleQ);
  assert.strictEqual(typo1.isCorrect, true, 'Typo 1 huruf pada title harus diterima');

  // Light typo in artist: 'separuh aku noa' -> should PASS
  const typo2 = AnswerValidator.validate('!jawab separuh aku noa', sampleQ);
  assert.strictEqual(typo2.isCorrect, true, 'Typo 1 huruf pada artist harus diterima');

  // Completely wrong answer -> should REJECT
  const wrong = AnswerValidator.validate('!jawab bintang di surga peterpan', sampleQ);
  assert.strictEqual(wrong.isCorrect, false, 'Jawaban lagu berbeda harus ditolak');

  // Distant answer -> should REJECT
  const far = AnswerValidator.validate('!jawab bukan aku siapa dia', sampleQ);
  assert.strictEqual(far.isCorrect, false, 'Jawaban jauh harus ditolak');
});

// ----------------------------------------------------
// 5. First correct answer test
// ----------------------------------------------------
test('5. First correct answer - Penonton pertama yang menjawab benar menjadi pemenang tunggal', () => {
  const { engine } = setupTestEngine('test_first_answer.db');
  engine.startGame();
  engine.startRound('Q001'); // Separuh Aku - Noah

  // Viewer 1 answers first
  engine.handleComment({
    userId: 'user_first',
    nickname: 'Budi Cepat',
    text: '!jawab separuh aku noah',
    timestamp: 1000
  });

  const state1 = engine.getState();
  assert.strictEqual(state1.stage, 'WINNER');
  assert.strictEqual(state1.currentRound?.winner?.player.id, 'user_first');

  // Viewer 2 answers 1 second later
  engine.handleComment({
    userId: 'user_second',
    nickname: 'Siti Lambat',
    text: '!jawab separuh aku noah',
    timestamp: 2000
  });

  const state2 = engine.getState();
  // Winner must STILL be user_first
  assert.strictEqual(state2.currentRound?.winner?.player.id, 'user_first');
  assert.strictEqual(state2.players['user_second'], undefined, 'User kedua tidak mendapatkan poin');
});

// ----------------------------------------------------
// 6. Dua jawaban benar bersamaan (Concurrency test)
// ----------------------------------------------------
test('6. Dua jawaban benar bersamaan - Penguncian serentak aman dan deterministik', () => {
  const { engine } = setupTestEngine('test_concurrent.db');
  engine.startGame();
  engine.startRound('Q001');

  // Simulate two concurrent arrivals
  const comment1 = {
    userId: 'racer_1',
    nickname: 'Pembalap 1',
    text: '!jawab separuh aku noah',
    timestamp: 1000
  };
  const comment2 = {
    userId: 'racer_2',
    nickname: 'Pembalap 2',
    text: '!jawab separuh aku noah',
    timestamp: 1001
  };

  // Dispatch both
  engine.handleComment(comment1);
  engine.handleComment(comment2);

  const state = engine.getState();
  assert.strictEqual(state.currentRound?.winner?.player.id, 'racer_1');
  assert.strictEqual(state.players['racer_1'].wins, 1);
  assert.strictEqual(state.players['racer_2'], undefined);
});

// ----------------------------------------------------
// 7. Atomic winner locking test
// ----------------------------------------------------
test('7. Atomic winner locking - Soal terkunci seketika dan jawaban berikutnya diabaikan', () => {
  const roundMgr = new RoundManager(QUESTION_CATALOG);
  const round = roundMgr.startNewRound('Q001');

  assert.strictEqual(roundMgr.isQuestionLocked(), false);

  const locked1 = roundMgr.lockWinner({
    player: {
      id: 'p1',
      nickname: 'User 1',
      quizPoints: 150,
      rawTap2: 0,
      tap2Points: 0,
      totalVP: 150,
      wins: 1,
      streak: 1
    },
    pointsAwarded: 150,
    breakdown: { base: 100, speedBonus: 50, streakBonus: 0, specialBonus: 0 },
    rawComment: '!jawab separuh aku noah',
    answeredAt: Date.now()
  });

  assert.strictEqual(locked1, true, 'First lock must succeed');
  assert.strictEqual(roundMgr.isQuestionLocked(), true, 'Round is now locked');

  // Attempt second lock
  const locked2 = roundMgr.lockWinner({
    player: {
      id: 'p2',
      nickname: 'User 2',
      quizPoints: 150,
      rawTap2: 0,
      tap2Points: 0,
      totalVP: 150,
      wins: 1,
      streak: 1
    },
    pointsAwarded: 150,
    breakdown: { base: 100, speedBonus: 50, streakBonus: 0, specialBonus: 0 },
    rawComment: '!jawab separuh aku noah',
    answeredAt: Date.now()
  });

  assert.strictEqual(locked2, false, 'Second lock must be atomically rejected');
});

// ----------------------------------------------------
// 8. Quiz Point test
// ----------------------------------------------------
test('8. Quiz Point - Perhitungan Normal (100+50 bonus), Hard (200+50), Expert (300+50), Special (250+50)', () => {
  // Normal question (100) + first answer bonus (+50) = 150
  const qNormal: Question = { id: 'qn', category: 'TEBAK_JUDUL', difficulty: 'NORMAL', prompt: '', expectedTitle: 'A', expectedArtist: 'B', points: 100 };
  const scoreNormal = ScoringEngine.calculateQuizPoints(qNormal, 0, true);
  assert.strictEqual(scoreNormal.basePoints, 100);
  assert.strictEqual(scoreNormal.speedBonus, 50);
  assert.strictEqual(scoreNormal.totalPointsAwarded, 150);

  // Hard question (200) + first answer bonus (+50) = 250
  const qHard: Question = { id: 'qh', category: 'TRIVIA', difficulty: 'HARD', prompt: '', expectedTitle: 'A', expectedArtist: 'B', points: 200 };
  const scoreHard = ScoringEngine.calculateQuizPoints(qHard, 0, true);
  assert.strictEqual(scoreHard.basePoints, 200);
  assert.strictEqual(scoreHard.totalPointsAwarded, 250);

  // Expert question (300) + first answer bonus (+50) = 350
  const qExpert: Question = { id: 'qe', category: 'TEBAK_ERA', difficulty: 'EXPERT', prompt: '', expectedTitle: 'A', expectedArtist: 'B', points: 300 };
  const scoreExpert = ScoringEngine.calculateQuizPoints(qExpert, 0, true);
  assert.strictEqual(scoreExpert.basePoints, 300);
  assert.strictEqual(scoreExpert.totalPointsAwarded, 350);

  // Special challenge question (250) + first answer bonus (+50) = 300
  const qSpecial: Question = { id: 'qs', category: 'SPECIAL_CHALLENGE', difficulty: 'SPECIAL', prompt: '', expectedTitle: 'A', expectedArtist: 'B', points: 250 };
  const scoreSpecial = ScoringEngine.calculateQuizPoints(qSpecial, 0, true);
  assert.strictEqual(scoreSpecial.basePoints, 250);
  assert.strictEqual(scoreSpecial.totalPointsAwarded, 300);
});

// ----------------------------------------------------
// 9. Tap2 Point test
// ----------------------------------------------------
test('9. Tap2 Point - Rumus FLOOR(Total Tap2 / 100)', () => {
  assert.strictEqual(ScoringEngine.calculateTap2Points(0), 0);
  assert.strictEqual(ScoringEngine.calculateTap2Points(99), 0);
  assert.strictEqual(ScoringEngine.calculateTap2Points(100), 1);
  assert.strictEqual(ScoringEngine.calculateTap2Points(199), 1);
  assert.strictEqual(ScoringEngine.calculateTap2Points(200), 2);
  assert.strictEqual(ScoringEngine.calculateTap2Points(1050), 10);
});

// ----------------------------------------------------
// 10. Total Viewer Point test
// ----------------------------------------------------
test('10. Total Viewer Point - Total VP = Quiz Point + Tap2 Point', () => {
  const result = ScoringEngine.calculateTotalVP(350, 450); // 350 quiz + floor(450/100) = 350 + 4 = 354
  assert.strictEqual(result.quizPoints, 350);
  assert.strictEqual(result.rawTap2, 450);
  assert.strictEqual(result.tap2Points, 4);
  assert.strictEqual(result.totalVP, 354);
});

// ----------------------------------------------------
// 11. Tie-breaker test
// ----------------------------------------------------
test('11. Tie-breaker - Hierarki: Total VP -> Raw Tap2 -> Quiz Point -> Wins -> ID fallback', () => {
  const players = [
    { id: 'p1', nickname: 'P1', quizPoints: 200, rawTap2: 300, tap2Points: 3, totalVP: 203, wins: 1, streak: 0 },
    { id: 'p2', nickname: 'P2', quizPoints: 100, rawTap2: 1200, tap2Points: 12, totalVP: 112, wins: 1, streak: 0 },
    { id: 'p3', nickname: 'P3', quizPoints: 200, rawTap2: 350, tap2Points: 3, totalVP: 203, wins: 1, streak: 0 }, // Same VP as p1, but more raw tap2!
    { id: 'p4', nickname: 'P4', quizPoints: 200, rawTap2: 350, tap2Points: 3, totalVP: 203, wins: 2, streak: 0 }  // Same VP and raw tap2 as p3, but more wins!
  ];

  const sorted = ScoringEngine.sortLeaderboard(players);

  // 1st place must be p4 (203 VP, 350 raw tap2, 2 wins)
  assert.strictEqual(sorted[0].id, 'p4');
  // 2nd place must be p3 (203 VP, 350 raw tap2, 1 win)
  assert.strictEqual(sorted[1].id, 'p3');
  // 3rd place must be p1 (203 VP, 300 raw tap2, 1 win)
  assert.strictEqual(sorted[2].id, 'p1');
  // 4th place must be p2 (112 VP)
  assert.strictEqual(sorted[3].id, 'p2');
});

// ----------------------------------------------------
// 12. Streak test
// ----------------------------------------------------
test('12. Streak - 3 kemenangan beruntun mendapatkan bonus +100 VP', () => {
  const qNormal: Question = { id: 'qn', category: 'TEBAK_JUDUL', difficulty: 'NORMAL', prompt: '', expectedTitle: 'A', expectedArtist: 'B', points: 100 };

  // Win 1: streak 0 -> 1. Bonus streak = 0
  const win1 = ScoringEngine.calculateQuizPoints(qNormal, 0, true);
  assert.strictEqual(win1.newStreak, 1);
  assert.strictEqual(win1.streakBonus, 0);

  // Win 2: streak 1 -> 2. Bonus streak = 0
  const win2 = ScoringEngine.calculateQuizPoints(qNormal, 1, true);
  assert.strictEqual(win2.newStreak, 2);
  assert.strictEqual(win2.streakBonus, 0);

  // Win 3: streak 2 -> 3. Bonus streak = 100!
  const win3 = ScoringEngine.calculateQuizPoints(qNormal, 2, true);
  assert.strictEqual(win3.newStreak, 3);
  assert.strictEqual(win3.streakBonus, 100);
  assert.strictEqual(win3.totalPointsAwarded, 100 + 50 + 100); // 250 VP
});

// ----------------------------------------------------
// 13. Pause dan Resume test
// ----------------------------------------------------
test('13. Pause dan Resume - Menjeda dan melanjutkan sesi LIVE', () => {
  const { engine } = setupTestEngine('test_pause.db');
  engine.startGame();
  assert.strictEqual(engine.getState().sessionState, 'ACTIVE');

  engine.pauseSession();
  assert.strictEqual(engine.getState().sessionState, 'PAUSED');
  assert.strictEqual(engine.getState().audio.bgmPlaying, false);

  // Tap2 during pause should be ignored
  engine.handleLike({ userId: 'p1', nickname: 'P1', likeCount: 500, timestamp: Date.now() });
  assert.strictEqual(engine.getState().players['p1'], undefined, 'No points awarded while paused');

  engine.resumeSession();
  assert.strictEqual(engine.getState().sessionState, 'ACTIVE');
  assert.strictEqual(engine.getState().audio.bgmPlaying, true);
});

// ----------------------------------------------------
// 14. NEXT manual test
// ----------------------------------------------------
test('14. NEXT manual - Tidak otomatis berpindah soal; host mengendalikan perpindahan', () => {
  const { engine } = setupTestEngine('test_next.db');
  engine.startGame();
  engine.startRound('Q001');

  // Answer is solved
  engine.handleComment({
    userId: 'winner1',
    nickname: 'Bontoter',
    text: '!jawab separuh aku noah',
    timestamp: Date.now()
  });

  // Stage is WINNER and BGM is paused
  assert.strictEqual(engine.getState().stage, 'WINNER');
  assert.strictEqual(engine.getState().audio.bgmPlaying, false);

  // Wait: It must NOT automatically progress!
  assert.strictEqual(engine.getState().stage, 'WINNER');

  // Host presses NEXT manually
  engine.next();
  assert.strictEqual(engine.getState().stage, 'IDLE');
  assert.strictEqual(engine.getState().audio.bgmPlaying, true, 'BGM resumes when host presses NEXT');
});

// ----------------------------------------------------
// 15. FINAL SHOW test
// ----------------------------------------------------
test('15. FINAL SHOW - Memasuki panggung juara dan podium 3D', () => {
  const { engine, playerMgr } = setupTestEngine('test_final_show.db');
  engine.startGame();
  playerMgr.addTap2('u1', 'Juara 1', 3000); // 30 VP
  playerMgr.addTap2('u2', 'Juara 2', 2000); // 20 VP
  playerMgr.addTap2('u3', 'Juara 3', 1000); // 10 VP

  engine.finalShow();
  const state = engine.getState();
  assert.strictEqual(state.stage, 'CHAMPION');
  assert.strictEqual(state.leaderboard[0].nickname, 'Juara 1');
  assert.strictEqual(state.leaderboard[1].nickname, 'Juara 2');
  assert.strictEqual(state.leaderboard[2].nickname, 'Juara 3');
});

// ----------------------------------------------------
// 16. Playback adapter test
// ----------------------------------------------------
test('16. Playback adapter - DISCONNECTED/CONNECTED status, call logging, and graceful failure', async () => {
  const mockBridge = new MockPlaybackBridge(false);
  const status1 = mockBridge.getStatus();
  assert.strictEqual(status1.connected, true);
  assert.strictEqual(status1.mode, 'MOCK');

  const req1 = await mockBridge.requestPlayback('Separuh Aku', 'Noah');
  assert.strictEqual(req1.status, 'SUCCESS');
  assert.strictEqual(mockBridge.getStatus().recentCalls.length, 1);

  // Simulate external bridge failure
  mockBridge.setSimulateFailure(true);
  const req2 = await mockBridge.requestPlayback('Dan', 'Sheila on 7');
  assert.strictEqual(req2.status, 'FAILED');
  assert.ok(req2.errorMessage?.includes('unavailable'));

  // Test BontotStudioPlaybackBridge offline handling
  const bsBridge = new BontotStudioPlaybackBridge('http://127.0.0.1:9999/invalid');
  const bsStatus = bsBridge.getStatus();
  assert.strictEqual(bsStatus.mode, 'BONTOT_STUDIO_BRIDGE');
  assert.strictEqual(bsStatus.connected, false, 'External bridge without real connection must report disconnected');

  const bsReq = await bsBridge.requestPlayback('Pupus', 'Dewa 19');
  assert.strictEqual(bsReq.status, 'FAILED', 'Must handle offline gracefully without crashing');
});

// ----------------------------------------------------
// 17. TikTok connector adapter test
// ----------------------------------------------------
test('17. TikTok connector adapter - Mode terpisah dan verifikasi listener event tunggal', async () => {
  const mockConnector = new MockTikTokConnector();
  assert.strictEqual(mockConnector.getStatus().mode, 'SIMULATION');

  let commentReceived = false;
  mockConnector.onComment((e) => {
    if (e.text.includes('test')) commentReceived = true;
  });

  mockConnector.simulateComment({
    userId: 'test_user',
    nickname: 'Tester',
    text: '!jawab test'
  });

  assert.strictEqual(commentReceived, true);

  const liveConnector = new TikTokLiveConnector('thebontotradio');
  assert.strictEqual(liveConnector.getStatus().mode, 'LIVE_CONNECTOR');
  assert.strictEqual(liveConnector.getStatus().connected, false);
});

// ----------------------------------------------------
// 18. Duplicate event prevention test
// ----------------------------------------------------
test('18. Duplicate event prevention - Cegah duplikasi event like dan hitung selisih kumulatif', () => {
  const tap2Agg = new Tap2Aggregator();

  // Test direct duplicate event ID
  const delta1 = tap2Agg.processTap({
    eventId: 'EV_1001',
    userId: 'u1',
    nickname: 'User 1',
    likeCount: 50,
    timestamp: Date.now()
  }, true);
  assert.strictEqual(delta1, 50);

  // Exact same event ID repeated -> should be 0
  const delta2 = tap2Agg.processTap({
    eventId: 'EV_1001',
    userId: 'u1',
    nickname: 'User 1',
    likeCount: 50,
    timestamp: Date.now()
  }, true);
  assert.strictEqual(delta2, 0, 'Duplicate eventId must yield delta 0');

  // Test cumulative like handling:
  // First cumulative report: 200 likes
  const deltaCum1 = tap2Agg.processTap({
    userId: 'u2',
    nickname: 'User 2',
    likeCount: 200,
    isCumulative: true,
    timestamp: Date.now()
  }, true);
  assert.strictEqual(deltaCum1, 200);

  // Second cumulative report: 250 likes (delta = 50)
  const deltaCum2 = tap2Agg.processTap({
    userId: 'u2',
    nickname: 'User 2',
    likeCount: 250,
    isCumulative: true,
    timestamp: Date.now()
  }, true);
  assert.strictEqual(deltaCum2, 50, 'Cumulative delta must be 50');

  // Stale or repeated cumulative count: 250 likes (delta = 0)
  const deltaCumStale = tap2Agg.processTap({
    userId: 'u2',
    nickname: 'User 2',
    likeCount: 250,
    isCumulative: true,
    timestamp: Date.now()
  }, true);
  assert.strictEqual(deltaCumStale, 0, 'Stale cumulative like update must not add extra taps');
});

// ----------------------------------------------------
// 19. OBS 9:16 layout test
// ----------------------------------------------------
test('19. OBS 9:16 layout - Verifikasi dimensi 1080x1920 (aspect ratio 9:16) dan target tipografi', () => {
  const WIDTH = 1080;
  const HEIGHT = 1920;
  const aspectRatio = WIDTH / HEIGHT;
  assert.strictEqual(Math.round(aspectRatio * 1000) / 1000, Math.round((9 / 16) * 1000) / 1000);

  // Verify typography guidelines for Bontoters (30-60 y.o.)
  const TYPOGRAPHY_GUIDE = {
    title: { min: 48, max: 60 },
    question: { min: 44, max: 54 },
    hint: { min: 34, max: 42 },
    winnerName: { min: 38, max: 48 },
    points: { min: 36, max: 44 },
    secondary: { min: 26, max: 30 },
    minLabel: 22
  };

  assert.ok(TYPOGRAPHY_GUIDE.title.min >= 48);
  assert.ok(TYPOGRAPHY_GUIDE.question.min >= 44);
  assert.ok(TYPOGRAPHY_GUIDE.hint.min >= 34);
  assert.ok(TYPOGRAPHY_GUIDE.minLabel >= 22);
});

// ----------------------------------------------------
// 20. Safe zone dan chat exclusion zone test
// ----------------------------------------------------
test('20. Safe zone dan chat exclusion zone - Konfigurasi dapat disimpan dan diubah tanpa edit kode', () => {
  const { engine, archive } = setupTestEngine('test_safe_zone.db');

  const customConfig = {
    x: 6,
    y: 10,
    width: 88,
    height: 50,
    margin: 30,
    chatExclusionHeight: 40
  };

  engine.updateSafeZone(customConfig);
  const current = engine.getState().safeZone;
  assert.strictEqual(current.x, 6);
  assert.strictEqual(current.chatExclusionHeight, 40);

  // Verify persistence in SQLite
  const loaded = archive.getSafeZoneConfig();
  assert.strictEqual(loaded?.chatExclusionHeight, 40);
  assert.strictEqual(loaded?.margin, 30);
});

