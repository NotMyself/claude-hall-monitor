/**
 * Tests for configuration module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DEFAULT_METRICS_CONFIG, getConfig } from './config.js';
import type { MetricsConfig } from './types.js';

describe('DEFAULT_METRICS_CONFIG', () => {
  it('has correct structure with all required fields', () => {
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('databasePath');
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('archiveDir');
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('aggregationIntervalMs');
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('archiveAfterDays');
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('deleteArchivesAfterDays');
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('transcript');
    expect(DEFAULT_METRICS_CONFIG).toHaveProperty('plans');
  });

  it('has correct transcript configuration', () => {
    expect(DEFAULT_METRICS_CONFIG.transcript).toHaveProperty('useFsWatch');
    expect(DEFAULT_METRICS_CONFIG.transcript).toHaveProperty('projectsDir');
    expect(DEFAULT_METRICS_CONFIG.transcript).toHaveProperty('fallbackPollIntervalMs');

    expect(typeof DEFAULT_METRICS_CONFIG.transcript.useFsWatch).toBe('boolean');
    expect(typeof DEFAULT_METRICS_CONFIG.transcript.projectsDir).toBe('string');
    expect(typeof DEFAULT_METRICS_CONFIG.transcript.fallbackPollIntervalMs).toBe('number');
  });

  it('has correct plans configuration', () => {
    expect(DEFAULT_METRICS_CONFIG.plans).toHaveProperty('activeDir');
    expect(DEFAULT_METRICS_CONFIG.plans).toHaveProperty('completeDir');
    expect(DEFAULT_METRICS_CONFIG.plans).toHaveProperty('watchManifest');

    expect(typeof DEFAULT_METRICS_CONFIG.plans.activeDir).toBe('string');
    expect(typeof DEFAULT_METRICS_CONFIG.plans.completeDir).toBe('string');
    expect(typeof DEFAULT_METRICS_CONFIG.plans.watchManifest).toBe('boolean');
  });

  it('has reasonable default values', () => {
    expect(DEFAULT_METRICS_CONFIG.databasePath).toBe('hooks/data/metrics.db');
    expect(DEFAULT_METRICS_CONFIG.archiveDir).toBe('hooks/data/archive');
    expect(DEFAULT_METRICS_CONFIG.aggregationIntervalMs).toBe(60_000);
    expect(DEFAULT_METRICS_CONFIG.archiveAfterDays).toBe(7);
    expect(DEFAULT_METRICS_CONFIG.deleteArchivesAfterDays).toBe(365);
    expect(DEFAULT_METRICS_CONFIG.transcript.useFsWatch).toBe(true);
    expect(DEFAULT_METRICS_CONFIG.transcript.fallbackPollIntervalMs).toBe(30_000);
    expect(DEFAULT_METRICS_CONFIG.plans.activeDir).toBe('dev/active');
    expect(DEFAULT_METRICS_CONFIG.plans.completeDir).toBe('dev/complete');
    expect(DEFAULT_METRICS_CONFIG.plans.watchManifest).toBe(true);
  });
});

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('returns default config when no environment variables set', () => {
    const config = getConfig();

    expect(config.databasePath).toBe(DEFAULT_METRICS_CONFIG.databasePath);
    expect(config.archiveDir).toBe(DEFAULT_METRICS_CONFIG.archiveDir);
    expect(config.aggregationIntervalMs).toBe(DEFAULT_METRICS_CONFIG.aggregationIntervalMs);
    expect(config.archiveAfterDays).toBe(DEFAULT_METRICS_CONFIG.archiveAfterDays);
    expect(config.deleteArchivesAfterDays).toBe(DEFAULT_METRICS_CONFIG.deleteArchivesAfterDays);
  });

  it('overrides databasePath with METRICS_DB_PATH', () => {
    process.env.METRICS_DB_PATH = 'custom/path/metrics.db';
    const config = getConfig();

    expect(config.databasePath).toBe('custom/path/metrics.db');
  });

  it('overrides archiveDir with METRICS_ARCHIVE_DIR', () => {
    process.env.METRICS_ARCHIVE_DIR = 'custom/archive';
    const config = getConfig();

    expect(config.archiveDir).toBe('custom/archive');
  });

  it('overrides aggregationIntervalMs with METRICS_AGGREGATION_INTERVAL_MS', () => {
    process.env.METRICS_AGGREGATION_INTERVAL_MS = '120000';
    const config = getConfig();

    expect(config.aggregationIntervalMs).toBe(120_000);
  });

  it('overrides archiveAfterDays with METRICS_ARCHIVE_AFTER_DAYS', () => {
    process.env.METRICS_ARCHIVE_AFTER_DAYS = '14';
    const config = getConfig();

    expect(config.archiveAfterDays).toBe(14);
  });

  it('overrides deleteArchivesAfterDays with METRICS_DELETE_ARCHIVES_AFTER_DAYS', () => {
    process.env.METRICS_DELETE_ARCHIVES_AFTER_DAYS = '730';
    const config = getConfig();

    expect(config.deleteArchivesAfterDays).toBe(730);
  });

  it('overrides transcript.projectsDir with CLAUDE_PROJECTS_DIR', () => {
    process.env.CLAUDE_PROJECTS_DIR = '/custom/claude/projects';
    const config = getConfig();

    expect(config.transcript.projectsDir).toBe('/custom/claude/projects');
  });

  it('overrides transcript.useFsWatch with TRANSCRIPT_USE_FS_WATCH', () => {
    process.env.TRANSCRIPT_USE_FS_WATCH = 'false';
    const config = getConfig();

    expect(config.transcript.useFsWatch).toBe(false);

    process.env.TRANSCRIPT_USE_FS_WATCH = 'true';
    const config2 = getConfig();

    expect(config2.transcript.useFsWatch).toBe(true);
  });

  it('overrides transcript.fallbackPollIntervalMs with TRANSCRIPT_POLL_INTERVAL_MS', () => {
    process.env.TRANSCRIPT_POLL_INTERVAL_MS = '60000';
    const config = getConfig();

    expect(config.transcript.fallbackPollIntervalMs).toBe(60_000);
  });

  it('overrides plans.activeDir with PLANS_ACTIVE_DIR', () => {
    process.env.PLANS_ACTIVE_DIR = 'custom/active';
    const config = getConfig();

    expect(config.plans.activeDir).toBe('custom/active');
  });

  it('overrides plans.completeDir with PLANS_COMPLETE_DIR', () => {
    process.env.PLANS_COMPLETE_DIR = 'custom/complete';
    const config = getConfig();

    expect(config.plans.completeDir).toBe('custom/complete');
  });

  it('overrides plans.watchManifest with PLANS_WATCH_MANIFEST', () => {
    process.env.PLANS_WATCH_MANIFEST = 'false';
    const config = getConfig();

    expect(config.plans.watchManifest).toBe(false);

    process.env.PLANS_WATCH_MANIFEST = 'true';
    const config2 = getConfig();

    expect(config2.plans.watchManifest).toBe(true);
  });

  it('handles invalid integer values gracefully', () => {
    process.env.METRICS_AGGREGATION_INTERVAL_MS = 'not-a-number';
    const config = getConfig();

    expect(config.aggregationIntervalMs).toBe(DEFAULT_METRICS_CONFIG.aggregationIntervalMs);
  });

  it('handles invalid boolean values gracefully', () => {
    process.env.TRANSCRIPT_USE_FS_WATCH = 'maybe';
    const config = getConfig();

    expect(config.transcript.useFsWatch).toBe(DEFAULT_METRICS_CONFIG.transcript.useFsWatch);
  });

  it('accepts various boolean formats', () => {
    // Test true variants
    process.env.PLANS_WATCH_MANIFEST = '1';
    expect(getConfig().plans.watchManifest).toBe(true);

    process.env.PLANS_WATCH_MANIFEST = 'yes';
    expect(getConfig().plans.watchManifest).toBe(true);

    process.env.PLANS_WATCH_MANIFEST = 'TRUE';
    expect(getConfig().plans.watchManifest).toBe(true);

    // Test false variants
    process.env.PLANS_WATCH_MANIFEST = '0';
    expect(getConfig().plans.watchManifest).toBe(false);

    process.env.PLANS_WATCH_MANIFEST = 'no';
    expect(getConfig().plans.watchManifest).toBe(false);

    process.env.PLANS_WATCH_MANIFEST = 'FALSE';
    expect(getConfig().plans.watchManifest).toBe(false);
  });

  it('supports multiple overrides simultaneously', () => {
    process.env.METRICS_DB_PATH = 'multi/test.db';
    process.env.METRICS_ARCHIVE_DIR = 'multi/archive';
    process.env.CLAUDE_PROJECTS_DIR = '/multi/projects';
    process.env.PLANS_ACTIVE_DIR = 'multi/active';

    const config = getConfig();

    expect(config.databasePath).toBe('multi/test.db');
    expect(config.archiveDir).toBe('multi/archive');
    expect(config.transcript.projectsDir).toBe('/multi/projects');
    expect(config.plans.activeDir).toBe('multi/active');
  });
});
