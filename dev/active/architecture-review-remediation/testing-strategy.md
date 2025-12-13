# Testing Strategy

## Philosophy

Security fixes require security tests. Each vulnerability remediation must include tests that:
1. Verify the fix blocks the attack vector
2. Confirm legitimate use cases still work
3. Test edge cases specific to the vulnerability

Tests use Vitest with happy-dom for browser API mocking. Run from `.claude/hooks` directory.

## Test Types

### Unit Tests

**Security utilities (`viewer/__tests__/security.test.ts`):**
- `validateSessionId()` - valid IDs, invalid chars, length limits
- `sanitizePathComponent()` - traversal attempts, encoding, null bytes
- `validatePathWithinBase()` - directory containment, edge cases

**Rate limiter (`viewer/__tests__/rate-limiter.test.ts`):**
- Connection counting per IP
- Window expiration
- Limit enforcement

### Integration Tests

**Server security (`viewer/__tests__/security.test.ts`):**
- Path traversal on `/styles/` endpoint
- Path traversal on `/api/plans/:name` endpoint
- Session ID injection on `/api/entries`
- CORS header verification
- CSP header verification
- Authentication on `/shutdown`

### Handler Execution Tests

**Handler execution (`handlers/__tests__/execution.test.ts`):**
- Each handler produces valid JSON on success
- Each handler produces valid JSON on error (bad input)
- Output structure matches expected format

## Test Patterns

### Security Test Pattern

```typescript
describe('Security - Path Traversal', () => {
  it('blocks encoded traversal in styles endpoint', async () => {
    const response = await fetch(`${BASE_URL}/styles/%2e%2e/config.ts`);
    expect(response.status).toBe(400);
  });

  it('allows valid style file requests', async () => {
    const response = await fetch(`${BASE_URL}/styles/main.css`);
    expect(response.status).toBe(200);
  });
});
```

### Handler Test Pattern

```typescript
describe('Handler Execution', () => {
  it('pre-tool-use outputs valid JSON', async () => {
    const input = createMockInput.preToolUse();
    const output = await runHandler('pre-tool-use.ts', input);
    expect(() => JSON.parse(output)).not.toThrow();
    expect(JSON.parse(output)).toHaveProperty('continue');
  });

  it('pre-tool-use handles malformed input gracefully', async () => {
    const output = await runHandler('pre-tool-use.ts', 'not json');
    expect(() => JSON.parse(output)).not.toThrow();
    expect(JSON.parse(output).continue).toBe(true);
  });
});
```

## Running Tests

```bash
cd .claude/hooks

# Run all tests
bun run test:run

# Run with coverage
bun run test:coverage

# Run security tests only
bun run test:run --grep "Security"

# Run handler tests only
bun run test:run --grep "Handler"
```

## Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Security utilities | 100% | 0% (new) |
| Rate limiter | 90%+ | 0% (new) |
| Server endpoints | 60%+ | 40% |
| Handler execution | 80%+ | 5% |
| Overall | 50%+ | ~35% |

## Verification Commands

Each feature prompt includes a verification command. Common patterns:

- **Type checking**: `bun run tsc --noEmit`
- **Security tests**: `bun test --grep "Security"`
- **Handler tests**: `bun test --grep "Handler"`
- **Full suite**: `bun run test:run`
