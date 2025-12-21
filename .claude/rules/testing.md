# Testing Conventions

<general_purpose_solutions>
Write a high-quality, general-purpose solution using the standard tools available. Do not create helper scripts or workarounds to accomplish the task more efficiently. Implement a solution that works correctly for all valid inputs, not just the test cases. Do not hard-code values or create solutions that only work for specific test inputs. Instead, implement the actual logic that solves the problem generally.

Focus on understanding the problem requirements and implementing the correct algorithm. Tests are there to verify correctness, not to define the solution. Provide a principled implementation that follows best practices and software design principles.

If the task is unreasonable or infeasible, or if any of the tests are incorrect, please inform me rather than working around them. The solution should be robust, maintainable, and extendable.
</general_purpose_solutions>

## Project Test Setup

Tests use Vitest with happy-dom for browser API mocking.

### Test Location

Tests live in `hooks/viewer/__tests__/`

### Test Types

- `components.test.ts` - Vue component unit tests
- `server.test.ts` - Server endpoint tests
- `setup.ts` - Test environment setup with happy-dom

### Running Tests

```bash
cd hooks
bun run test          # Watch mode
bun run test:run      # Single run
bun run test:coverage # With coverage
```

### Test Utilities

- `@vue/test-utils` - Vue component testing
- `happy-dom` - Browser API mocking

### Guidelines

- Mock file system operations for handler tests
- Use happy-dom environment for Vue component tests
- Test SSE streaming behavior for server endpoints
- Use `join()` for all mock paths (see `cross-platform.md` for details)
