import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { RVTikChatOutputAdapter } from '../src/server/adapters/RVTikChatOutputAdapter.js';
import { RVTikPlaybackBridge } from '../src/server/adapters/RVTikPlaybackBridge.js';
import { GameEngine } from '../src/server/engine/GameEngine.js';
import { RoundManager } from '../src/server/engine/RoundManager.js';
import { SessionManager } from '../src/server/engine/SessionManager.js';
import { Tap2Aggregator } from '../src/server/engine/Tap2Aggregator.js';
import { PlayerIdentityManager } from '../src/server/engine/PlayerIdentity.js';
import { MockTikTokConnector } from '../src/server/adapters/MockTikTokConnector.js';
import { AppDatabase } from '../src/server/storage/Database.js';
import { SessionArchiveService } from '../src/server/storage/SessionArchive.js';
import { QUESTION_CATALOG } from '../src/server/catalog/questions.js';

describe('RVTIK CHAT COMMAND OUTPUT & STANDALONE WORKFLOW TESTS', () => {
  let adapter: RVTikChatOutputAdapter;

  beforeEach(() => {
    adapter = new RVTikChatOutputAdapter({ activeMode: 'SIMULATION', autoSendEnabled: false });
  });

  test('1. Command formatting generates exact "!play <title> <artist>" syntax', () => {
    const formatted1 = adapter.formatCommand('Kangen', 'Dewa 19');
    assert.equal(formatted1, '!play Kangen Dewa 19');

    const formatted2 = adapter.formatCommand('Separuh Aku', 'Noah');
    assert.equal(formatted2, '!play Separuh Aku Noah');

    // Extra whitespace and line breaks sanitization
    const formatted3 = adapter.formatCommand('  Dan \n', '\t Sheila on 7 ');
    assert.equal(formatted3, '!play Dan Sheila on 7');
  });

  test('2. Manual mode: Prepared command starts in PENDING status until host dispatches', async () => {
    assert.equal(adapter.getStatus().autoSendEnabled, false);

    const record = adapter.prepareCommand('Kangen', 'Dewa 19', 'Asep_Dewa');
    assert.equal(record.status, 'PENDING');
    assert.equal(record.command, '!play Kangen Dewa 19');
    assert.equal(record.winnerNickname, 'Asep_Dewa');
    assert.equal(record.verifiedInChat, false);

    // Host clicks dispatch in dashboard
    const dispatched = await adapter.dispatchCommand(record.id);
    assert.equal(dispatched.status, 'SENT');
    assert.equal(dispatched.verifiedInChat, false); // Still unverified until chat event arrives
  });

  test('3. Auto-Send mode: Automatically dispatches command upon winner lock', async () => {
    adapter.setAutoSend(true);
    assert.equal(adapter.getStatus().autoSendEnabled, true);

    const record = adapter.prepareCommand('Pupus', 'Dewa 19', 'Baladewa_1');
    assert.equal(record.command, '!play Pupus Dewa 19');
    // Allow auto-dispatch microtask
    await new Promise((r) => setTimeout(r, 20));

    const status = adapter.getStatus();
    assert.equal(status.lastCommand?.status, 'SENT');
  });

  test('4. Live Chat Ingress Verification: Confirms command physically appeared in TikTok LIVE chat with sender & correlation protection', () => {
    adapter.prepareCommand('Dan', 'Sheila on 7', 'Duta_Fans');

    // Unrelated viewer chats
    assert.equal(adapter.verifyIncomingMessage('halo bang adhy', 'random_viewer'), false);
    assert.equal(adapter.verifyIncomingMessage('!jawab Dan Sheila on 7', 'quiz_player'), false);

    // Viewer spoof attempt: typing !play command from unauthorized account is rejected
    assert.equal(adapter.verifyIncomingMessage('!play Dan Sheila on 7', 'random_viewer_99'), false);
    assert.equal(adapter.getStatus().lastCommand?.verifiedInChat, false);

    // Stale message (> 120s diff) is rejected
    assert.equal(adapter.verifyIncomingMessage('!play Dan Sheila on 7', 'host_adhy', Date.now() - 200_000), false);

    // Authorized host / bot sends !play command to TikTok LIVE chat within valid window
    const verified = adapter.verifyIncomingMessage('!play Dan Sheila on 7', 'host_adhy', Date.now());
    assert.equal(verified, true);
    assert.equal(adapter.getStatus().lastCommand?.verifiedInChat, true);
  });

  test('4b. Clipboard Assist Mode sets COPIED_TO_CLIPBOARD status and never marks command as SENT to chat', async () => {
    const clipAdapter = new RVTikChatOutputAdapter({ activeMode: 'CLIPBOARD_ASSIST' });
    const record = clipAdapter.prepareCommand('Kangen', 'Dewa 19', 'Baladewa_Jawara');
    assert.equal(record.status, 'PENDING');

    const result = await clipAdapter.dispatchCommand(record.id);
    assert.equal(result.status, 'COPIED_TO_CLIPBOARD', 'Must reflect clipboard copy, not fake auto-send to chat');
    assert.equal(result.verifiedInChat, false, 'Remains unverified until live chat confirmation');
  });

  test('5. Window Automation Fallback: Reports graceful failure when TikTok Live Studio is not open', async () => {
    const automationAdapter = new RVTikChatOutputAdapter({ activeMode: 'WINDOW_AUTOMATION' });
    automationAdapter.setTargetWindowPattern('NonExistentWindowTitle_9999XYZ');

    const record = automationAdapter.prepareCommand('Separuh Aku', 'Noah', 'Ariel_Fans');
    const result = await automationAdapter.dispatchCommand(record.id);

    assert.equal(result.status, 'FAILED');
    assert.match(result.errorMessage || '', /tidak ditemukan di desktop/);
  });

  test('6. End-to-End Standalone Winner -> RVTik Playback Bridge Flow', async () => {
    const rvtikAdapter = new RVTikChatOutputAdapter({ activeMode: 'SIMULATION' });
    const playbackBridge = new RVTikPlaybackBridge(rvtikAdapter);
    const tiktokConnector = new MockTikTokConnector();

    const db = new AppDatabase();
    const archiveService = new SessionArchiveService(db);
    const roundManager = new RoundManager(QUESTION_CATALOG);
    const sessionManager = new SessionManager(archiveService);
    const tap2Aggregator = new Tap2Aggregator();
    const playerManager = new PlayerIdentityManager();

    const engine = new GameEngine(
      roundManager,
      sessionManager,
      tap2Aggregator,
      playerManager,
      playbackBridge,
      tiktokConnector,
      archiveService
    );

    // Wire live comment inspection to RVTik chat verification
    tiktokConnector.onComment((c) => {
      rvtikAdapter.verifyIncomingMessage(c.text, c.nickname);
    });

    engine.startGame();
    engine.startRound('Q001'); // Q001: Separuh Aku - Noah

    assert.equal(engine.getState().audio.bgmPlaying, true);

    // Viewer answers correctly
    tiktokConnector.simulateComment({
      userId: 'winner_101',
      nickname: 'Bontoters_Sejati',
      text: '!jawab Separuh Aku Noah'
    });

    const state = engine.getState();
    assert.equal(state.stage, 'WINNER');
    assert.equal(state.currentRound?.winner?.player.id, 'winner_101');
    assert.equal(state.audio.bgmPlaying, false, 'BGM stops when winner is locked');

    // Phase 4 Requirement: Winner lock must NOT automatically trigger RVTik playback bridge
    const rvtikStatus = rvtikAdapter.getStatus();
    assert.equal(rvtikStatus.lastCommand, undefined, 'Phase 4: Round winner lock must NOT trigger playback bridge or auto !play command');

    // Host or winner can still prepare and dispatch !play command for reward or manual request
    const cmd = rvtikAdapter.prepareCommand('Separuh Aku', 'Noah', 'Bontoters_Sejati');
    assert.equal(cmd.command, '!play Separuh Aku Noah');

    // Host sends command to TikTok LIVE chat
    await rvtikAdapter.dispatchCommand(cmd.id);
    assert.equal(rvtikAdapter.getStatus().lastCommand?.status, 'SENT');

    // TikTok LIVE chat receives the command message
    tiktokConnector.simulateComment({
      userId: 'host_id',
      nickname: 'thebontotradio',
      text: '!play Separuh Aku Noah'
    });

    // Command is now verified as appearing in LIVE chat for RVTik!
    assert.equal(rvtikAdapter.getStatus().lastCommand?.verifiedInChat, true);

    // Host clicks NEXT after round completes
    engine.next();
    assert.equal(engine.getState().stage, 'IDLE');
    assert.equal(engine.getState().audio.bgmPlaying, true, 'BGM resumes for next round');
  });

  test('7. Phase 4 Top 10 Leaderboard, Top 3 Podium & Free Request Song Rewards Flow', async () => {
    const rvtikAdapter = new RVTikChatOutputAdapter({ activeMode: 'SIMULATION' });
    const playbackBridge = new RVTikPlaybackBridge(rvtikAdapter);
    const tiktokConnector = new MockTikTokConnector();

    const db = new AppDatabase();
    const archiveService = new SessionArchiveService(db);
    const roundManager = new RoundManager(QUESTION_CATALOG);
    const sessionManager = new SessionManager(archiveService);
    const tap2Aggregator = new Tap2Aggregator();
    const playerManager = new PlayerIdentityManager();

    const engine = new GameEngine(
      roundManager,
      sessionManager,
      tap2Aggregator,
      playerManager,
      playbackBridge,
      tiktokConnector,
      archiveService
    );

    engine.startGame();

    // Seed 4 participants
    playerManager.getOrCreate('champ_gold', 'Gold Champ');
    playerManager.getOrCreate('champ_silver', 'Silver Runner');
    playerManager.getOrCreate('champ_bronze', 'Bronze Fighter');
    playerManager.getOrCreate('champ_fourth', 'Fourth Place');

    playerManager.awardQuizWin('champ_gold', 150, Date.now() - 3000);
    playerManager.awardQuizWin('champ_silver', 100, Date.now() - 2000);
    playerManager.awardQuizWin('champ_bronze', 80, Date.now() - 1000);
    playerManager.awardQuizWin('champ_fourth', 50, Date.now() - 500);

    // Leaderboard has 4 players sorted by VP
    const state = engine.getState();
    assert.equal(state.leaderboard.length, 4);
    assert.equal(state.leaderboard[0].id, 'champ_gold');
    assert.equal(state.leaderboard[1].id, 'champ_silver');
    assert.equal(state.leaderboard[2].id, 'champ_bronze');
    assert.equal(state.leaderboard[3].id, 'champ_fourth');

    // Host opens podium
    engine.showPodium();
    assert.equal(engine.getState().stage, 'CHAMPION');
    assert.equal(engine.getState().podiumVisible, true);

    // Host repeats announcement
    engine.repeatChampionAnnouncement();
    assert.match(engine.getState().announcement || '', /PENGUMUMAN JUARA|SELAMAT KEPADA/);

    // End session: Top 3 champions locked with rewards
    const summary = engine.endSession();
    assert.ok(summary);
    assert.equal(summary.top3Champions?.length, 3);
    assert.equal(summary.top3Champions[0].userId, 'champ_gold');
    assert.equal(summary.top3Champions[0].rank, 1);
    assert.equal(summary.top3Champions[1].userId, 'champ_silver');
    assert.equal(summary.top3Champions[1].rank, 2);
    assert.equal(summary.top3Champions[2].userId, 'champ_bronze');
    assert.equal(summary.top3Champions[2].rank, 3);

    // Verify rewards: exactly Top 3 are eligible for 1 Free Request Song
    const rewards = engine.getChampionRewards();
    assert.equal(rewards.length, 3);
    assert.equal(rewards[0].status, 'ELIGIBLE');
    assert.equal(rewards[1].status, 'ELIGIBLE');
    assert.equal(rewards[2].status, 'ELIGIBLE');

    // Non-top 3 cannot redeem
    const nonTop3Redeem = engine.redeemChampionReward('champ_fourth', 'Dewa 19 - Pupus');
    assert.equal(nonTop3Redeem.success, false);

    // Host marks Gold Champ's reward as redeemed
    const goldRedeem = engine.redeemChampionReward('champ_gold', 'Slank - Ku Tak Bisa');
    assert.equal(goldRedeem.success, true);
    assert.equal(goldRedeem.record?.status, 'REDEEMED');
    assert.equal(goldRedeem.record?.requestedSong, 'Slank - Ku Tak Bisa');

    // Double redemption prevented
    const doubleRedeem = engine.redeemChampionReward('champ_gold', 'Dewa 19 - Risalah Hati');
    assert.equal(doubleRedeem.success, false);
    assert.match(doubleRedeem.message, /sudah pernah digunakan/);

    // Session reset does not delete previous archive
    engine.startGame();
    assert.equal(engine.getState().leaderboard.length, 0);
    const allArchives = archiveService.getAllSessions();
    assert.ok(allArchives.find((s) => s.id === summary.id));
  });

  test('8. Phase 5 Question Intelligence & Anti-Repetition Engine', async () => {
    const rvtikAdapter = new RVTikChatOutputAdapter({ activeMode: 'SIMULATION' });
    const playbackBridge = new RVTikPlaybackBridge(rvtikAdapter);
    const tiktokConnector = new MockTikTokConnector();

    const db = new AppDatabase();
    const archiveService = new SessionArchiveService(db);
    const roundManager = new RoundManager(QUESTION_CATALOG);
    const sessionManager = new SessionManager(archiveService);
    const tap2Aggregator = new Tap2Aggregator();
    const playerManager = new PlayerIdentityManager();

    const engine = new GameEngine(
      roundManager,
      sessionManager,
      tap2Aggregator,
      playerManager,
      playbackBridge,
      tiktokConnector,
      archiveService
    );

    engine.startGame();

    // 1. Catalog Sizing & Variety Check (60 questions across 15 categories)
    const stats = engine.getCatalogStats();
    assert.ok(stats.totalQuestions >= 60, `Catalog must have at least 60 questions, got ${stats.totalQuestions}`);
    assert.ok(Object.keys(stats.categories).length >= 15, 'Catalog must span at least 15 categories');
    assert.ok(stats.difficulties.NORMAL && stats.difficulties.HARD && stats.difficulties.EXPERT && stats.difficulties.SPECIAL);

    // 2. In-Session Anti-Repetition: 10 consecutive rounds must produce 10 unique questions
    const seenQuestionIds: string[] = [];
    const seenCategories: string[] = [];

    for (let i = 0; i < 10; i++) {
      const round = engine.startRound();
      assert.ok(round.question, 'Round must have a question');
      assert.ok(!seenQuestionIds.includes(round.question.id), `Question ${round.question.id} must not repeat within active session`);
      seenQuestionIds.push(round.question.id);
      seenCategories.push(round.question.category);
      engine.next();
    }

    assert.equal(new Set(seenQuestionIds).size, 10, 'All 10 questions must be strictly unique');

    // 3. Category rotation minimization
    let consecutiveSame = 0;
    for (let i = 1; i < seenCategories.length; i++) {
      if (seenCategories[i] === seenCategories[i - 1]) consecutiveSame++;
    }
    assert.ok(consecutiveSame <= 1, 'Category rotation must minimize consecutive same categories');

    // 4. Cross-Session SQLite Persistence of question history
    archiveService.recordQuestionUsage('Q019', 'sess_standalone_1');
    archiveService.recordQuestionUsage('Q020', 'sess_standalone_1');
    const usedHistory = archiveService.getUsedQuestionIds(10);
    assert.ok(usedHistory.includes('Q019'));
    assert.ok(usedHistory.includes('Q020'));

    // 5. Dynamic Question Addition
    const initialTotal = engine.getCatalogStats().totalQuestions;
    engine.addQuestions([
      {
        id: 'Q_STANDALONE_CUSTOM',
        category: 'TRIVIA',
        difficulty: 'NORMAL',
        prompt: 'Pertanyaan khusus siaran Standalone?',
        hint: 'Petunjuk khusus',
        expectedTitle: 'Lagu Baru Standalone',
        expectedArtist: 'Artis Baru',
        titleAliases: ['Lagu Baru Standalone'],
        artistAliases: ['Artis Baru'],
        points: 100
      }
    ]);
    assert.equal(engine.getCatalogStats().totalQuestions, initialTotal + 1);
  });

  test('9. Phase 5 3D Winner Spotlight & Mobile Typography Readability', async () => {
    const rvtikAdapter = new RVTikChatOutputAdapter({ activeMode: 'SIMULATION' });
    const playbackBridge = new RVTikPlaybackBridge(rvtikAdapter);
    const tiktokConnector = new MockTikTokConnector();

    const db = new AppDatabase();
    const archiveService = new SessionArchiveService(db);
    const roundManager = new RoundManager(QUESTION_CATALOG);
    const sessionManager = new SessionManager(archiveService);
    const tap2Aggregator = new Tap2Aggregator();
    const playerManager = new PlayerIdentityManager();

    const engine = new GameEngine(
      roundManager,
      sessionManager,
      tap2Aggregator,
      playerManager,
      playbackBridge,
      tiktokConnector,
      archiveService
    );

    engine.startGame();
    engine.startRound('Q001'); // Separuh Aku - Noah

    // Winner answers with avatar
    tiktokConnector.simulateComment({
      userId: 'user_star_winner',
      nickname: 'Sultan Bontot',
      text: '!jawab Separuh Aku Noah',
      avatarUrl: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/star_avatar.jpeg'
    });

    const state = engine.getState();
    assert.equal(state.stage, 'WINNER');
    const winner = state.currentRound?.winner;
    assert.equal(winner?.player.id, 'user_star_winner');
    assert.equal(winner?.player.nickname, 'Sultan Bontot');
    assert.equal(winner?.player.avatarUrl, 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/star_avatar.jpeg');

    // Safe zone portrait 9:16 readability
    const safeZone = state.safeZone;
    assert.ok(safeZone.width >= 80 && safeZone.width <= 100);
    assert.ok(safeZone.chatExclusionHeight >= 20);
  });
});

