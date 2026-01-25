// Global high-score service wrapper with timeout, validation, and caching.
// Provides best-effort fetch/submit helpers that gracefully fall back on failure.

import {
  HIGHSCORE_API_BASE,
  HIGHSCORE_LIMIT,
  HIGHSCORE_REQUEST_TIMEOUT_MS,
  HIGHSCORE_CACHE_MS,
} from '../highscore_config.js';
import { state } from '../state.js';

const cache = {
  entries: null,
  timestamp: 0,
};

/**
 * Keep initials to A-Z, uppercase, max 3 chars.
 */
export function sanitizeInitials(initials) {
  const safe = (initials || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);
  return safe || 'UNK';
}

/**
 * Ensure score is a non-negative integer.
 */
export function normalizeScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function now() {
  return Date.now();
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = HIGHSCORE_REQUEST_TIMEOUT_MS,
) {
  if (timeoutMs <= 0) return fetch(url, options);
  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const merged = controller
      ? { ...options, signal: controller.signal }
      : options;
    return await fetch(url, merged);
  } finally {
    if (id) clearTimeout(id);
  }
}

function coerceEntries(raw, limit) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      initials: sanitizeInitials(item?.initials),
      score: normalizeScore(item?.score),
      createdAt: item?.createdAt || null,
    }))
    .filter((item) => item.score > 0 && item.initials)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function fetchGlobalHighScores({
  baseUrl = HIGHSCORE_API_BASE,
  limit = HIGHSCORE_LIMIT,
} = {}) {
  try {
    if (cache.entries && now() - cache.timestamp < HIGHSCORE_CACHE_MS) {
      return { entries: cache.entries, fromCache: true };
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}limit=${encodeURIComponent(limit)}&_t=${now()}`;
    if (state.debug) console.log(`Fetching global high scores from: ${url}`);
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`Global high-score fetch failed with status: ${res.status} ${res.statusText}`);
      throw new Error(`HTTP ${res.status}`);
    }

    let data = await res.json();
    const entries = coerceEntries(data, limit);
    cache.entries = entries;
    cache.timestamp = now();
    return { entries, fromCache: false };
  } catch (_e) {
    console.warn('Error loading global high scores:', _e);
    throw _e;
  }
}

export async function submitGlobalHighScore({
  baseUrl = HIGHSCORE_API_BASE,
  initials,
  score,
}) {
  const safeInitials = sanitizeInitials(initials);
  const safeScore = normalizeScore(score);
  try {
    const res = await fetchWithTimeout(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ initials: safeInitials, score: safeScore }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const payload = await res.json();
        detail = payload?.error || JSON.stringify(payload);
      } catch (_e) {
        // ignore parse errors
      }
      throw new Error(`Submit failed: ${res.status} ${detail}`);
    }

    // Invalidate cache so the next fetch reflects the new score.
    cache.entries = null;
    cache.timestamp = 0;
    return true;
  } catch (e) {
    console.warn('Global high-score submit failed:', e);
    throw e;
  }
}
