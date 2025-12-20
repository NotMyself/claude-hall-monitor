/**
 * Handler tests
 *
 * Implements: F027 - Hook handler tests
 *
 * Note: Handlers are designed to run as standalone scripts that:
 * 1. Initialize MetricsCollector with Database and EventEmitter
 * 2. Collect metrics for hook events
 * 3. Output valid JSON to stdout
 *
 * The integration tests in integration.test.ts verify the core
 * data pipeline (Database → MetricsCollector → EventEmitter).
 *
 * These tests verify handler-specific logic patterns and structure.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HANDLERS_DIR = join(__dirname, '..');

describe('Hook Handlers', () => {
  const handlers = [
    'session-start.ts',
    'session-end.ts',
    'user-prompt-submit.ts',
    'stop.ts',
    'pre-tool-use.ts',
    'post-tool-use.ts',
    'post-tool-use-failure.ts',
    'notification.ts',
    'pre-compact.ts',
    'subagent-start.ts',
    'subagent-stop.ts',
    'permission-request.ts',
  ];

  describe('File structure', () => {
    handlers.forEach((handler) => {
      test(`${handler} exists and has correct imports`, () => {
        const handlerPath = join(HANDLERS_DIR, handler);
        const content = readFileSync(handlerPath, 'utf-8');

        // Verify essential imports
        expect(content).toContain("from '@anthropic-ai/claude-agent-sdk'");
        expect(content).toContain("from '../metrics/collector'");
        expect(content).toContain("from '../metrics/database'");
        expect(content).toContain("from '../utils/event-emitter'");
        expect(content).toContain("from '../metrics/config'");
      });
    });
  });

  describe('Handler patterns', () => {
    handlers.forEach((handler) => {
      test(`${handler} initializes metrics infrastructure`, () => {
        const handlerPath = join(HANDLERS_DIR, handler);
        const content = readFileSync(handlerPath, 'utf-8');

        // Verify initialization pattern
        expect(content).toContain('getConfig()');
        expect(content).toContain('new EventEmitter()');
        expect(content).toContain('new Database(');
        expect(content).toContain('new MetricsCollector(');
      });

      test(`${handler} collects metrics`, () => {
        const handlerPath = join(HANDLERS_DIR, handler);
        const content = readFileSync(handlerPath, 'utf-8');

        // Verify metric collection
        expect(content).toContain('collector.collect(');
        expect(content).toContain('event_type:');
        expect(content).toContain('event_category:');
        expect(content).toContain('session_id');
      });

      test(`${handler} outputs valid JSON`, () => {
        const handlerPath = join(HANDLERS_DIR, handler);
        const content = readFileSync(handlerPath, 'utf-8');

        // Verify JSON output
        expect(content).toContain('console.log(JSON.stringify(');
      });
    });
  });

  describe('Event categories', () => {
    const expectedCategories = {
      'session-start.ts': 'session',
      'session-end.ts': 'session',
      'user-prompt-submit.ts': 'user',
      'stop.ts': 'user',
      'pre-tool-use.ts': 'tool',
      'post-tool-use.ts': 'tool',
      'post-tool-use-failure.ts': 'tool',
      'notification.ts': 'custom',
      'pre-compact.ts': 'session',
      'subagent-start.ts': 'session',
      'subagent-stop.ts': 'session',
      'permission-request.ts': 'custom',
    };

    Object.entries(expectedCategories).forEach(([handler, category]) => {
      test(`${handler} uses '${category}' event category`, () => {
        const handlerPath = join(HANDLERS_DIR, handler);
        const content = readFileSync(handlerPath, 'utf-8');

        expect(content).toContain(`event_category: '${category}'`);
      });
    });
  });

  describe('Event types', () => {
    const expectedEventTypes = {
      'session-start.ts': 'session_started',
      'session-end.ts': 'session_ended',
      'user-prompt-submit.ts': 'user_prompt',
      'stop.ts': 'user_stop',
      'pre-tool-use.ts': 'tool_start',
      'post-tool-use.ts': 'tool_completed',
      'post-tool-use-failure.ts': 'tool_failed',
      'notification.ts': 'notification',
      'pre-compact.ts': 'pre_compact',
      'subagent-start.ts': 'subagent_started',
      'subagent-stop.ts': 'subagent_stopped',
      'permission-request.ts': 'permission_request',
    };

    Object.entries(expectedEventTypes).forEach(([handler, eventType]) => {
      test(`${handler} uses '${eventType}' event type`, () => {
        const handlerPath = join(HANDLERS_DIR, handler);
        const content = readFileSync(handlerPath, 'utf-8');

        expect(content).toContain(`event_type: '${eventType}'`);
      });
    });
  });

  describe('Data collection', () => {
    test('session-start.ts collects session metadata', () => {
      const content = readFileSync(join(HANDLERS_DIR, 'session-start.ts'), 'utf-8');
      expect(content).toContain('data: {');
      expect(content).toContain('cwd');
    });

    test('tool handlers collect tool metadata', () => {
      ['pre-tool-use.ts', 'post-tool-use.ts', 'post-tool-use-failure.ts'].forEach((handler) => {
        const content = readFileSync(join(HANDLERS_DIR, handler), 'utf-8');
        expect(content).toContain('tool_name');
      });
    });

    test('post-tool-use.ts collects success status', () => {
      const content = readFileSync(join(HANDLERS_DIR, 'post-tool-use.ts'), 'utf-8');
      expect(content).toContain('tool_success');
    });

    test('user-prompt-submit.ts collects prompt data', () => {
      const content = readFileSync(join(HANDLERS_DIR, 'user-prompt-submit.ts'), 'utf-8');
      expect(content).toContain('prompt');
    });
  });

  describe('Collector configuration', () => {
    const handlersWithConfig = handlers.filter((h) => h !== 'session-end.ts');

    handlersWithConfig.forEach((handler) => {
      test(`${handler} configures collector with proper intervals`, () => {
        const content = readFileSync(join(HANDLERS_DIR, handler), 'utf-8');

        // Verify collector configuration
        expect(content).toContain('flushIntervalMs:');
        expect(content).toContain('maxBufferSize:');
      });
    });

    test('session-end.ts uses default collector config', () => {
      const content = readFileSync(join(HANDLERS_DIR, 'session-end.ts'), 'utf-8');

      // session-end uses default config (no explicit flush intervals)
      expect(content).toContain('new MetricsCollector({');
      expect(content).not.toContain('flushIntervalMs:');
    });
  });
});
