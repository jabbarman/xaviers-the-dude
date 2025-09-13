// Safe localStorage helpers with JSON handling and defaults.
// These utilities guard against exceptions (e.g., quota, disabled storage)
// and corrupted values, returning caller-provided defaults.

/**
 * Get a string value from localStorage with a default.
 */
export function getString(key, defaultValue = '') {
  try {
    const v = localStorage.getItem(key);
    return v == null ? defaultValue : v;
  } catch (e) {
    console.warn('localStorage getString failed for', key, e);
    return defaultValue;
  }
}

/**
 * Set a string value in localStorage (best-effort).
 */
export function setString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage setString failed for', key, e);
  }
}

/**
 * Get a JSON-parsed value from localStorage; on parse errors, reset the key and return default.
 */
export function getJSON(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch (parseErr) {
      console.warn('localStorage getJSON parse failed for', key, parseErr, '— resetting to default');
      // Attempt to self-heal corrupted values
      setJSON(key, defaultValue);
      return defaultValue;
    }
  } catch (e) {
    console.warn('localStorage getJSON failed for', key, e);
    return defaultValue;
  }
}

/**
 * Set a JSON-serialized value in localStorage (best-effort).
 */
export function setJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage setJSON failed for', key, e);
  }
}
