# Feature: 19-test-server - Server Tests

## Context
Feature 18-test-components is complete. Component tests exist.

## Objective
Write tests for the HTTP server endpoints: static files, SSE, and API.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use Bun's fetch for HTTP testing
- Start server before tests, stop after
- Test all routes: /, /events, /api/entries, /styles/*

## Files to Create/Modify
- `.claude/hooks/viewer/__tests__/server.test.ts` - Server endpoint tests

## Implementation Details

```typescript
/**
 * Server endpoint tests for Hook Viewer
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SERVER_CONFIG } from '../config';

const BASE_URL = `http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`;

// Server process handle
let serverProcess: Bun.Subprocess | null = null;

describe('Server', () => {
  beforeAll(async () => {
    // Start the server
    serverProcess = Bun.spawn(['bun', 'run', 'server.ts'], {
      cwd: import.meta.dir.replace('__tests__', ''),
      stdout: 'ignore',
      stderr: 'ignore',
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify server is running
    let retries = 5;
    while (retries > 0) {
      try {
        await fetch(BASE_URL);
        break;
      } catch {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (retries === 0) {
      throw new Error('Server failed to start');
    }
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  // ===== Static File Tests =====
  describe('GET /', () => {
    it('returns HTML content', async () => {
      const response = await fetch(BASE_URL);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it('contains Vue app', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();

      expect(html).toContain('id="app"');
      expect(html).toContain('vue');
    });

    it('contains Hook Viewer title', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();

      expect(html).toContain('Hook Viewer');
    });
  });

  describe('GET /styles/theme.css', () => {
    it('returns CSS content', async () => {
      const response = await fetch(`${BASE_URL}/styles/theme.css`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/css');
    });

    it('contains theme variables', async () => {
      const response = await fetch(`${BASE_URL}/styles/theme.css`);
      const css = await response.text();

      expect(css).toContain('--primary');
      expect(css).toContain('--bg-primary');
    });
  });

  describe('GET /unknown', () => {
    it('returns 404', async () => {
      const response = await fetch(`${BASE_URL}/unknown-route`);

      expect(response.status).toBe(404);
    });
  });

  // ===== API Tests =====
  describe('GET /api/entries', () => {
    it('returns JSON array', async () => {
      const response = await fetch(`${BASE_URL}/api/entries`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('has CORS header', async () => {
      const response = await fetch(`${BASE_URL}/api/entries`);

      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  // ===== SSE Tests =====
  describe('GET /events', () => {
    it('returns event stream', async () => {
      const response = await fetch(`${BASE_URL}/events`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
    });

    it('sends initial entries event', async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${BASE_URL}/events`, {
          signal: controller.signal,
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let data = '';

        // Read first chunk
        const { value } = await reader.read();
        data += decoder.decode(value);

        // Should contain entries event
        expect(data).toContain('event: entries');
        expect(data).toContain('data:');

        reader.cancel();
      } finally {
        clearTimeout(timeoutId);
      }
    });

    it('has keep-alive headers', async () => {
      const response = await fetch(`${BASE_URL}/events`);

      expect(response.headers.get('cache-control')).toBe('no-cache');
      expect(response.headers.get('connection')).toBe('keep-alive');

      // Cancel the stream
      await response.body?.cancel();
    });
  });
});
```

## Acceptance Criteria
- [ ] Server starts before tests, stops after
- [ ] GET / returns 200 with text/html
- [ ] GET / response contains Vue app mount point
- [ ] GET /styles/theme.css returns 200 with text/css
- [ ] GET /unknown returns 404
- [ ] GET /api/entries returns 200 with application/json
- [ ] GET /api/entries returns array
- [ ] GET /api/entries has CORS header
- [ ] GET /events returns 200 with text/event-stream
- [ ] GET /events sends initial entries event
- [ ] GET /events has cache-control and connection headers
- [ ] All tests pass

## Verification
```bash
cd .claude/hooks && bun test viewer/__tests__/server.test.ts
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/__tests__/server.test.ts
git commit -m "feat(viewer): add server endpoint tests

- Test static file serving (/, /styles/*)
- Test 404 for unknown routes
- Test /api/entries JSON response
- Test /events SSE stream
- Verify content types and headers"
```

## Next
Proceed to: `prompts/20-session-start.md`
