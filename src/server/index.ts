import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';

import { AppDatabase } from './storage/Database.js';
import { SessionArchiveService } from './storage/SessionArchive.js';
import { RoundManager } from './engine/RoundManager.js';
import { SessionManager } from './engine/SessionManager.js';
import { Tap2Aggregator } from './engine/Tap2Aggregator.js';
import { PlayerIdentityManager } from './engine/PlayerIdentity.js';
import { BontotStudioPlaybackBridge } from './adapters/BontotStudioPlaybackBridge.js';
import { RVTikChatOutputAdapter } from './adapters/RVTikChatOutputAdapter.js';
import { RVTikPlaybackBridge } from './adapters/RVTikPlaybackBridge.js';
import { MockPlaybackBridge } from './adapters/MockPlaybackBridge.js';
import { MockTikTokConnector } from './adapters/MockTikTokConnector.js';
import { TikTokLiveConnector } from './adapters/TikTokLiveConnector.js';
import { GameEngine } from './engine/GameEngine.js';
import { QUESTION_CATALOG } from './catalog/questions.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize components
const db = new AppDatabase();
const archiveService = new SessionArchiveService(db);
const roundManager = new RoundManager(QUESTION_CATALOG);
const sessionManager = new SessionManager(archiveService);
const tap2Aggregator = new Tap2Aggregator();
const playerManager = new PlayerIdentityManager();

// Standalone RVTik Chat Output Adapter
const rvtikChatAdapter = new RVTikChatOutputAdapter({
  autoSendEnabled: process.env.RVTIK_AUTO_SEND === 'true',
  activeMode: (process.env.RVTIK_MODE as any) || 'CLIPBOARD_ASSIST'
});
const rvtikPlaybackBridge = new RVTikPlaybackBridge(rvtikChatAdapter);

// Configurable playback bridge
const useMockPlayback = process.env.USE_MOCK_PLAYBACK === 'true';
const playbackBridge = useMockPlayback
  ? new MockPlaybackBridge()
  : process.env.PLAYBACK_MODE === 'BONTOT_STUDIO'
  ? new BontotStudioPlaybackBridge(process.env.BONTOT_PLAYBACK_URL || 'http://127.0.0.1:8999/api/playback')
  : rvtikPlaybackBridge;

const tiktokConnector = new MockTikTokConnector();

// Wire incoming chat comments to RVTik chat verification
tiktokConnector.onComment((comment) => {
  rvtikChatAdapter.verifyIncomingMessage(comment.text, comment.nickname);
});

const gameEngine = new GameEngine(
  roundManager,
  sessionManager,
  tap2Aggregator,
  playerManager,
  playbackBridge,
  tiktokConnector,
  archiveService
);

function getFullState() {
  const base = gameEngine.getState();
  return {
    ...base,
    rvtikChatStatus: rvtikChatAdapter.getStatus()
  };
}

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/state', (req, res) => {
  res.json(getFullState());
});

app.get('/api/rvtik/status', (req, res) => {
  res.json(rvtikChatAdapter.getStatus());
});

