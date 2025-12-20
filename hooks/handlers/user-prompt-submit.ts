/**
 * UserPromptSubmit hook handler
 *
 * Implements: F013 - User Interaction Handlers
 *
 * This handler:
 * - Collects user_prompt metric when user submits a prompt
 * - Captures session_id, working directory, and prompt text
 * - Returns empty UserPromptSubmitHookResult (no modifications)
 */

import type { UserPromptSubmitHookInput, HookJSONOutput } from '@anthropic-ai/claude-agent-sdk';
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

const hook = async (params: UserPromptSubmitHookInput) => {
  const { session_id, cwd, prompt } = params;

  // Create metric for user prompt submission
  const metric: MetricEntry = {
    id: `user-prompt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id,
    project_path: cwd,
    source: 'hook',
    event_type: 'user_prompt',
    event_category: 'user',
    data: {
      prompt_length: prompt.length,
      cwd,
    },
    tags: ['user', 'prompt'],
  };

  collector.collect(metric);

  // Return valid HookJSONOutput
  const result: HookJSONOutput = {};

  // Output valid JSON
  console.log(JSON.stringify(result));
};

hook(JSON.parse(process.argv[2] || '{}'));
