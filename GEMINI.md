# Project Context: xaviers-the-dude
Updated: Sat 10 Jan 2026 21:21:47 GMT
-e 
## Architecture & Tech Stack
-e 
## Internal Documentation
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
# Xavier's The Dude — Improvement Plan

Date: 2025-09-13
Scope: Implement prioritized improvements across architecture, state/persistence, audio, input/UX, scene lifecycle, configuration, testing/tooling, documentation, performance, and compatibility to increase maintainability, reliability, and contributor productivity.

---

## 1) State, Persistence, and Error Handling

Objectives:

- Establish a reliable state reset lifecycle that avoids page reloads.
- Centralize and harden localStorage access with safe defaults and corruption recovery.
- Clarify what is preserved across runs (hiScore, highScores) vs. reset (lives, score, wave, runtime flags).

Planned Changes:

- Add state.reset() in src/state.js to restore runtime defaults. Ensure SceneA → SceneB and post high-score save in SceneHighScore call reset().
- Create src/persistence.js exposing safe get/set/remove JSON helpers with try/catch and defaulting. Use for hiScore and highScores.
- Wrap all JSON.parse/JSON.stringify calls; on parse failure, log a warning, reset to defaults, and proceed.

Rationale:

- Eliminates hidden coupling between scenes that currently rely on partial resets.
- Prevents user-facing breakages from corrupted storage values.

Acceptance Criteria:

- Starting a new run always reinitializes transient state without losing hiScore/highScores.
- Corrupted highScores value recovers automatically with a warning.

Risks/Notes:

- Ensure reset doesn’t wipe user preferences (e.g., mute) if added; keep such prefs in a separate persistence key.

---

## 2) Background Variants and Tooling Hooks

Objectives:

- Use one source of truth for background selection per variant index.
- Expose backgroundForVariant for both runtime and tooling.

Planned Changes:

- Ensure backgrounds.js exports backgroundForVariant (already exists) and attach it to game.config in main.js as config.backgroundForVariant.
- Replace any ad-hoc selection logic in SceneB to call this.sys.game.config.backgroundForVariant.

Rationale:

- Prevents drift and simplifies tests/automation that rely on background selection.

Acceptance Criteria:

- Variant toggling in gameplay and tests yields consistent background keys from the helper.

Risks/Notes:

- Keep src/game_context_configuration.js updated with any background key changes.

---

## 3) Audio: Centralization and Lifecycle

Objectives:

- Centralize music selection and playback lifecycle to prevent overlapping tracks and ensure proper stop on transitions.

Planned Changes:

- Add src/audio.js with a minimal AudioManager:
  - musicForBackground(backgroundKey): string trackKey
  - playMusic(scene, backgroundKey)
  - stopMusic(scene, { fadeMs? })
  - Internally guard against double-play and auto-stop on scene shutdown.
- Integrate in SceneB create/shutdown and in SceneC/SceneHighScore starts to stop existing tracks.

Rationale:

- Encapsulates Phaser.Sound interactions; eliminates leaks and overlapping audio.

Acceptance Criteria:

- No overlapping background music after rapid scene transitions.
- Music consistently matches current background.

Risks/Notes:

- Mind browser autoplay policies—tie initial play to user gesture (pointerup).

---

## 4) Event Listeners and Input Registration

Objectives:

- Prevent memory leaks and duplicate handlers across scene restarts.

Planned Changes:

- In UIScene: remove HUD and wave listeners on shutdown via this.events.once('shutdown', ...).
- In SceneB: register pointerup once in create(), gate by a gameOver boolean or use once('pointerup') where appropriate. Avoid adding in update().

Rationale:

- Ensures deterministic listener lifecycle, reducing bugs post-portal or restarts.

Acceptance Criteria:

- No growth in listener counts after repeated restarts (verify via devtools).

---

## 5) Keyboard Handling Normalization

Objectives:

- Replace keyCode literals with Phaser.Input.Keyboard.KeyCodes and explicit key objects for clarity/testability.

Planned Changes:

- In SceneHighScore: use this.input.keyboard.addKeys to map LEFT/RIGHT/UP, ENTER, SPACE, ESC; use KeyCodes for comparisons.
- Enforce clamping of initials to A–Z and consistent visual highlight.

Rationale:

- Improves readability, reduces cross-browser keycode quirks, and simplifies harness-driven input.

Acceptance Criteria:

- Controls work across browsers; code references KeyCodes exclusively.

---

## 6) Extract Magic Numbers into Config

Objectives:

- Centralize tunables for physics and scoring into src/config.js.

Planned Changes:

- Move velocities, jump strength, gravity, star score value, portal timing, portal life reward to config.
- Replace literals in SceneB and logic.js with named exports.

Rationale:

