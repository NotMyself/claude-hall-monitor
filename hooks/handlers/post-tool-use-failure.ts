/**
 * PostToolUseFailure hook handler
 *
 * Implements: F014 - Tool Execution Handlers
 *
 * This handler:
 * - Collects tool_failed metric after failed tool execution
 * - Captures session_id, tool name, input, and error details
 * - Returns empty PostToolUseFailureHookResult (no modifications)
 */

import type { PostToolUseFailureHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: PostToolUseFailureHookInput) => {
  const { session_id, cwd, tool_name, tool_input, error } = params;

  // Create metric for tool failure
  const metric: MetricEntry = {
    id: `tool-failed-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'tool_failed',
    event_category: 'tool',
    tool_name,
    tool_success: false,
    data: {
      tool_input,
      error,
      cwd,
    },
    tags: ['tool', 'failed', 'error', tool_name],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
