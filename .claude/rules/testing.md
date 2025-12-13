# Testing Conventions

Tests use Vitest with happy-dom for browser API mocking.

## Test Location

Tests live in `.claude/hooks/viewer/__tests__/`

## Test Types

- `components.test.ts` - Vue component unit tests
- `server.test.ts` - Server endpoint tests
- `setup.ts` - Test environment setup with happy-dom

## Running Tests

```bash
cd .claude/hooks
bun run test          # Watch mode
bun run test:run      # Single run
bun run test:coverage # With coverage
```

## Test Utilities

- `@vue/test-utils` - Vue component testing
- `happy-dom` - Browser API mocking

## Guidelines

- Mock file system operations for handler tests
- Use happy-dom environment for Vue component tests
- Test SSE streaming behavior for server endpoints
- Use `join()` for all mock paths (see `cross-platform.md` for details)
