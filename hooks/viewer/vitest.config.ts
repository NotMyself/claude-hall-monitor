import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for browser-like environment
    environment: 'happy-dom',

    // Setup file runs before all tests (relative to config file location)
    setupFiles: ['./viewer/__tests__/setup.ts'],

    // Include test files (relative to project root when config is loaded with --config)
    include: ['viewer/__tests__/**/*.test.ts', 'utils/__tests__/**/*.test.ts', 'handlers/__tests__/**/*.test.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['viewer/*.ts', 'utils/*.ts', 'handlers/*.ts'],
      exclude: ['viewer/__tests__/**', 'utils/__tests__/**', 'handlers/__tests__/**', 'viewer/vitest.config.ts'],
    },
  },
});
