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

  test('4. Live Chat Ingress Verification: Confirms command physically appeared in TikTok LIVE chat', () => {
    adapter.prepareCommand('Dan', 'Sheila on 7', 'Duta_Fans');

    // Unrelated viewer chats
    assert.equal(adapter.verifyIncomingMessage('halo bang adhy', 'random_viewer'), false);
    assert.equal(adapter.verifyIncomingMessage('!jawab Dan Sheila on 7', 'quiz_player'), false);
    assert.equal(adapter.getStatus().lastCommand?.verifiedInChat, false);

    // Host / bot sends !play command to TikTok LIVE chat
    const verified = adapter.verifyIncomingMessage('!play Dan Sheila on 7', 'host_adhy');
    assert.equal(verified, true);
    assert.equal(adapter.getStatus().lastCommand?.verifiedInChat, true);
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

    // Verify RVTik command was prepared
    const rvtikStatus = rvtikAdapter.getStatus();
    assert.ok(rvtikStatus.lastCommand);
    assert.equal(rvtikStatus.lastCommand?.command, '!play Separuh Aku Noah');

    // Host sends command to TikTok LIVE chat
    await rvtikAdapter.dispatchCommand();
    assert.equal(rvtikAdapter.getStatus().lastCommand?.status, 'SENT');

    // TikTok LIVE chat receives the command message
    tiktokConnector.simulateComment({
      userId: 'host_id',
      nickname: 'thebontotradio',
      text: '!play Separuh Aku Noah'
    });

    // Command is now verified as appearing in LIVE chat for RVTik!
    assert.equal(rvtikAdapter.getStatus().lastCommand?.verifiedInChat, true);

    // Host clicks NEXT after song finishes playing on RVTik
    engine.next();
    assert.equal(engine.getState().stage, 'IDLE');
    assert.equal(engine.getState().audio.bgmPlaying, true, 'BGM resumes for next round');
  });
});
