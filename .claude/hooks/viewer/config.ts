import { join, resolve } from "path";

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  /** HTTP server port */
  PORT: 3456,

  /** Hostname to bind to */
  HOST: "localhost",

  /** Full server URL */
  get URL() {
    return `http://${this.HOST}:${this.PORT}`;
  },
} as const;

/**
 * File paths configuration
 */
export const PATHS = {
  /** Directory containing viewer files */
  VIEWER_DIR: import.meta.dir,

  /** Directory containing session log files */
  LOGS_DIR: resolve(import.meta.dir, "..", "logs"),

  /** Get path to a session-specific log file */
  getSessionLogPath(session_id: string): string {
    return join(this.LOGS_DIR, `${session_id}.txt`);
  },

  /** Path to index.html */
  INDEX_HTML: join(import.meta.dir, "index.html"),

  /** Path to styles directory */
  STYLES_DIR: join(import.meta.dir, "styles"),
} as const;

/**
 * Environment variable for current session ID
 */
export const CURRENT_SESSION_ENV = "CLAUDE_HOOKS_VIEWER_SESSION";

/**
 * SSE (Server-Sent Events) configuration
 */
export const SSE_CONFIG = {
  /** Heartbeat interval in milliseconds */
  HEARTBEAT_INTERVAL: 30_000, // 30 seconds

  /** Reconnect delay for clients (sent in retry field) */
  RECONNECT_DELAY: 3_000, // 3 seconds
} as const;

/**
 * File watcher configuration
 */
export const WATCHER_CONFIG = {
  /** Poll interval for file changes in milliseconds */
  POLL_INTERVAL: 500, // 500ms
} as const;
