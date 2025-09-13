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
