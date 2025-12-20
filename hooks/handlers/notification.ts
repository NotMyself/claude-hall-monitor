/**
 * Notification hook handler
 *
 * Implements: F016 - System Event Handlers
 *
 * This handler:
 * - Collects notification metric when system sends notifications
 * - Captures session_id, message content, and working directory
 * - Returns empty NotificationHookResult (no modifications)
 */

import type { NotificationHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: NotificationHookInput) => {
  const { session_id, cwd, message } = params;

  // Create metric for notification
  const metric: MetricEntry = {
    id: `notification-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'notification',
    event_category: 'custom',
    data: {
      message,
      cwd,
    },
    tags: ['notification', 'system'],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
