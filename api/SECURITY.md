# Highscore API Security Notes

This API implements a practical baseline for public-repo safety where client code is public and cannot hold long-term secrets.

## Security design summary

- **Strict input validation**
  - `initials`: 1-3 ASCII letters (`A-Z` after normalization)
  - `score`: integer within configured bounds
  - optional `metadata`: bounded object (key/value limits, primitive values only)
- **Freshness + replay resistance**
  - submit includes `timestamp` and `nonce`
  - timestamp skew is enforced
  - nonce is unique per session (replays rejected)
- **Short-lived submit challenge**
  - client requests `GET ?action=challenge`
  - server returns short-lived `sessionId` + per-session `submitToken`
  - submit request must include HMAC signature using this token
- **Signature verification**
  - server verifies HMAC over canonical payload
  - bad signatures are rejected
- **Rate limiting**
  - enforced on submit endpoint per client IP and time window
- **CORS allowlist**
  - only origins listed in `HIGHSCORE_ALLOWED_ORIGINS` are allowed

## Required environment variables

See `.env.example` for complete set and defaults.

Primary variables:
- `HIGHSCORE_ALLOWED_ORIGINS`
- `HIGHSCORE_SCORE_MIN`
- `HIGHSCORE_SCORE_MAX`
- `HIGHSCORE_MAX_SCORE_DELTA`
- `HIGHSCORE_MAX_TIMESTAMP_SKEW_SECONDS`
- `HIGHSCORE_NONCE_TTL_SECONDS`
- `HIGHSCORE_SESSION_TTL_SECONDS`
- `HIGHSCORE_RATE_LIMIT_WINDOW_SECONDS`
- `HIGHSCORE_RATE_LIMIT_MAX_REQUESTS`

## Local/dev setup

1. Configure env vars using one of these methods:
   - PHP host environment variables (preferred for production), or
   - local dotenv files loaded by the API (`api/.env.local`, `api/.env`, repo `.env.local`, repo `.env`).
2. Use `.env.example` as the template and never commit real secrets.
3. Serve the project through PHP (example):
   ```sh
   HIGHSCORE_ALLOWED_ORIGINS=http://localhost:8080 php -S 127.0.0.1:8123 -t .
   ```
4. Point the game to the API endpoint, e.g. `?hsBase=http://127.0.0.1:8123/api/index.php`.

## Threat model caveat

This is **best practical baseline**, not perfect anti-cheat.

Because game/client code is public, a motivated attacker can script legitimate challenge+sign flows from an allowed origin. Security therefore relies on:
- server-side validation,
- conservative bounds and session sanity checks,
- replay controls,
- and rate limiting.

For stronger anti-cheat guarantees, game-event attestation and/or trusted server-authoritative gameplay would be required.
