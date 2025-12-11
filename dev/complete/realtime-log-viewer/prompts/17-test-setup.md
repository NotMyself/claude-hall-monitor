# Feature: 17-test-setup - Test Configuration

## Context
Features 01-16 are complete. The viewer application is fully functional.

## Objective
Configure Vitest with happy-dom for component testing and create test setup file with mocks.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use Vitest with happy-dom environment
- Mock localStorage, matchMedia, and navigator.clipboard
- Create setup file that runs before all tests

## Files to Create/Modify
- `.claude/hooks/viewer/vitest.config.ts` - Vitest configuration
- `.claude/hooks/viewer/__tests__/setup.ts` - Test setup with mocks

## Implementation Details

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for browser-like environment
    environment: 'happy-dom',

    // Setup file runs before all tests
    setupFiles: ['./__tests__/setup.ts'],

    // Include test files
    include: ['__tests__/**/*.test.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['*.ts'],
      exclude: ['__tests__/**', 'vitest.config.ts'],
    },
  },
});
```

### __tests__/setup.ts

```typescript
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
```

### Update package.json scripts

The package.json should have these scripts (will be updated in feature 21):
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Acceptance Criteria
- [ ] vitest.config.ts created with happy-dom environment
- [ ] Setup file configured in vitest.config.ts
- [ ] Test include pattern matches __tests__/**/*.test.ts
- [ ] localStorage mock with getItem/setItem/clear
- [ ] matchMedia mock returns object with required properties
- [ ] navigator.clipboard.writeText mock returns Promise
- [ ] Mocks reset after each test (afterEach)
- [ ] Coverage configured with v8 provider

## Verification
```bash
test -f .claude/hooks/viewer/vitest.config.ts && echo "Config file exists"
test -f .claude/hooks/viewer/__tests__/setup.ts && echo "Setup file exists"
grep -q "happy-dom" .claude/hooks/viewer/vitest.config.ts && echo "happy-dom configured"
grep -q "localStorage" .claude/hooks/viewer/__tests__/setup.ts && echo "localStorage mock found"
grep -q "matchMedia" .claude/hooks/viewer/__tests__/setup.ts && echo "matchMedia mock found"
grep -q "clipboard" .claude/hooks/viewer/__tests__/setup.ts && echo "clipboard mock found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/vitest.config.ts .claude/hooks/viewer/__tests__/setup.ts
git commit -m "feat(viewer): add Vitest test configuration

- Configure Vitest with happy-dom environment
- Add test setup file with browser API mocks
- Mock localStorage, matchMedia, navigator.clipboard
- Configure coverage with v8 provider"
```

## Next
Proceed to: `prompts/18-test-components.md`
