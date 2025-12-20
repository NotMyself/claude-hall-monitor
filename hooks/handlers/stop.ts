/**
 * Stop hook handler
 *
 * Implements: F013 - User Interaction Handlers
 *
 * This handler:
 * - Collects user_stop metric when user interrupts execution
 * - Captures session_id and working directory
 * - Returns empty StopHookResult (no modifications)
 */

import type { StopHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: StopHookInput) => {
  const { session_id, cwd } = params;

  // Create metric for user stop/interrupt
  const metric: MetricEntry = {
    id: `user-stop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'user_stop',
    event_category: 'user',
    data: {
      cwd,
    },
    tags: ['user', 'stop', 'interrupt'],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
