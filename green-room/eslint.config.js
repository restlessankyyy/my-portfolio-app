'use strict';

// Green Room: ESLint 9 flat config.
// Browser scripts in public/ load via <script> tags and share globals, so
// no-undef is relaxed there. Node files use CommonJS globals; the Cloudflare
// Worker proxy is an ES module with its own runtime globals.

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'writable',
  require: 'readonly',
  exports: 'writable',
  globalThis: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
};

module.exports = [
  {
    ignores: ['node_modules/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-undef': 'error',
    },
  },
  {
    // Browser single-page app: cross-file globals from <script> tags
    // (GreenRoomCore, QUESTIONS) and Web APIs are provided by the runtime.
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    // Cloudflare Worker: ES module using the Workers runtime globals.
    files: ['terraform/cloudflare/worker/**/*.js'],
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
