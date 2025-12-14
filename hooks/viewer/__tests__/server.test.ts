/**
 * Server endpoint tests for Hook Viewer
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Hardcode config values to avoid import.meta.dir issues in Vitest
const SERVER_HOST = 'localhost';
const SERVER_PORT = 3456;
const BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// Server process handle
let serverProcess: ChildProcess | null = null;

describe('Server', () => {
  beforeAll(async () => {
    // Get the viewer directory path
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const viewerDir = join(__dirname, '..');

    // Start the server using Node's child_process
    serverProcess = spawn('bun', ['run', 'server.ts'], {
      cwd: viewerDir,
      stdio: 'ignore',
      shell: true,
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

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      // Give it time to clean up
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  // ===== Static File Tests =====
  describe('GET /', () => {
    it('returns HTML content', async () => {
      const response = await fetch(BASE_URL);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    it('has security headers', async () => {
      const response = await fetch(BASE_URL);

      expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
    });

    it('contains Vue app', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();

      expect(html).toContain('id="app"');
      expect(html).toContain('vue');
    });

    it('contains Claude Hall Monitor title', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();

      expect(html).toContain('Claude Hall Monitor');
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

      expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3456');
    });
  });

  // ===== SSE Tests =====
  describe('GET /events', () => {
    it('returns event stream', async () => {
      const controller = new AbortController();

      const response = await fetch(`${BASE_URL}/events`, {
        signal: controller.signal,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      // Abort to cleanly close the connection
      controller.abort();
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
      const controller = new AbortController();

      const response = await fetch(`${BASE_URL}/events`, {
        signal: controller.signal,
      });

      expect(response.headers.get('cache-control')).toBe('no-cache');
      expect(response.headers.get('connection')).toBe('keep-alive');

      // Small delay to let stream stabilize before aborting
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
    });
  });
});
