# Global High-Score Board — Requirements

## Overview

Add a global (server-backed) high-score board that works alongside the existing local high-score flow. Players should see the top global scores, submit their own, and gracefully fall back to local storage when offline.

## Objectives

- Display a shared leaderboard sourced from a backend.
- Allow submitting scores with initials after a run.
- Preserve offline/local behavior and avoid blocking the current game loop.
- Keep storage safe (validate inputs, handle failures, prevent corruption).

## Scope

- Client changes inside Phaser scenes and persistence helpers.
- A minimal REST-ish contract for a backend endpoint; real backend may be mocked during dev.
- UX updates in `SceneHighScore` for loading/submission states and error/fallback messages.

Out of scope (for this increment):

- Authentication or anti-cheat hardening.
- Social/sharing features or pagination beyond a small top list (e.g., top 20).
- Admin tools for moderation.

## User Stories

- As a player, I can view the global top scores when the game loads the high-score scene.
- As a player finishing a run, I can submit my score and initials to the global board.
- As a player with no network, I still see my local top scores and am told the global board is unavailable.
- As a returning player, I see my best score reflected locally even if the global service is down.

## Functional Requirements

- Fetch global leaderboard on entering `SceneHighScore`; show a loading state while in-flight.
- Submit a score (initials + numeric score) after the player finishes input; show a submitting state.
- On fetch/submit failure, show a brief error message and fall back to local scores without blocking replay.
- Clamp initials to 3 chars A–Z and strip/escape unsafe characters before submission.
- Merge display: prefer global results when available; otherwise show local top 5; optionally show “Your best local” row if global excludes the player.
- Preserve existing local high-score persistence as a fallback and for offline viewing.
- Do not degrade frame-rate or input during gameplay; network calls happen only in high-score scenes or via background preload.

## Data Model & API Contract (proposed)

- Endpoint: `GET /api/highscores?limit=20` → `[{ initials: "ABC", score: 12345, createdAt: "2025-09-13T12:00:00Z" }]`
- Endpoint: `POST /api/highscores` with body `{ initials: "ABC", score: 12345 }` → `201` and echoed record or status.
- Validation rules: initials 1–3 uppercase A–Z, score is positive integer; server trims/uppercases.
- Timeouts: client treats requests >5s as failure and falls back silently with a user-facing notice.
- Errors: server returns JSON `{ error: string }`; client logs to console and shows a lightweight message.
- Dev/mock: allow swapping base URL via config (env var or query param) and provide a mock/fake server script for local testing.

## Client Behavior Changes

- Add a small fetch wrapper in `persistence.js` or a new `services/highscores.js` to handle GET/POST with timeouts and JSON guardrails.
- `SceneHighScore`:
  - Load global scores on create; render loading state; then render board or fallback notice.
  - On submit, attempt POST; on success, refresh the displayed global list; on failure, keep local submission path unchanged.
  - Show minimal status text: “Loading global board…”, “Global board unavailable, showing local scores”, “Submitted!”.
- Keep keyboard/mouse flow identical; submission occurs after initials are confirmed.

## Persistence, Security, Privacy

- Never store PII beyond initials and score; no identifiers tied to the player.
- Sanitize initials client-side; reject non A–Z; trim length.
- Do not write partial/corrupted JSON to localStorage; use existing safe helpers.
- Allow user to clear local data via existing reset path; global data is server-owned.

## Error Handling & Resilience

- Catch and log fetch/parse errors; display a short, non-blocking notice in the HUD area of the high-score scene.
- Fallback order: (1) global fetch success → show global; (2) global failure → show local high scores only.
- Submission: on failure, keep local flow unchanged and surface “Failed to submit to global board”.
- Guard against duplicate submissions by disabling submit until the request resolves.

## Performance

- Limit requests: one GET per entry into high-score scene; one POST per submission attempt.
- Debounce or cache the latest global list per session to avoid spamming on rapid restarts.
- Keep payloads small (top 20 max; initials + score only).

## Configuration

- Base URL configurable via `game_context_configuration.js` or a small config module; default to relative `/api/highscores`.
- Timeout and limit configurable constants.
- Provide instructions for running with a mock server (e.g., `npm run mock:highscores`).

## UX & Copy

- States: Loading, Loaded, Error/Fallback, Submitting, Submitted.
- Messaging examples:
  - Loading: “Loading global board…”
  - Error: “Global board unavailable—showing local scores.”
  - Submit success: “Submitted to global board!”
  - Submit failure: “Could not submit—local score saved.”
- Keep layout consistent with existing bitmap font; avoid intrusive modals.

## Testing Requirements

- Unit: validation of initials/score; fetch wrapper handles timeouts and bad JSON.
- Integration/manual: happy-path fetch and submit against mock server; offline/failure fallback; duplicate submit blocking.
- Regression: ensure local high-score flow still works without network.
- Optional: add a small HTML harness or Playwright script hitting the mock endpoint.

## Rollout & Migration

- Default to “global enabled”; when no backend is configured or reachable, auto-fallback to local with notice.
- No data migration needed; local storage remains unchanged.
- Document how to run the mock server and how to toggle the feature for local dev.

## Open Questions

- Should we show both global and local panels side-by-side, or only global with a “Your best local” row?
- Do we need rate limiting client-side to prevent spamming POST?
- Should we cap submissions per score per session to reduce duplicates?