- Enables consistent tuning and supports future difficulty variants.

Acceptance Criteria:

- No remaining hard-coded numeric constants for these behaviors in scenes/logic.

Risks/Notes:

- Validate gameplay feel after refactor; adjust defaults to preserve current behavior.

---

## 7) Portal Transition Robustness

Objectives:

- Avoid input during transitions and ensure clean restarts.

Planned Changes:

- Disable input during portalJump; re-enable after restart.
- Add onShutdown handlers to destroy physics groups (bombs, stars) and clear timers/tweens.

Rationale:

- Prevents ghost collisions or lingering objects affecting new runs.

Acceptance Criteria:

- Post-portal restart has no leftover physics bodies or handlers; input is gated until ready.

---

## 8) Scene Flow and UX Consistency

Objectives:

- Ensure the scene navigation path is clear and discoverable.

Planned Changes:

- Verify scene keys match constructors (already done).
- Confirm Preloader asset paths exist in index.html delivery.
- In SceneHighScore: add a “Play Again” pointer/key to return to SceneA; allow ESC to cancel submission and return.

Rationale:

- Smooths end-to-end flow and reduces confusion for players.

Acceptance Criteria:

- From SceneC → SceneHighScore → SceneA navigation works via keyboard/mouse.

---

## 9) Testing Harness Expansion

Objectives:

- Increase confidence in state and variant logic without coupling to the full game boot.

Planned Changes:

- test-state-defaults.html: verify state keys and hiScore persistence behavior.
- test-portal-variant.html: simulate portalJump toggling and assert background key/variantIndex across restarts.
- test-background-music.html: verify every background maps to a preloaded music key.

Rationale:

- Manual, focused harnesses accelerate iteration and catch regressions.

Acceptance Criteria:

- Harnesses run under http-server and pass visual/console checks.

Notes:

- Keep such files uncommitted unless made part of ongoing validation.

---

## 10) Linting, Formatting, and Code Style

Objectives:

- Adopt ESLint (ESM, browser, Phaser globals) and optionally Prettier.

Planned Changes:

- Configure ESLint; add npm run lint script.
- Optional: Prettier with rules that avoid changing Phaser pipeline keys.

Rationale:

- Encourages consistent style and catches common issues early.

Acceptance Criteria:

- npm run lint succeeds; CI-ready if desired.

---

## 11) Documentation Enhancements

Objectives:

- Improve onboarding and everyday workflow clarity.

Planned Changes:

- Update README with Known Footguns, harness usage, http-server port behavior, and debug toggles (query param or state.debug).
- Maintain src/game_context_configuration.js parity with actual assets/scenes.

Rationale:

- Reduces setup friction and mismatches between tooling and runtime.

Acceptance Criteria:

- README includes footguns, testing steps, and debug guidance.

---

## 12) Accessibility and UX Improvements

Objectives:

- Provide basic accessibility features and clearer affordances.

Planned Changes:

- Global mute toggle (M) with on-screen indicator; store preference in localStorage.
- Increase fullscreen tap target, add tooltip, and ensure safe-area margins on mobile.

Rationale:

- Respects user preferences and improves mobile usability.

Acceptance Criteria:

- Mute preference persists; fullscreen control is easily tappable and labeled.

---

## 13) Performance and Memory Sanity

Objectives:

- Provide lightweight profiling and ensure resources are freed.

Planned Changes:

- Debug-only FPS text toggle (D when debug=true). Ensure it’s excluded or disabled by default for production.
- Audit scene shutdown: destroy groups, remove timers/tweens, stop sounds.

Rationale:

- Quick diagnostics and reduced long-session degradation.

Acceptance Criteria:

- No memory growth across repeated restarts; FPS overlay appears only in debug mode.

---

## 14) Asset Management Consistency

Objectives:

- Keep asset keys and preload coverage consistent.

Planned Changes:

- Verify every referenced key exists and is preloaded in Preloader.
- Re-check after refactors; update game_context_configuration accordingly.

Rationale:

- Prevents 404s and broken references.

Acceptance Criteria:

- Network panel shows 200/OK for assets; no missing key errors at runtime.

---

## 15) Fullscreen Handling Deduplication

Objectives:

- Avoid repeated fullscreen toggle logic across scenes.

Planned Changes:

- Add src/ui/fullscreen.js helper and reuse in SceneB (button + F key) and any other scenes.

Rationale:

- Single, tested implementation cuts bugs and reduces duplication.

Acceptance Criteria:

- All fullscreen interactions use the helper; behavior consistent across scenes.

---

## 16) Scoreboard UX Polish

Objectives:

- Make high-score entry clearer and more forgiving.

Planned Changes:

- Render legends for “Submit” and “Backspace”; support ESC to cancel to SceneA.
- Ensure initials are A–Z only; highlight current selection.