app.post('/api/rvtik/send', async (req, res) => {
  try {
    const { commandId, mode } = req.body || {};
    const record = await rvtikChatAdapter.dispatchCommand(commandId, mode);
    broadcastFullState();
    res.json({ success: true, record, state: getFullState() });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/rvtik/auto-send', (req, res) => {
  const { enabled } = req.body || {};
  rvtikChatAdapter.setAutoSend(!!enabled);
  broadcastFullState();
  res.json({ success: true, status: rvtikChatAdapter.getStatus(), state: getFullState() });
});

app.post('/api/rvtik/mode', (req, res) => {
  const { mode } = req.body || {};
  if (mode) {
    rvtikChatAdapter.setMode(mode);
    broadcastFullState();
  }
  res.json({ success: true, status: rvtikChatAdapter.getStatus(), state: getFullState() });
});

app.get('/api/questions', (req, res) => {
  res.json(QUESTION_CATALOG);
});

app.get('/api/archives', (req, res) => {
  res.json(archiveService.getAllSessions());
});

app.get('/api/archives/:id', (req, res) => {
  const archive = archiveService.getSessionById(req.params.id);
  if (!archive) return res.status(404).json({ error: 'Archive not found' });
  res.json(archive);
});

app.post('/api/host/start-game', (req, res) => {
  gameEngine.startGame();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/start-round', (req, res) => {
  const { questionId } = req.body || {};
  const round = gameEngine.startRound(questionId);
  res.json({ success: true, round, state: gameEngine.getState() });
});

app.post('/api/host/start-bonus', (req, res) => {
  const { questionId } = req.body || {};
  const round = gameEngine.startBonusRound(questionId);
  res.json({ success: true, round, state: gameEngine.getState() });
});

app.post('/api/host/next', (req, res) => {
  gameEngine.next();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/skip', (req, res) => {
  gameEngine.skip();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/reveal', (req, res) => {
  gameEngine.revealAnswer();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/pause', (req, res) => {
  gameEngine.pauseSession();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/resume', (req, res) => {
  gameEngine.resumeSession();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/final-show', (req, res) => {
  gameEngine.finalShow();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/show-podium', (req, res) => {
  gameEngine.showPodium();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/hide-podium', (req, res) => {
  gameEngine.hidePodium();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/repeat-announcement', (req, res) => {
  gameEngine.repeatChampionAnnouncement();
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/redeem-reward', (req, res) => {
  const { userId, id, requestedSong, notes } = req.body || {};
  const result = gameEngine.redeemChampionReward(userId || id, requestedSong, notes);
  res.json({ ...result, state: gameEngine.getState() });
});

app.get('/api/host/rewards', (req, res) => {
  res.json(gameEngine.getChampionRewards());
});

app.post('/api/host/end-session', (req, res) => {
  const summary = gameEngine.endSession();
  res.json({ success: true, summary, state: gameEngine.getState() });
});

app.post('/api/host/audio', (req, res) => {
  const { playing, volume } = req.body || {};
  gameEngine.setAudioControl(playing, volume);
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/safe-zone', (req, res) => {
  gameEngine.updateSafeZone(req.body);
  res.json({ success: true, safeZone: gameEngine.getState().safeZone });
});

app.post('/api/host/simulate-comment', (req, res) => {
  const { userId, nickname, text, avatarUrl } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Text comment required' });
  }
  const cleanNickname = (nickname || 'Bontoters_Jawara').trim();
  const cleanUserId = (userId || '').trim() || `user_${cleanNickname.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  tiktokConnector.simulateComment({
    userId: cleanUserId,
    nickname: cleanNickname,
    text,
    avatarUrl
  });
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/host/simulate-like', (req, res) => {
  const { userId, nickname, count, isCumulative, eventId } = req.body || {};
  const likes = count ? parseInt(count, 10) : 100;
  const cleanNickname = (nickname || 'Bontoters_Jawara').trim();
  const cleanUserId = (userId || '').trim() || `user_${cleanNickname.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  tiktokConnector.simulateLike({
    eventId: eventId || `ev_${Date.now()}_${Math.random()}`,
    userId: cleanUserId,
    nickname: cleanNickname,
    likeCount: likes,
    isCumulative: !!isCumulative
  });
  res.json({ success: true, state: gameEngine.getState() });
});

app.post('/api/bridge/test-playback', async (req, res) => {
  const ok = await playbackBridge.testConnection();
  res.json({ connected: ok, status: playbackBridge.getStatus() });
});

// Serve frontend build if exists
const clientDist = path.resolve(process.cwd(), 'dist', 'client');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Create HTTP and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastFullState() {
  const payload = JSON.stringify({ type: 'STATE_UPDATE', payload: getFullState() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  // Send initial full state upon connection
  ws.send(JSON.stringify({ type: 'STATE_UPDATE', payload: getFullState() }));

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // Ignore malformed WS message
    }
  });
});

// Broadcast game state whenever engine updates
gameEngine.subscribe(() => {
  broadcastFullState();
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  MUSIC LEGEND LIVE — THE BONTOT RADIO`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  OBS Browser Source: http://localhost:${PORT}/overlay`);
  console.log(`  Host Dashboard:     http://localhost:${PORT}/`);
  console.log(`====================================================`);
});

export { app, server, gameEngine };

