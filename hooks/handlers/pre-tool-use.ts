/**
 * PreToolUse hook handler
 *
 * Implements: F014 - Tool Execution Handlers
 *
 * This handler:
 * - Collects tool_start metric before tool execution
 * - Captures session_id, tool name, and tool input
 * - Returns empty PreToolUseHookResult (no modifications)
 */

import type { PreToolUseHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: PreToolUseHookInput) => {
  const { session_id, cwd, tool_name, tool_input } = params;

  // Create metric for tool start
  const metric: MetricEntry = {
    id: `tool-start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'tool_start',
    event_category: 'tool',
    tool_name,
    data: {
      tool_input,
      cwd,
    },
    tags: ['tool', 'start', tool_name],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
