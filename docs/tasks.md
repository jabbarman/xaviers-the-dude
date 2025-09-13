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

4. [ ] Clean up global event listeners to prevent leaks
   - In UIScene, remove listeners on scene shutdown (this.events.once('shutdown', ...)) for hud:* and wave:start.
   - In SceneB, avoid re-adding input handlers inside update when gameOver; move pointerup registration to create() gated by a gameOver flag or use once('pointerup').

5. [ ] Normalize keyboard handling
   - Replace raw keyCode checks in SceneHighScore with Phaser.Input.Keyboard.KeyCodes constants.
   - Add explicit cursors and Enter/Space keys via this.input.keyboard.addKeys for clarity and testability.

6. [ ] Extract magic numbers to config
   - Move movement velocities, jump strength, gravity, star score value, portal timing, and portal life reward into src/config.js.
   - Replace literals in SceneB and logic.js with named exports from config.

7. [ ] Make portal transition robust
   - Ensure SceneB disables input during portal transition and resumes cleanly after restart.
   - Verify bombs/stars/groups are cleared/GC’d to avoid collisions after portal. Add onShutdown handlers to destroy physics groups.

8. [ ] Scene flow and consistency audit
   - Confirm scene keys match constructor strings (done) and that index.html loads all assets used by Preloader paths.
   - Ensure SceneC -> SceneHighScore -> SceneA navigation path is clear and documented; add a “Play Again” pointer/key in SceneHighScore to return to SceneA.

9. [ ] Persistence utilities
   - Create a small module src/persistence.js for localStorage get/set with try/catch and defaulting.
   - Use it in state.js (hiScore) and SceneHighScore (highScores) to avoid duplication and ensure JSON safety.

10. [ ] Testing harness expansion
    - Add test-state-defaults.html to validate state keys and hiScore load/save behavior (see guidelines 2.3); do not commit permanently unless kept valuable.
    - Add test-portal-variant.html to simulate portalJump toggling and assert background key and variantIndex changes across restarts.
    - Add test-background-music.html to verify musicForBackground provides valid preloaded keys for each background.

11. [ ] Linting and formatting
    - Introduce ESLint (ESM, browser, Phaser globals) and a simple npm script (npm run lint).
    - Optionally add Prettier with sensible defaults; ensure it doesn’t break Phaser pipeline class strings.

12. [ ] Document development workflow enhancements
    - Update README with Known Footguns (from .junie/guidelines.md), testing harness usage, and the http-server port note.
    - Add a section on enabling debug via a query param or state.debug toggle.

13. [ ] Accessibility and UX improvements
    - Add a global mute toggle (M key) with a small on-screen indicator; store preference in localStorage.
    - Increase fullscreen button tap target and add a tooltip/hint; ensure safe-area margins on mobile.

14. [ ] Performance and memory sanity checks
    - Provide a simple FPS text toggle (D key when debug=true) for profiling; ensure it’s removed in production.
    - Audit texture/sound unloading on scene shutdown to prevent leaks (destroy groups, remove timers/tweens where needed).

15. [ ] Asset management consistency
    - Verify all asset keys referenced in scenes exist and are preloaded in Preloader (bounce sound is present; re-check any newly added keys when refactoring).
    - Keep src/game_context_configuration.js in sync when keys/scenes change.

16. [ ] Reduce duplication in fullscreen handling
    - Extract fullscreen toggle logic into a helper (src/ui/fullscreen.js) and reuse in SceneB (button + F key).

17. [ ] Improve scoreboard UX
    - In SceneHighScore, render a “Submit” and “Backspace” legend; allow ESC to cancel and return to SceneA.
    - Clamp initials to A–Z consistently and visually highlight the selection.

18. [ ] Add engine and browser compatibility metadata
    - Add engines field to package.json ("node": ">=18").
    - Document supported browsers and the requirement to serve over http(s), not file://.

19. [ ] Optional CI smoke checks
    - Add a lightweight Playwright script that launches http-server, opens test-highscore.html, and asserts highScores localStorage shape.
    - Wire as npm run ci:smoke and document usage (skip in default install path).

20. [ ] Update credits and licensing notes for audio assets
    - Confirm all audio files used have proper attribution or licensing noted in README; ensure credits match actual keys in Preloader.

21. [ ] Tooling hook alignment
    - Expose backgroundForVariant on game.config in main.js so automation tools (game_context_configuration) expectations match runtime.
    - When adding scenes or assets, update src/game_context_configuration.js accordingly.

22. [ ] Error handling polish
    - Wrap localStorage JSON.parse with fallbacks; recover from corrupted values by resetting to defaults and logging a warning.

23. [ ] Defensive coding in physics callbacks
    - Guard against null/undefined (e.g., player may be destroyed when hitBomb triggers); early-return with checks in logic.js callbacks.

24. [ ] Consistent naming and comments
    - Ensure scene file names and class names align (already consistent); add concise JSDoc atop public helpers (backgrounds.js, logic.js, theme.js).

25. [ ] Prepare for future modularization
    - Consider splitting SceneB into smaller systems (spawning, controls, hud sync) to reduce method size; keep public API stable.
