// Configuration for the global high-score service.
// Values are intentionally small and overridable via query params for dev/testing.

function queryParam(name) {
  try {
    const params = new URLSearchParams(location.search);
    return params.get(name);
  } catch (e) {
    console.warn('Error reading URL search params:', e);
    return null;
  }
}

const defaultBase = '/api/highscores';
const toNumber = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const HIGHSCORE_API_BASE = queryParam('hsBase') || defaultBase;
export const HIGHSCORE_LIMIT = toNumber(queryParam('hsLimit'), 20);
export const HIGHSCORE_REQUEST_TIMEOUT_MS = toNumber(
  queryParam('hsTimeout'),
  5000,
);
export const HIGHSCORE_CACHE_MS = toNumber(queryParam('hsCacheMs'), 60000);
