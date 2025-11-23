#!/usr/bin/env node
// Simple in-memory high-score mock server for local development.
// Usage: node scripts/mock-highscores.js [port]

import http from 'http';
import { parse } from 'url';

const DEFAULT_PORT = process.env.PORT || process.argv[2] || 3000;
let scores = [
  { initials: 'ABC', score: 12000, createdAt: new Date(Date.now() - 600000).toISOString() },
  { initials: 'DEF', score: 9000, createdAt: new Date(Date.now() - 1200000).toISOString() },
  { initials: 'GHI', score: 6000, createdAt: new Date(Date.now() - 1800000).toISOString() },
];

function sanitizeInitials(initials) {
  return (initials || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'UNK';
}

function normalizeScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (pathname === '/api/highscores' && req.method === 'GET') {
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const payload = scores
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return sendJson(res, 200, payload);
  }

  if (pathname === '/api/highscores' && req.method === 'POST') {
    const body = await parseBody(req);
    const initials = sanitizeInitials(body.initials);
    const score = normalizeScore(body.score);
    if (score <= 0) {
      return sendJson(res, 400, { error: 'score must be > 0' });
    }
    const entry = { initials, score, createdAt: new Date().toISOString() };
    scores.push(entry);
    scores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
    return sendJson(res, 201, entry);
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(DEFAULT_PORT, () => {
  console.log(`Mock high-score server listening on http://localhost:${DEFAULT_PORT}`);
});
