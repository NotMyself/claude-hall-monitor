/**
 * PostToolUse hook handler
 *
 * Implements: F014 - Tool Execution Handlers
 *
 * This handler:
 * - Collects tool_completed metric after successful tool execution
 * - Captures session_id, tool name, input, and output
 * - Returns empty PostToolUseHookResult (no modifications)
 */

import type { PostToolUseHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: PostToolUseHookInput) => {
  const { session_id, cwd, tool_name, tool_input, tool_response } = params;

  // Create metric for tool completion
  const metric: MetricEntry = {
    id: `tool-completed-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'tool_completed',
    event_category: 'tool',
    tool_name,
    tool_success: true,
    data: {
      tool_input,
      tool_response,
      cwd,
    },
    tags: ['tool', 'completed', 'success', tool_name],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
