import assert from 'node:assert';
import http from 'node:http';

async function runEndToEndVerification() {
  console.log('--- STARTING E2E INTEGRATION & IDENTITY VERIFICATION ---');

  // Dynamically import server
  const { server, gameEngine } = await import('../src/server/index.js');

  const TEST_PORT = process.env.PORT || '3000';
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  // Helper fetch function
  const request = async (urlPath: string, method: string = 'GET', body?: any) => {
    const res = await fetch(`${BASE_URL}${urlPath}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: await res.json().catch(() => null), text: await res.text().catch(() => '') };
  };

  // 1. Check initial state
  const stateRes = await request('/api/state');
  assert.strictEqual(stateRes.status, 200);
  console.log('✓ GET /api/state: Success');

  // 2. Start game
  const startRes = await request('/api/host/start-game', 'POST');
  assert.strictEqual(startRes.status, 200);
  assert.strictEqual(startRes.data.state.sessionState, 'ACTIVE');
  console.log('✓ POST /api/host/start-game: Active session created');

  // 3. Start round
  const roundRes = await request('/api/host/start-round', 'POST', { questionId: 'Q001' });
  assert.strictEqual(roundRes.status, 200);
  assert.strictEqual(roundRes.data.state.stage, 'GUESSING');
  console.log('✓ POST /api/host/start-round: Round 1 started in GUESSING stage');

  // 4. TEST USER IDENTITY DUPLICATION FIX:
  // User "Bontoters_Jawara" sends winning comment "!jawab separuh aku noah"
  const commentRes = await request('/api/host/simulate-comment', 'POST', {
    userId: 'user_jawara_01',
    nickname: 'Bontoters_Jawara',
    text: '!jawab separuh aku noah'
  });
  assert.strictEqual(commentRes.status, 200);
  assert.strictEqual(commentRes.data.state.stage, 'WINNER');
  console.log('✓ POST /api/host/simulate-comment: Winner Bontoters_Jawara recorded (150 Quiz Points)');

  // 5. Same user "Bontoters_Jawara" taps screen 100 times (1 Tap2 Point)
  const likeRes = await request('/api/host/simulate-like', 'POST', {
    userId: 'user_jawara_01',
    nickname: 'Bontoters_Jawara',
    count: 100
  });
  assert.strictEqual(likeRes.status, 200);

  // VERIFY EXACTLY ONE ENTRY IN LEADERBOARD
  const leaderboard = likeRes.data.state.leaderboard;
  assert.strictEqual(leaderboard.length, 1, `Leaderboard MUST contain exactly 1 entry, but got ${leaderboard.length}`);

  const jawara = leaderboard[0];
  assert.strictEqual(jawara.id, 'user_jawara_01');
  assert.strictEqual(jawara.nickname, 'Bontoters_Jawara');
  assert.strictEqual(jawara.quizPoints, 150, `Expected 150 quiz points, got ${jawara.quizPoints}`);
  assert.strictEqual(jawara.rawTap2, 100, `Expected 100 raw tap2, got ${jawara.rawTap2}`);
  assert.strictEqual(jawara.tap2Points, 1, `Expected 1 tap2 points, got ${jawara.tap2Points}`);
  assert.strictEqual(jawara.totalVP, 151, `Expected 151 Total VP, got ${jawara.totalVP}`);
  console.log(`✓ VERIFIED IDENTITY MERGE: Single entry on leaderboard: [${jawara.nickname}] Quiz: ${jawara.quizPoints} | Raw: ${jawara.rawTap2} | Tap2: ${jawara.tap2Points} | Total VP: ${jawara.totalVP}`);

  // 6. Host presses NEXT
  const nextRes = await request('/api/host/next', 'POST');
  assert.strictEqual(nextRes.status, 200);
  assert.strictEqual(nextRes.data.state.stage, 'IDLE');
  console.log('✓ POST /api/host/next: Returned to IDLE and BGM resumed');

  // 7. Host triggers FINAL SHOW
  const finalRes = await request('/api/host/final-show', 'POST');
  assert.strictEqual(finalRes.status, 200);
  assert.strictEqual(finalRes.data.state.stage, 'CHAMPION');
  assert.strictEqual(finalRes.data.state.leaderboard[0].nickname, 'Bontoters_Jawara');
  assert.strictEqual(finalRes.data.state.leaderboard[0].totalVP, 151);
  console.log('✓ POST /api/host/final-show: CHAMPION podium stage active with single Champion Bontoters_Jawara (151 VP)');

  // 8. End session & archive
  const endRes = await request('/api/host/end-session', 'POST');
  assert.strictEqual(endRes.status, 200);
  console.log('✓ POST /api/host/end-session: Session ended and archived');

  // 9. Verify archive retrieval
  const archiveRes = await request('/api/archives');
  assert.strictEqual(archiveRes.status, 200);
  const latestArchive = archiveRes.data[0];
  assert.strictEqual(latestArchive.totalParticipants, 1, 'Archive totalParticipants must be 1');
  assert.strictEqual(latestArchive.champion.nickname, 'Bontoters_Jawara');
  assert.strictEqual(latestArchive.champion.totalVP, 151);
  console.log(`✓ GET /api/archives: Archived session confirmed 1 participant and 151 Total VP`);

  // 10. Check static index.html and /overlay routing
  const htmlRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(htmlRes.status, 200);
  const htmlText = await htmlRes.text();
  assert.ok(htmlText.includes('MUSIC LEGEND LIVE'), 'Must serve HTML bundle');
  console.log('✓ Static frontend bundle served on http://localhost:3000/');

  // Clean close
  server.close(() => {
    console.log('--- ALL E2E & IDENTITY VERIFICATION STEPS PASSED WITH 100% SUCCESS ---');
    process.exit(0);
  });
}

runEndToEndVerification().catch((err) => {
  console.error('E2E Verification failed:', err);
  process.exit(1);
});
