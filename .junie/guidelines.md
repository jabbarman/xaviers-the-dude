Project: Xavier's The Dude — Developer Guidelines

Audience: Advanced contributors maintaining or extending the Phaser 3 codebase in this repository.

1. Build and Configuration

- Runtime: Browser-based ES Modules with Phaser 3.90.0. No bundler required.
- Node requirements: Node >= 18 recommended. NPM installs dev http server and Phaser.
- Install: npm install
- Start local server: npm start
  - This runs http-server -o and typically opens http://localhost:8080.
- Entry points:
  - index.html loads src/main.js and assets/.
  - ES module root: src/ (scenes, shared state, config, logic). package.json has "type":"module".
- Asset paths:
  - All assets are under /assets and referenced by Phaser cache keys. Ensure relative paths from index.html context (root) remain stable when adding files.
- Game context configuration (for tooling): src/game_context_configuration.js describes scenes, state, inputs, assets, and expected flows. This file is tool-facing only and does not alter runtime; keep it in sync with actual game modules when you add or rename scenes/assets.

2. Running and Writing Tests
   Testing model in this project is browser-harness based (no Jest/Karma). Tests are small HTML pages and/or JS harnesses run in a browser under the same http-server.

2.1 Existing test harness

- High score test: test-highscore.html with companion test-highscore.js (logic mirrored inline in the HTML; JS file demonstrates programmatic flow).
- How to run:
  1. Start server: npm start
  2. Navigate to http://localhost:8080/test-highscore.html
  3. Use on-page controls to:
     - View current scores from localStorage (key: highScores)
     - Load preset scores
     - Add a new score and see if it qualifies/top-5 truncated
     - Reset and populate defaults
- Console-only variant: Open http://localhost:8080/test-highscore.js in devtools Sources and Run, or import into a scratch HTML page; it uses localStorage and logs to console.

  2.2 Adding new tests (recommended pattern)

- Create a minimal HTML harness alongside the game using the same http server. Keep tests independent from Phaser game boot to avoid polluting runtime.
- Suggested structure for a new test harness file:
  - test-<feature>.html (UI to drive the feature)
  - Optional test-<feature>.js (shared test helpers)
- Keep state in localStorage or in-memory; do not write to game code for test scaffolding.
- Interacting with game code:
  - For pure data modules (e.g., state, logic helpers), you can import ES modules directly via <script type="module"> from src/... paths.
  - For Phaser scene interactions, spin up a minimal Phaser.Game instance in the test page with only the necessary scenes loaded, or use the game_context_configuration.js to understand scene keys, inputs, and cache keys.

  2.3 Example: Minimal test you can add temporarily
  (Do not commit such files permanently unless they provide recurring value.)

- Create test-state-defaults.html that imports src/state.js and verifies keys and default hiScore persistence behavior by manipulating localStorage. Steps:
  - Start server: npm start
  - Open the test file at http://localhost:8080/test-state-defaults.html
  - Execute: verify that hiScore is read/written and that top-level state keys exist as documented in game_context_configuration.js (debug, starsPerWave, lives, score, hiScore, wave, etc.).
- After validating behavior, delete the temporary file(s) to keep repo clean.

  2.4 CI suitability

- The current approach is manual/interactive. If you need headless checks:
  - Use a headless browser (Playwright or Puppeteer) driving http-server and navigating to the harness pages, asserting DOM text or localStorage content. Keep such scripts outside production bundle; wire in a package.json script if adopted widely.

3. Additional Development Information

- Code style:
  - ES Modules only; package.json enforces ESM via "type":"module".
  - Scene keys must match Phaser.Scene super("Key") usage. Maintain asset keys consistently; update preload/loaders where necessary.
  - Prefer small modules in src/ (scenes/\*, logic.js, backgrounds.js, theme.js, state.js, config.js, main.js). Avoid circular imports.
- Conventions captured in src/game_context_configuration.js:
  - Scenes: SceneA (start), SceneB (gameplay), SceneC (optional game-over), SceneHighScore (entry input). Some optional overlays (UIScene, PortalScene) may exist.
  - Flow: Start at SceneA; pointerup -> SceneB; SceneB emits gameOver -> SceneC (optional); portalJump loops SceneB with variantIndex changes; UIScene overlays are associated with SceneB and stopped in SceneHighScore.
  - State and persistence: localStorage keys hiScore and highScores. Global HUD event names include hud:lives, hud:score, hud:hiscore, hud:wave, and wave:start. Variant and portal behavior noted.
  - Inputs: pointerup and keyboard (LEFT/RIGHT/UP, F in SceneB, ENTER/SPACE/ARROWS in SceneHighScore).
  - Assets: bitmap font arcade; spritesheets dude, star; FX audio keys gameOver, ping, explode, portalJump; images for background/platforms including optional variants.
- Running the game reliably:
  - Because modules are loaded by the browser, you must serve over http(s). Direct file:// opening will fail due to ES module and asset origin restrictions.
  - http-server chooses a port automatically if 8080 is taken; watch terminal for the actual port.
- Debugging tips:
  - Use devtools network tab to verify assets are 200/OK. Wrong paths usually 404; cross-check with index.html <script type="module"> paths.
  - Toggle debug overlays or logs via the state.debug flag (if present in src/state.js); search for references before relying on it.
  - When modifying physics or movement constants, consult src/config.js and the gameplay and movement hints in game_context_configuration.js to keep automation scripts stable.
- Adding assets:
  - Place under assets/\*\* with predictable key naming. Update the relevant scene preload() and the assets section in game_context_configuration.js if tools rely on it.

4. Known Footguns

- Do not import using bare specifiers (e.g., import Phaser from 'phaser') inside browser-targeted modules unless you bundle. Use window.Phaser via phaser.min.js or ensure your setup supports module resolution. This project uses installed phaser for development but serves phaser.min.js at root for direct browser usage.
- Ensure cross-origin compatibility for audio; some browsers block autoplay. Consider user gesture before playing.
- LocalStorage persistence can be polluted by tests. Clear keys (hiScore, highScores) before/after tests to avoid flaky behavior.

5. Quick Commands

- Install deps: npm install
- Start server: npm start
- Open game: http://localhost:8080/
- High score test page: http://localhost:8080/test-highscore.html

Maintenance Note

- Keep this document updated when adding scenes, global events, or persistence keys, and when upgrading Phaser.
