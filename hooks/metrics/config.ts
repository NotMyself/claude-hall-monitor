/**
 * Configuration module for the metrics system
 *
 * Provides default configuration values and environment variable overrides
 * for database paths, archive settings, and data source watchers.
 */

import type { MetricsConfig } from './types.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Default configuration for the metrics system
 *
 * Database and Archive:
 * - databasePath: SQLite database file location (default: hooks/data/metrics.db)
 * - archiveDir: Directory for archived database files (default: hooks/data/archive)
 * - aggregationIntervalMs: How often to aggregate metrics (default: 60 seconds)
 * - archiveAfterDays: Archive sessions older than N days (default: 7)
 * - deleteArchivesAfterDays: Delete archived files older than N days (default: 365)
 *
 * Transcript Watcher:
 * - useFsWatch: Use native fs.watch() vs polling (default: true)
 * - projectsDir: Location of Claude projects directory (default: ~/.claude/projects)
 * - fallbackPollIntervalMs: Polling interval when fs.watch unavailable (default: 30 seconds)
 *
 * Plans Watcher:
 * - activeDir: Directory for active plan specs (default: dev/active)
 * - completeDir: Directory for completed plan specs (default: dev/complete)
 * - watchManifest: Watch manifest.json for plan orchestration events (default: true)
 */
export const DEFAULT_METRICS_CONFIG: MetricsConfig = {
  databasePath: 'hooks/data/metrics.db',
  archiveDir: 'hooks/data/archive',
  aggregationIntervalMs: 60_000,
  archiveAfterDays: 7,
  deleteArchivesAfterDays: 365,
  transcript: {
    useFsWatch: true,
    projectsDir: join(homedir(), '.claude', 'projects'),
    fallbackPollIntervalMs: 30_000,
  },
  plans: {
    activeDir: 'dev/active',
    completeDir: 'dev/complete',
    watchManifest: true,
  },
};

/**
 * Get metrics configuration with environment variable overrides
 *
 * Supported environment variables:
 * - METRICS_DB_PATH: Override databasePath
 * - METRICS_ARCHIVE_DIR: Override archiveDir
 * - METRICS_AGGREGATION_INTERVAL_MS: Override aggregationIntervalMs
 * - METRICS_ARCHIVE_AFTER_DAYS: Override archiveAfterDays
 * - METRICS_DELETE_ARCHIVES_AFTER_DAYS: Override deleteArchivesAfterDays
 * - TRANSCRIPT_USE_FS_WATCH: Override transcript.useFsWatch (true/false)
 * - CLAUDE_PROJECTS_DIR: Override transcript.projectsDir
 * - TRANSCRIPT_POLL_INTERVAL_MS: Override transcript.fallbackPollIntervalMs
 * - PLANS_ACTIVE_DIR: Override plans.activeDir
 * - PLANS_COMPLETE_DIR: Override plans.completeDir
 * - PLANS_WATCH_MANIFEST: Override plans.watchManifest (true/false)
 *
 * @returns Merged configuration with environment overrides applied
 */
export function getConfig(): MetricsConfig {
  const config: MetricsConfig = {
    databasePath: process.env.METRICS_DB_PATH ?? DEFAULT_METRICS_CONFIG.databasePath,
    archiveDir: process.env.METRICS_ARCHIVE_DIR ?? DEFAULT_METRICS_CONFIG.archiveDir,
    aggregationIntervalMs: parseIntOrDefault(
      process.env.METRICS_AGGREGATION_INTERVAL_MS,
      DEFAULT_METRICS_CONFIG.aggregationIntervalMs
    ),
    archiveAfterDays: parseIntOrDefault(
      process.env.METRICS_ARCHIVE_AFTER_DAYS,
      DEFAULT_METRICS_CONFIG.archiveAfterDays
    ),
    deleteArchivesAfterDays: parseIntOrDefault(
      process.env.METRICS_DELETE_ARCHIVES_AFTER_DAYS,
      DEFAULT_METRICS_CONFIG.deleteArchivesAfterDays
    ),
    transcript: {
      useFsWatch: parseBoolOrDefault(
        process.env.TRANSCRIPT_USE_FS_WATCH,
        DEFAULT_METRICS_CONFIG.transcript.useFsWatch
      ),
      projectsDir: process.env.CLAUDE_PROJECTS_DIR ?? DEFAULT_METRICS_CONFIG.transcript.projectsDir,
      fallbackPollIntervalMs: parseIntOrDefault(
        process.env.TRANSCRIPT_POLL_INTERVAL_MS,
        DEFAULT_METRICS_CONFIG.transcript.fallbackPollIntervalMs
      ),
    },
    plans: {
      activeDir: process.env.PLANS_ACTIVE_DIR ?? DEFAULT_METRICS_CONFIG.plans.activeDir,
      completeDir: process.env.PLANS_COMPLETE_DIR ?? DEFAULT_METRICS_CONFIG.plans.completeDir,
      watchManifest: parseBoolOrDefault(
        process.env.PLANS_WATCH_MANIFEST,
        DEFAULT_METRICS_CONFIG.plans.watchManifest
      ),
    },
  };

  return config;
}

/**
 * Parse an environment variable as integer with fallback
 */
function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse an environment variable as boolean with fallback
 * Accepts: true/false, 1/0, yes/no (case insensitive)
 */
function parseBoolOrDefault(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.toLowerCase().trim();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return defaultValue;
}
