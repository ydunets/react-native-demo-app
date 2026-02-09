/* eslint-env node */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'backend/dist/**',
      '.expo/**',
      '.next/**',
      'build/**',
      '.github/skills/**',
      '.claude/skills/**',
    ],
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
