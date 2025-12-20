/**
 * SessionStart hook handler
 *
 * Implements: F012 - Session Handlers
 *
 * This handler:
 * - Collects session_started metric when a new session begins
 * - Captures session_id and working directory
 * - Returns empty SessionStartHookResult (no modifications)
 */

import type { SessionStartHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
import { MetricsCollector } from '../metrics/collector';
import { Database } from '../metrics/database';
import { EventEmitter } from '../utils/event-emitter';
import { getConfig } from '../metrics/config';
import type { MetricEntry } from '../metrics/types';

// Create shared instances
const config = getConfig();
const emitter = new EventEmitter();
const database = new Database(config.databasePath);
const collector = new MetricsCollector({
  database,
  emitter,
  flushIntervalMs: 5000,
  maxBufferSize: 100,
});

const hook = async (params: SessionStartHookInput) => {
  const { session_id, cwd } = params;

  // Create metric for session start
  const metric: MetricEntry = {
    id: `session-start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'session_started',
    event_category: 'session',
    data: {
      cwd,
    },
    tags: ['session', 'start'],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
