/**
 * Plan Events Capture
 *
 * Watches dev/active/PLAN_NAME/manifest.jsonl files for status changes and emits plan events.
 * Implements feature orchestration tracking for the metrics system.
 *
 * Architecture:
 * - Monitors manifest.jsonl files in active plan directories
 * - Detects status transitions (pending -> in_progress -> completed/failed)
 * - Emits typed events via EventEmitter for downstream processing
 * - Falls back to polling when fs.watch() is unavailable
 *
 * @module hooks/metrics/plan-events
 */

import { watch, type FSWatcher } from 'node:fs';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import type { PlanEvent } from './types.js';
import { EventEmitter } from '../utils/event-emitter.js';
import type { PlansConfig } from './types.js';

/**
 * Manifest entry from manifest.jsonl
 */
interface ManifestEntry {
  id: string;
  file: string;
  description: string;
  depends_on: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  verification: string;
}

/**
 * Internal state for a plan
 */
interface PlanState {
  planName: string;
  planPath: string;
  features: Map<string, 'pending' | 'in_progress' | 'completed' | 'failed'>;
}

/**
 * PlanEventsCapture - Monitors plan manifest files and emits events
 *
 * Lifecycle:
 * 1. start() - Scans active directory and sets up watchers
 * 2. Detects manifest.jsonl changes
 * 3. Emits events for status transitions
 * 4. stop() - Cleans up watchers and timers
 *
 * Events emitted:
 * - feature_started: Feature status changed to in_progress
 * - feature_completed: Feature status changed to completed
 * - feature_failed: Feature status changed to failed
 */
export class PlanEventsCapture {
  private watcher: FSWatcher | null = null;
  private pollTimer: Timer | null = null;
  private planStates: Map<string, PlanState> = new Map(); // planPath -> state
  private emitter: EventEmitter;
  private config: PlansConfig;

  constructor(config: PlansConfig, emitter: EventEmitter) {
    this.config = config;
    this.emitter = emitter;
  }

  /**
   * Start monitoring plan manifests
   *
   * - Performs initial scan of active directory
   * - Sets up file watching (or polling fallback)
   */
  start(): void {
    // Initial scan of active plans
    this.scanActiveDirectory();

    // Set up file watching if enabled
    if (this.config.watchManifest) {
      try {
        this.watcher = watch(
          this.config.activeDir,
          { recursive: true },
          (eventType, filename) => {
            if (filename && filename.endsWith('manifest.jsonl')) {
              this.handleManifestChange(join(this.config.activeDir, filename));
            }
          }
        );
      } catch (error) {
        console.warn('fs.watch failed for plans, using polling');
        this.startPolling();
      }
    }
  }

  /**
   * Scan active directory for existing plans
   *
   * Builds initial state without emitting events.
   */
  private scanActiveDirectory(): void {
    if (!existsSync(this.config.activeDir)) {
      return;
    }

    try {
      const entries = readdirSync(this.config.activeDir);

      for (const entry of entries) {
        const planPath = join(this.config.activeDir, entry);

        // Check if it's a directory
        try {
          const stats = statSync(planPath);
          if (!stats.isDirectory()) {
            continue;
          }
        } catch {
          continue;
        }

        // Look for manifest.jsonl
        const manifestPath = join(planPath, 'manifest.jsonl');
        if (existsSync(manifestPath)) {
          this.initializePlanState(manifestPath);
        }
      }
    } catch (error) {
      console.error('Error scanning active directory:', error);
    }
  }

  /**
   * Initialize plan state from manifest without emitting events
   */
  private initializePlanState(manifestPath: string): void {
    const planPath = dirname(manifestPath);
    const planName = basename(planPath);

    const entries = this.parseManifest(manifestPath);

    if (!this.planStates.has(planPath)) {
      this.planStates.set(planPath, {
        planName,
        planPath,
        features: new Map(),
      });
    }

    const state = this.planStates.get(planPath)!;

    for (const entry of entries) {
      state.features.set(entry.id, entry.status);
    }
  }

  /**
   * Handle manifest file change
   *
   * Detects status transitions and emits appropriate events.
   */
  private handleManifestChange(manifestPath: string): void {
    const planPath = dirname(manifestPath);
    const planName = basename(planPath);

    const entries = this.parseManifest(manifestPath);
    const currentState = this.planStates.get(planPath);

    for (const entry of entries) {
      const previousStatus = currentState?.features.get(entry.id);

      if (previousStatus && previousStatus !== entry.status) {
        // Status changed - emit event
        const event = this.createEvent(planName, planPath, entry, entry.status);
        this.emitter.emit('plan_event', event);
      }

      // Update state
      if (!this.planStates.has(planPath)) {
        this.planStates.set(planPath, {
          planName,
          planPath,
          features: new Map(),
        });
      }
      this.planStates.get(planPath)!.features.set(entry.id, entry.status);
    }
  }

  /**
   * Parse manifest.jsonl file
   *
   * Returns array of manifest entries, skipping invalid lines.
   */
  private parseManifest(manifestPath: string): ManifestEntry[] {
    if (!existsSync(manifestPath)) {
      return [];
    }

    try {
      const content = readFileSync(manifestPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      const entries: ManifestEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as ManifestEntry;
          entries.push(entry);
        } catch {
          // Skip malformed lines
          continue;
        }
      }

      return entries;
    } catch (error) {
      console.error('Error parsing manifest:', error);
      return [];
    }
  }

  /**
   * Create a plan event from a manifest entry
   */
  private createEvent(
    planName: string,
    planPath: string,
    entry: ManifestEntry,
    newStatus: string
  ): PlanEvent {
    let eventType: PlanEvent['event_type'];

    switch (newStatus) {
      case 'in_progress':
        eventType = 'feature_started';
        break;
      case 'completed':
        eventType = 'feature_completed';
        break;
      case 'failed':
        eventType = 'feature_failed';
        break;
      default:
        eventType = 'feature_started'; // Default for unexpected status
    }

    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      session_id: process.env.CLAUDE_SESSION_ID || 'unknown',
      event_type: eventType,
      plan_name: planName,
      plan_path: planPath,
      feature_id: entry.id,
      feature_description: entry.description,
      status: entry.status,
      data: {
        depends_on: entry.depends_on,
        verification: entry.verification,
      },
    };
  }

  /**
   * Start polling fallback for when fs.watch is unavailable
   */
  private startPolling(): void {
    // Poll every 5 seconds
    this.pollTimer = setInterval(() => {
      this.scanActiveDirectory();
    }, 5000);
  }

  /**
   * Stop monitoring and clean up resources
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
