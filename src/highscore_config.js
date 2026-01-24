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

const toNumber = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Resolve the default base path relative to the current script's parent directory if possible,
// or use a robust relative path that handles missing trailing slashes in the URL.
const getBase = () => {
  const hsBase = queryParam('hsBase');
  if (hsBase) return hsBase;

  // If the path doesn't end in a slash and doesn't look like a file (e.g. .html),
  // we might need to be careful. But 'api/index.php' is usually fine if we're at the root index.
  // Better yet, just use the relative path but allow for easier debugging.
  return 'api/index.php';
};

export const HIGHSCORE_API_BASE = getBase();
export const HIGHSCORE_LIMIT = toNumber(queryParam('hsLimit'), 20);
export const HIGHSCORE_REQUEST_TIMEOUT_MS = toNumber(
  queryParam('hsTimeout'),
  5000,
);
export const HIGHSCORE_CACHE_MS = toNumber(queryParam('hsCacheMs'), 60000);
