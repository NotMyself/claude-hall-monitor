/**
 * Configuration module for the realtime log viewer
 *
 * Provides default configuration values and environment variable overrides
 * for server settings, rate limiting, and authentication.
 */

/**
 * Viewer configuration interface
 */
export interface ViewerConfig {
  /** Port number for the HTTP server */
  port: number;
  /** Host to bind the server to (default: localhost for security) */
  host: string;
  /** Rate limiting configuration for SSE connections */
  rateLimit: {
    /** Maximum number of connections per IP within the time window */
    maxConnections: number;
    /** Time window in milliseconds for rate limiting */
    windowMs: number;
  };
  /** Bearer token for shutdown endpoint authentication */
  shutdownToken: string;
}

/**
 * Default configuration for the viewer
 *
 * Security Defaults:
 * - port: 3456 (non-privileged port)
 * - host: localhost (binds to 127.0.0.1 only, not exposed to network)
 * - rateLimit.maxConnections: 5 (limits SSE connections per IP)
 * - rateLimit.windowMs: 60000 (1 minute sliding window)
 * - shutdownToken: Random UUID or from HOOK_VIEWER_TOKEN env var
 *
 * Environment Variable Overrides:
 * - HOOK_VIEWER_PORT: Override port number
 * - HOOK_VIEWER_HOST: Override host binding (use with caution!)
 * - HOOK_VIEWER_RATE_LIMIT_MAX: Override max connections
 * - HOOK_VIEWER_RATE_LIMIT_WINDOW_MS: Override rate limit window
 * - HOOK_VIEWER_TOKEN: Override shutdown token (recommended in production)
 */
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  port: 3456,
  host: 'localhost',
  rateLimit: {
    maxConnections: 5,
    windowMs: 60000,
  },
  shutdownToken: process.env.HOOK_VIEWER_TOKEN || crypto.randomUUID(),
};

/**
 * Get viewer configuration with environment variable overrides
 *
 * Supported environment variables:
 * - HOOK_VIEWER_PORT: Override server port (default: 3456)
 * - HOOK_VIEWER_HOST: Override server host (default: localhost)
 * - HOOK_VIEWER_RATE_LIMIT_MAX: Override max connections per IP (default: 5)
 * - HOOK_VIEWER_RATE_LIMIT_WINDOW_MS: Override rate limit window (default: 60000)
 * - HOOK_VIEWER_TOKEN: Override shutdown token (default: random UUID)
 *
 * @returns Merged configuration with environment overrides applied
 */
export function getViewerConfig(): ViewerConfig {
  const config: ViewerConfig = {
    port: parseIntOrDefault(process.env.HOOK_VIEWER_PORT, DEFAULT_VIEWER_CONFIG.port),
    host: process.env.HOOK_VIEWER_HOST ?? DEFAULT_VIEWER_CONFIG.host,
    rateLimit: {
      maxConnections: parseIntOrDefault(
        process.env.HOOK_VIEWER_RATE_LIMIT_MAX,
        DEFAULT_VIEWER_CONFIG.rateLimit.maxConnections
      ),
      windowMs: parseIntOrDefault(
        process.env.HOOK_VIEWER_RATE_LIMIT_WINDOW_MS,
        DEFAULT_VIEWER_CONFIG.rateLimit.windowMs
      ),
    },
    shutdownToken: process.env.HOOK_VIEWER_TOKEN ?? DEFAULT_VIEWER_CONFIG.shutdownToken,
  };

  return config;
}

/**
 * Parse an environment variable as integer with fallback
 *
 * @param value - Environment variable value (may be undefined)
 * @param defaultValue - Default value if parsing fails or value is undefined
 * @returns Parsed integer or default value
 */
function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
