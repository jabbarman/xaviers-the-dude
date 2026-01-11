import globals from "globals";
import eslint from "@eslint/js";

export default [
  eslint.configs.recommended,
  {
    // Configuration for general JavaScript files
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        ...globals.browser,
        Phaser: "readonly",
        // Add other browser globals that might be missing
        Image: "readonly",
        Element: "readonly",
        DOMParser: "readonly",
        ActiveXObject: "readonly", // Legacy, but might be used by Phaser internally
        HTMLCanvasElement: "readonly",
        HTMLVideoElement: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        Audio: "readonly",
        setTimeout: "readonly", // Already a global, but explicitly define
        atob: "readonly",
        XMLHttpRequest: "readonly",
        HTMLElement: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        XMLSerializer: "readonly",
        FontFace: "readonly",
        AudioContext: "readonly",
        screen: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
      "no-empty": ["error", { "allowEmptyCatch": true }], // Allow empty catch blocks
      "no-undef": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  },
  {
    // Override to ignore phaser.min.js entirely
    files: ["phaser.min.js"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-empty": "off",
      "no-prototype-builtins": "off",
      "no-cond-assign": "off",
      "no-dupe-keys": "off"
    }
  },
  {
    // Configuration for Node.js specific scripts
    files: ["scripts/mock-highscores.js"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-undef": "error", // Ensure process is defined for Node.js files
      "no-console": ["warn", { "allow": ["warn", "error", "log"] }]
    }
  },
  {
    // Override for test-highscore.js to allow console.log
    files: ["test-highscore.js"],
    rules: {
      "no-console": "off"
    }
  }
];