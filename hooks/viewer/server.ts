/**
 * HTTP server for the realtime log viewer
 *
 * Implements F019: HTTP server base with routes for:
 * - GET / - HTML page with Vue.js app
 * - GET /styles/theme.css - CSS theme file
 * - GET /api/entries - JSON array of log entries
 * - GET /events - SSE stream for realtime updates
 * - POST /shutdown - Authenticated shutdown endpoint
 *
 * Security features:
 * - CSP headers on HTML responses
 * - CORS restricted to localhost origin
 * - Rate limiting on SSE connections
 * - Bearer token auth on shutdown endpoint
 * - Binds to localhost only by default
 */

import { getViewerConfig, type ViewerConfig } from './config';
import { RateLimiter, verifyBearerToken } from './security';
import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Viewer server class using Bun.serve
 *
 * Manages HTTP server lifecycle, SSE connections, and file watching
 * for realtime log updates.
 */
export class ViewerServer {
  private server?: ReturnType<typeof Bun.serve>;
  private config: ViewerConfig;
  private rateLimiter: RateLimiter;
  private watcher?: ReturnType<typeof watch>;
  private sseClients: Set<WritableStreamDefaultWriter<Uint8Array>> = new Set();
  private logFilePath: string;

  /**
   * Create a new viewer server
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<ViewerConfig>) {
    const defaultConfig = getViewerConfig();
    this.config = { ...defaultConfig, ...config };
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.maxConnections,
      this.config.rateLimit.windowMs
    );

    // Determine log file path relative to hooks directory
    const hooksDir = join(import.meta.dir, '..');
    this.logFilePath = join(hooksDir, 'hooks-log.txt');
  }

  /**
   * Start the HTTP server
   *
   * Binds to the configured host and port and begins accepting connections.
   */
  async start(): Promise<void> {
    this.server = Bun.serve({
      port: this.config.port,
      hostname: this.config.host,
      fetch: this.handleRequest.bind(this),
    });

    console.log(`Viewer running at http://${this.config.host}:${this.config.port}`);

    // Start watching log file for changes
    this.startFileWatcher();
  }

  /**
   * Handle incoming HTTP requests
   *
   * Routes requests to appropriate handlers based on URL path and method.
   *
   * @param req - The HTTP request
   * @returns HTTP response
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route handling
    if (path === '/' && req.method === 'GET') {
      return this.handleGetIndex();
    }

    if (path === '/styles/theme.css' && req.method === 'GET') {
      return this.handleGetTheme();
    }

    if (path === '/api/entries' && req.method === 'GET') {
      return this.handleGetEntries();
    }

    if (path === '/events' && req.method === 'GET') {
      return this.handleSSE(req);
    }

    if (path === '/shutdown' && req.method === 'POST') {
      return this.handleShutdown(req);
    }

    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle GET / - Return HTML page
   *
   * @returns HTML response with security headers
   */
  private handleGetIndex(): Response {
    const html = this.getHTMLTemplate();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  }

