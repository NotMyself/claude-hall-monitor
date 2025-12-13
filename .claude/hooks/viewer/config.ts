import { join, resolve } from "path";

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  /** HTTP server port */
  PORT: 3456,

  /** Hostname to bind to (0.0.0.0 allows external connections) */
  HOST: "0.0.0.0",

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

  /** Path to logo.svg */
  LOGO_SVG: join(import.meta.dir, "logo.svg"),

  /** User's Claude home directory (~/.claude) */
  CLAUDE_HOME: process.env.USERPROFILE
    ? join(process.env.USERPROFILE, ".claude")
    : join(process.env.HOME || "", ".claude"),

  /** Path to global stats cache file */
  get STATS_CACHE() {
    return join(this.CLAUDE_HOME, "stats-cache.json");
  },

  /** Path to commands directory */
  COMMANDS_DIR: resolve(import.meta.dir, "..", "..", "commands"),

  /** Path to skills directory */
  SKILLS_DIR: resolve(import.meta.dir, "..", "..", "skills"),

  /** Path to settings.json */
  SETTINGS_FILE: resolve(import.meta.dir, "..", "..", "settings.json"),

  /** Project root directory (parent of .claude) */
  PROJECT_ROOT: resolve(import.meta.dir, "..", "..", ".."),

  /** Directory containing active plans */
  get DEV_ACTIVE_DIR() {
    return join(this.PROJECT_ROOT, "dev", "active");
  },

  /** Directory containing completed plans */
  get DEV_COMPLETE_DIR() {
    return join(this.PROJECT_ROOT, "dev", "complete");
  },

  /** Get path to a plan's features.json */
  getPlanFeaturesPath(planDir: string): string {
    return join(planDir, "features.json");
  },
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

/**
 * Dashboard-specific configuration
 */
export const DASHBOARD_CONFIG = {
  /** Session considered inactive after this many ms without heartbeat */
  HEARTBEAT_TIMEOUT_MS: 60_000, // 60 seconds

  /** Minimum interval between heartbeat writes */
  HEARTBEAT_INTERVAL_MS: 30_000, // 30 seconds

  /** Dashboard data refresh interval for UI polling */
  REFRESH_INTERVAL_MS: 5_000, // 5 seconds
} as const;

/**
 * Timing constants
 */
export const TIMING = {
  /** Delay before shutdown to allow response to complete */
  SHUTDOWN_DELAY_MS: 100,

  /** Dashboard polling interval in milliseconds */
  DASHBOARD_POLL_INTERVAL_MS: 5_000,

  /** File watch polling interval in milliseconds */
  FILE_WATCH_INTERVAL_MS: 500,

  /** SSE heartbeat interval in milliseconds */
  SSE_HEARTBEAT_INTERVAL_MS: 30_000,
} as const;

/**
 * Plan tracker configuration
 */
export const PLAN_CONFIG = {
  /** Poll interval for plan file changes in milliseconds */
  POLL_INTERVAL_MS: 1_000, // 1 second for responsive updates during orchestration

  /** Maximum number of completed plans to show */
  MAX_COMPLETED_PLANS: 10,
} as const;
