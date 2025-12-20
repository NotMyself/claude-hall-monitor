/**
 * PermissionRequest hook handler
 *
 * Implements: F016 - System Event Handlers
 *
 * This handler:
 * - Collects permission_request metric when permissions are requested
 * - Captures session_id, permission type, and working directory
 * - Returns empty PermissionRequestHookResult (no modifications)
 */

import type { PermissionRequestHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: PermissionRequestHookInput) => {
  const { session_id, cwd, tool_name, tool_input, permission_suggestions } = params;

  // Create metric for permission request
  const metric: MetricEntry = {
    id: `permission-request-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'permission_request',
    event_category: 'custom',
    tool_name,
    data: {
      tool_input,
      permission_suggestions,
      cwd,
    },
    tags: ['permission', 'request', tool_name],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