  /**
   * Handle GET /styles/theme.css - Return CSS theme
   *
   * @returns CSS response
   */
  private handleGetTheme(): Response {
    const css = this.getCSSTheme();

    return new Response(css, {
      status: 200,
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
      },
    });
  }

  /**
   * Handle GET /api/entries - Return log entries as JSON
   *
   * @returns JSON response with CORS headers
   */
  private async handleGetEntries(): Promise<Response> {
    const entries = await this.readLogEntries();

    return new Response(JSON.stringify(entries), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': `http://localhost:${this.config.port}`,
      },
    });
  }

  /**
   * Handle GET /events - SSE stream for realtime updates
   *
   * @param req - The HTTP request
   * @returns SSE stream response
   */
  private async handleSSE(req: Request): Promise<Response> {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Check rate limit
    if (!this.rateLimiter.isAllowed(clientIP)) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Create a stream for SSE
    const stream = new ReadableStream({
      start: async (controller) => {
        const encoder = new TextEncoder();

        // Helper to send SSE messages
        const send = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Send initial entries
        const entries = await this.readLogEntries();
        send('entries', entries);

        // Create a writer wrapper to track this client
        const writer = {
          send,
          controller,
        };

        // Store reference for broadcasting updates
        this.sseClients.add(writer as any);

        // Clean up on connection close
        req.signal?.addEventListener('abort', () => {
          this.sseClients.delete(writer as any);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  /**
   * Handle POST /shutdown - Authenticated shutdown
   *
   * @param req - The HTTP request
   * @returns Success or error response
   */
  private async handleShutdown(req: Request): Promise<Response> {
    // Verify bearer token
    if (!verifyBearerToken(req, this.config.shutdownToken)) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Schedule shutdown after response is sent
    setTimeout(() => {
      this.stop().then(() => {
        process.exit(0);
      });
    }, 100);

    return new Response(JSON.stringify({ message: 'Shutting down' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Start file watcher for log file
   *
   * Watches hooks-log.txt for changes and broadcasts updates to SSE clients.
   */
  private startFileWatcher(): void {
    try {
      this.watcher = watch(this.logFilePath, async (eventType) => {
        if (eventType === 'change') {
          // Read updated entries and broadcast to all SSE clients
          const entries = await this.readLogEntries();
          this.broadcastToClients('entries', entries);
        }
      });
    } catch (error) {
      // Log file might not exist yet, that's ok
      console.log('Log file watcher: file not found, will create on first write');
    }
  }

  /**
   * Broadcast a message to all connected SSE clients
   *
   * @param event - Event name
   * @param data - Event data
   */
  private broadcastToClients(event: string, data: any): void {
    for (const client of this.sseClients) {
      try {
        (client as any).send(event, data);
      } catch (error) {
        // Client disconnected, remove it
        this.sseClients.delete(client);
      }
    }
  }

  /**
   * Read log entries from hooks-log.txt
   *
   * Parses JSONL format (one JSON object per line).
   *
   * @returns Array of log entry objects
   */
  private async readLogEntries(): Promise<any[]> {
    try {
      const content = await readFile(this.logFilePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);

      const entries = [];
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // Skip malformed lines
        }
      }

      return entries;
    } catch (error) {
      // File doesn't exist yet or can't be read
      return [];
    }
  }

  /**
   * Stop the server and clean up resources
   *
   * Closes all SSE connections, stops file watcher, and stops the HTTP server.
   */
  async stop(): Promise<void> {
    // Close all SSE connections
    for (const client of this.sseClients) {
      try {
        (client as any).controller.close();
      } catch {
        // Ignore errors during cleanup
      }
    }
    this.sseClients.clear();

    // Stop file watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }

    // Stop HTTP server
    if (this.server) {
      this.server.stop();
      this.server = undefined;
    }
  }

  /**
   * Get HTML template for the viewer UI
   *
   * @returns HTML string
   */
  private getHTMLTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Hall Monitor</title>
  <link rel="stylesheet" href="/styles/theme.css">
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
</head>
<body>
  <div id="app">
    <h1>Claude Hall Monitor</h1>
    <div class="entries">
      <div v-for="entry in entries" :key="entry.timestamp" class="entry">
        <pre>{{ JSON.stringify(entry, null, 2) }}</pre>
      </div>
    </div>
  </div>
  <script>
    const { createApp } = Vue;

    createApp({
      data() {
        return {
          entries: []
        };
      },
      mounted() {
        // Connect to SSE endpoint
        const eventSource = new EventSource('/events');

        eventSource.addEventListener('entries', (e) => {
          this.entries = JSON.parse(e.data);
        });

        eventSource.addEventListener('error', (e) => {
          console.error('SSE error:', e);
        });
      }
    }).mount('#app');
  </script>
</body>
</html>`;
  }

  /**
   * Get CSS theme
   *
   * @returns CSS string
   */
  private getCSSTheme(): string {
    return `:root {
  --primary: #6366f1;
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
  --shadow: rgba(0, 0, 0, 0.5);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  padding: 20px;
}

h1 {
  color: var(--primary);
  margin-bottom: 20px;
  font-size: 2rem;
}

.entries {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entry {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px var(--shadow);
}

.entry pre {
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
`;
  }
}

/**
 * Auto-start when run directly
 */
if (import.meta.main) {
  const server = new ViewerServer();
  server.start();
}
