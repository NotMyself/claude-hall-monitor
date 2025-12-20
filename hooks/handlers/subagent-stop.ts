/**
 * SubagentStop hook handler
 *
 * Implements: F015 - Subagent Lifecycle Handlers
 *
 * This handler:
 * - Collects subagent_stopped metric when a subagent completes
 * - Captures session_id, subagent_id, and working directory
 * - Returns empty SubagentStopHookResult (no modifications)
 */

import type { SubagentStopHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: SubagentStopHookInput) => {
  const { session_id, cwd, agent_id, agent_transcript_path } = params;

  // Create metric for subagent stop
  const metric: MetricEntry = {
    id: `subagent-stop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'subagent_stopped',
    event_category: 'session',
    data: {
      agent_id,
      agent_transcript_path,
      cwd,
    },
    tags: ['subagent', 'stop', agent_id],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
