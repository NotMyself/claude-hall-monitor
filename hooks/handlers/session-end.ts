/**
 * SessionEnd hook handler
 *
 * Implements: F012 - Session Handlers
 *
 * This handler:
 * - Collects session_ended metric when a session terminates
 * - Captures session_id and working directory
 * - Flushes remaining metrics via collector.shutdown()
 * - Closes database connection
 * - Returns empty SessionEndHookResult (no modifications)
 */

import type { SessionEndHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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
});

const hook = async (params: SessionEndHookInput) => {
  const { session_id, cwd } = params;

  // Create metric for session end
  const metric: MetricEntry = {
    id: `session-end-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'session_ended',
    event_category: 'session',
    data: {
      cwd,
    },
    tags: ['session', 'end'],
  };

  collector.collect(metric);

  // Flush remaining metrics and shutdown
  await collector.shutdown();
  database.close();

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
