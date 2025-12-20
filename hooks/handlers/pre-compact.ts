/**
 * PreCompact hook handler
 *
 * Implements: F016 - System Event Handlers
 *
 * This handler:
 * - Collects pre_compact metric before context compaction
 * - Captures session_id and working directory
 * - Returns empty PreCompactHookResult (no modifications)
 */

import type { PreCompactHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: PreCompactHookInput) => {
  const { session_id, cwd } = params;

  // Create metric for pre-compact
  const metric: MetricEntry = {
    id: `pre-compact-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'pre_compact',
    event_category: 'session',
    data: {
      cwd,
    },
    tags: ['compact', 'context', 'pre'],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