Rationale:

- Improves usability, lowers confusion during entry.

Acceptance Criteria:

- Users can submit/cancel intuitively; visual feedback is present.

---

## 17) Engines and Browser Compatibility Metadata

Objectives:

- Communicate supported Node version and browsers; reiterate http(s) serving requirement.

Planned Changes:

- Add engines field to package.json ("node": ">=18").
- Document supported browsers and the prohibition on file://.

Rationale:

- Avoids environment-related failures; aligns with guidelines.

Acceptance Criteria:

- package.json shows engines; README documents compatibility.

---

## 18) Optional CI Smoke Checks

Objectives:

- Enable lightweight automated verification without heavy infra.

Planned Changes:

- Add a Playwright script that starts http-server, opens test-highscore.html, and asserts highScores shape.
- Wire npm run ci:smoke; document usage (opt-in).

Rationale:

- Provides a safety net for PRs with minimal overhead.

Acceptance Criteria:

- Script runs locally and in CI; skips on default install unless invoked.

---

## 19) Audio Credits and Licensing

Objectives:

- Ensure license compliance and accurate attributions.

Planned Changes:

- Audit audio usage; update README credits to match Preloader keys.

Rationale:

- Legal clarity and contributor confidence.

Acceptance Criteria:

- README contains a current credits section mapping to actual asset keys.

---

## 20) Defensive Coding and Naming Consistency

Objectives:

- Reduce runtime errors from null references; standardize naming and API docs.

Planned Changes:

- Guard physics callbacks (e.g., player may be destroyed when hitBomb triggers) with early returns.
- Add concise JSDoc headers for public helpers (backgrounds.js, logic.js, theme.js).

Rationale:

- Hardens gameplay code and aids IDE/tooling.

Acceptance Criteria:

- No crashes on edge cases; helpers have brief, accurate JSDoc.

---

## 21) Future Modularization of SceneB

Objectives:

- Prepare to split monolithic gameplay scene into cohesive subsystems while maintaining public API.

Planned Changes:

- Identify seams: spawning, controls, HUD sync, portal transitions.
- Plan extraction into modules or internal classes without changing external scene key/contract.

Rationale:

- Eases testing and future feature work; lowers cognitive load.

Acceptance Criteria:

- Documented plan of extraction with minimal risk; optional initial refactor PRs scoped by subsystem.

---

## Prioritization and Milestones

Phase 1 (Foundations): Sections 1–8, 10–11, 14–15, 20.
Phase 2 (UX/Perf/Docs): Sections 5, 12–13, 16–17, 19.
Phase 3 (Automation/CI/Modularization): Sections 9, 18, 21.

Done Definition per task:

- Code implemented with unit/manual harness coverage where applicable.
- Tooling and docs updated (README, game_context_configuration).
- No regressions observed when running under npm start on latest Chrome.

Constraints and Environment Notes:

- Browser-based ES Modules, served via http-server; avoid bare imports of 'phaser' in runtime modules.
- Assets referenced via root-relative paths from index.html; ensure 200/OK in network tab.
- Keep game_context_configuration.js synchronized for tool integrations; expose backgroundForVariant on game.config for tooling.
- Clear localStorage keys (hiScore, highScores) between tests to avoid flakes.
# Improvement Tasks Checklist

A logically ordered, actionable checklist to improve architecture, code quality, testing, tooling, and documentation of Xavier's The Dude. Check items off as you complete them.

1. [x] Establish explicit state reset lifecycle
   - Create a state.reset() helper in src/state.js to restore defaults (lives, score, wave, flags, references) without reloading the page.
   - Call reset() when going from SceneA -> SceneB for a new run and after saving high scores in SceneHighScore, instead of only zeroing score. Document when to preserve hiScore/highScores.

2. [x] Unify background variant selection via a single hook
   - Export backgroundForVariant from src/backgrounds.js (already exists) and attach it on game.config in src/main.js so scenes can call this.sys.game.config.backgroundForVariant.
   - Replace any ad-hoc variant-to-background logic in SceneB with the unified helper only.

3. [x] Centralize music selection and lifecycle
   - Add a small audio manager module (src/audio.js) that wraps sound add/stop and maps background -> track using musicForBackground.
   - Ensure tracks stop on scene shutdown/transition (SceneB shutdown, SceneC/SceneHighScore start). Guard against multiple overlapping sounds.

4. [x] Clean up global event listeners to prevent leaks
   - In UIScene, remove listeners on scene shutdown (this.events.once('shutdown', ...)) for hud:\* and wave:start.
   - In SceneB, avoid re-adding input handlers inside update when gameOver; move pointerup registration to create() gated by a gameOver flag or use once('pointerup').

