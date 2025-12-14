/**
 * Test setup file - runs before all tests
 * Provides mocks for browser APIs not available in happy-dom
 */

import { beforeAll, afterEach, vi } from 'vitest';

// ===== localStorage Mock =====
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ===== matchMedia Mock =====
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ===== navigator.clipboard Mock =====
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});

// ===== Reset Mocks Between Tests =====
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// ===== Console Error Suppression (optional) =====
beforeAll(() => {
  // Suppress expected console errors during tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ===== Suppress happy-dom SSE stream errors =====
// happy-dom throws "Controller is already closed" when SSE connections are aborted
// This is expected behavior during test teardown, not an actual error
process.on('uncaughtException', (error: Error & { code?: string }) => {
  if (error.code === 'ERR_INVALID_STATE' && error.message.includes('Controller is already closed')) {
    // Suppress this expected error from happy-dom SSE handling
    return;
  }
  // Re-throw unexpected errors
  throw error;
});
