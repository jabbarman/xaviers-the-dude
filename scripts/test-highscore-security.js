#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHmac, createHash } from 'node:crypto';
import { rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const apiDb = path.join(repoRoot, 'api', 'highscores.sqlite');
const host = '127.0.0.1';
const port = 8123;
const baseUrl = `http://${host}:${port}/api/index.php`;
const allowedOrigin = 'http://localhost:8080';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServerReady(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch (_e) {
      // keep polling
    }
    await sleep(100);
  }
  throw new Error('PHP server did not start in time');
}

async function getChallenge() {
  const res = await fetch(`${baseUrl}?action=challenge`, {
    headers: { Origin: allowedOrigin, Accept: 'application/json' },
  });
  assert(res.ok, `Challenge expected 200, got ${res.status}`);
  return res.json();
}

function signPayload(token, payload) {
  const metadataCanonical = payload.metadata
    ? JSON.stringify(
        Object.keys(payload.metadata)
          .sort()
          .reduce((acc, key) => {
            acc[key] = payload.metadata[key];
            return acc;
          }, {}),
      )
    : '';

  const metaHash = createHash('sha256').update(metadataCanonical).digest('hex');
  const stringToSign = [
    payload.sessionId,
    String(payload.timestamp),
    payload.nonce,
    payload.initials,
    String(payload.score),
    metaHash,
  ].join('|');

  return createHmac('sha256', token).update(stringToSign).digest('hex');
}

async function postSubmit(payload) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Origin: allowedOrigin,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let body = {};
  try {
    body = await res.json();
  } catch (_e) {
    // ignore
  }

  return { status: res.status, body };
}

async function run() {
  const phpCheck = spawnSync('php', ['-v'], { stdio: 'ignore' });
  if (phpCheck.error || phpCheck.status !== 0) {
    throw new Error('php executable not found; install PHP CLI to run security API tests');
  }

  if (existsSync(apiDb)) {
    rmSync(apiDb);
  }

  const php = spawn(
    'php',
    ['-S', `${host}:${port}`, '-t', repoRoot],
    {
      cwd: repoRoot,
      env: {
        ...globalThis.process.env,
        HIGHSCORE_ALLOWED_ORIGINS: allowedOrigin,
        HIGHSCORE_SCORE_MIN: '1',
        HIGHSCORE_SCORE_MAX: '1000000',
        HIGHSCORE_MAX_SCORE_DELTA: '500000',
        HIGHSCORE_MAX_TIMESTAMP_SKEW_SECONDS: '30',
        HIGHSCORE_NONCE_TTL_SECONDS: '120',
        HIGHSCORE_SESSION_TTL_SECONDS: '180',
        HIGHSCORE_RATE_LIMIT_WINDOW_SECONDS: '60',
        HIGHSCORE_RATE_LIMIT_MAX_REQUESTS: '12',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let stderr = '';
  php.stderr.on('data', (d) => {
    stderr += String(d);
  });

  try {
    await waitForServerReady();

    // 1) valid submit accepted
    const c1 = await getChallenge();
    const validPayload = {
      initials: 'ABC',
      score: 100,
      metadata: { wave: 3, mode: 'classic' },
      sessionId: c1.sessionId,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce_valid_1',
    };
    validPayload.signature = signPayload(c1.submitToken, validPayload);
    const validRes = await postSubmit(validPayload);
    assert(validRes.status === 201, `valid submit expected 201, got ${validRes.status}`);

    // 2) invalid schema rejected
    const c2 = await getChallenge();
    const invalidPayload = {
      initials: '1234',
      score: 200,
      sessionId: c2.sessionId,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce_schema_1',
    };
    invalidPayload.signature = signPayload(c2.submitToken, invalidPayload);
    const invalidRes = await postSubmit(invalidPayload);
    assert(invalidRes.status === 422, `invalid schema expected 422, got ${invalidRes.status}`);

    // 3) stale timestamp rejected
    const c3 = await getChallenge();
    const stalePayload = {
      initials: 'DEF',
      score: 300,
      sessionId: c3.sessionId,
      timestamp: Math.floor(Date.now() / 1000) - 300,
      nonce: 'nonce_stale_1',
    };
    stalePayload.signature = signPayload(c3.submitToken, stalePayload);
    const staleRes = await postSubmit(stalePayload);
    assert(staleRes.status === 401, `stale timestamp expected 401, got ${staleRes.status}`);

    // 4) nonce replay rejected
    const c4 = await getChallenge();
    const replayPayload = {
      initials: 'GHI',
      score: 400,
      sessionId: c4.sessionId,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce_replay_1',
    };
    replayPayload.signature = signPayload(c4.submitToken, replayPayload);
    const replayFirst = await postSubmit(replayPayload);
    assert(replayFirst.status === 201, `first replay attempt expected 201, got ${replayFirst.status}`);
    const replaySecond = await postSubmit(replayPayload);
    assert(replaySecond.status === 409, `replay second expected 409, got ${replaySecond.status}`);

    // 5) bad signature rejected
    const c5 = await getChallenge();
    const badSigPayload = {
      initials: 'JKL',
      score: 500,
      sessionId: c5.sessionId,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'nonce_badsig_1',
      signature: 'deadbeef',
    };
    const badSigRes = await postSubmit(badSigPayload);
    assert(badSigRes.status === 401, `bad signature expected 401, got ${badSigRes.status}`);

    // 6) rate limit behavior (burst until at least one 429)
    let saw429 = false;
    let lastStatus = 0;

    for (let i = 1; i <= 20; i += 1) {
      const rl = await getChallenge();
      const payload = {
        initials: 'RLT',
        score: 900 + i,
        sessionId: rl.sessionId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: `nonce_rl_${i}`,
      };
      payload.signature = signPayload(rl.submitToken, payload);

      const res = await postSubmit(payload);
      lastStatus = res.status;
      if (res.status === 429) {
        saw429 = true;
        break;
      }
      assert(res.status === 201, `rate limit warmup req${i} expected 201, got ${res.status}`);
    }

    assert(saw429, `rate limit expected a 429 during burst, last status ${lastStatus}`);

    console.warn('PASS: highscore security checks');
  } finally {
    php.kill('SIGTERM');
    await sleep(200);
    if (existsSync(apiDb)) {
      rmSync(apiDb);
    }
    if (stderr.trim()) {
      // keep this for troubleshooting only; does not fail test on its own
      console.warn('php-stderr:', stderr.trim().split('\n').slice(-3).join(' | '));
    }
  }
}

run().catch((e) => {
  console.error('FAIL:', e.message);
  globalThis.process.exit(1);
});