5. [x] Normalize keyboard handling
   - Replace raw keyCode checks in SceneHighScore with Phaser.Input.Keyboard.KeyCodes constants.
   - Add explicit cursors and Enter/Space keys via this.input.keyboard.addKeys for clarity and testability.

6. [x] Extract magic numbers to config
   - Move movement velocities, jump strength, gravity, star score value, portal timing, and portal life reward into src/config.js.
   - Replace literals in SceneB and logic.js with named exports from config.

7. [x] Make portal transition robust
   - Ensure SceneB disables input during portal transition and resumes cleanly after restart.
   - Verify bombs/stars/groups are cleared/GC’d to avoid collisions after portal. Add onShutdown handlers to destroy physics groups.

8. [x] Scene flow and consistency audit
   - Confirm scene keys match constructor strings (done) and that index.html loads all assets used by Preloader paths.
   - Ensure SceneC -> SceneHighScore -> SceneA navigation path is clear and documented; add a “Play Again” pointer/key in SceneHighScore to return to SceneA.

9. [x] Persistence utilities
   - Create a small module src/persistence.js for localStorage get/set with try/catch and defaulting.
   - Use it in state.js (hiScore) and SceneHighScore (highScores) to avoid duplication and ensure JSON safety.

10. [x] Testing harness expansion
    - [x] Add test-state-defaults.html to validate state keys and hiScore load/save behavior (see guidelines 2.3); do not commit permanently unless kept valuable.
    - [x] Add test-portal-variant.html to simulate portalJump toggling and assert background key and variantIndex changes across restarts.
    - [x] Add test-background-music.html to verify musicForBackground provides valid preloaded keys for each background.

11. [x] Linting and formatting
    - [x] Introduce ESLint (ESM, browser, Phaser globals) and a simple npm script (npm run lint).
    - [x] Optionally add Prettier with sensible defaults; ensure it doesn’t break Phaser pipeline class strings.

12. [x] Document development workflow enhancements
    - [x] Update README with Known Footguns (from .junie/guidelines.md), testing harness usage, and the http-server port note.
    - [x] Add a section on enabling debug via a query param or state.debug toggle.

13. [x] Accessibility and UX improvements
    - [x] Add a global mute toggle (M key) with a small on-screen indicator; store preference in localStorage.
    - [x] Increase fullscreen button tap target, add a tooltip/hint; ensure safe-area margins on mobile.

14. [x] Performance and memory sanity checks
    - [x] Provide a simple FPS text toggle (D key when debug=true) for profiling; ensure it’s removed in production.
    - [x] Audit texture/sound unloading on scene shutdown to prevent leaks (destroy groups, remove timers/tweens where needed).

15. [x] Asset management consistency
    - [x] Verify all asset keys referenced in scenes exist and are preloaded in Preloader (bounce sound is present; re-check any newly added keys when refactoring).
    - [x] Keep src/game_context_configuration.js in sync when keys/scenes change.

16. [x] Reduce duplication in fullscreen handling
    - Extract fullscreen toggle logic into a helper (src/ui/fullscreen.js) and reuse in SceneB (button + F key).

17. [x] Improve scoreboard UX
    - [x] In SceneHighScore, render a “Submit” and “Backspace” legend; allow ESC to cancel and return to SceneA.
    - [x] Clamp initials to A–Z consistently and visually highlight the selection.

18. [x] Add engine and browser compatibility metadata
    - [x] Add engines field to package.json ("node": ">=18").
    - [x] Document supported browsers and the requirement to serve over http(s), not file://.

19. [ ] Optional CI smoke checks
    - Add a lightweight Playwright script that launches http-server, opens test-highscore.html, and asserts highScores localStorage shape.
    - Wire as npm run ci:smoke and document usage (skip in default install path).

20. [ ] Update credits and licensing notes for audio assets
    - Confirm all audio files used have proper attribution or licensing noted in README; ensure credits match actual keys in Preloader.

21. [x] Tooling hook alignment
    - Expose backgroundForVariant on game.config in main.js so automation tools (game_context_configuration) expectations match runtime.
    - When adding scenes or assets, update src/game_context_configuration.js accordingly.

22. [x] Error handling polish
    - Wrap localStorage JSON.parse with fallbacks; recover from corrupted values by resetting to defaults and logging a warning.

23. [x] Defensive coding in physics callbacks
    - Guard against null/undefined (e.g., player may be destroyed when hitBomb triggers); early-return with checks in logic.js callbacks.

24. [x] Consistent naming and comments
    - Ensure scene file names and class names align (already consistent); add concise JSDoc atop public helpers (backgrounds.js, logic.js, theme.js).

25. [ ] Prepare for future modularization
    - Consider splitting SceneB into smaller systems (spawning, controls, hud sync) to reduce method size; keep public API stable.
