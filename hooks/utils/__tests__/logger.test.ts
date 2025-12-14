/**
 * Unit tests for logger utility
 *
 * Tests the core logging functionality including:
 * - Log file path construction
 * - JSONL log writing
 * - Input/output helpers
 * - Heartbeat throttling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';

// Mock node:fs/promises module BEFORE importing logger
vi.mock('node:fs/promises', async () => {
  const mkdirMock = vi.fn().mockResolvedValue(undefined);
  const appendFileMock = vi.fn().mockResolvedValue(undefined);

  return {
    default: {
      mkdir: mkdirMock,
      appendFile: appendFileMock,
    },
    mkdir: mkdirMock,
    appendFile: appendFileMock,
  };
});

// Import after mocking to ensure mocks are applied
import {
  getLogFilePath,
  log,
  readInput,
  writeOutput,
  maybeWriteHeartbeat,
  resetHeartbeatState,
  LOGS_DIR,
  type LogEntry,
} from '../logger';

// Import the mocked functions for assertions
import { appendFile, mkdir } from 'node:fs/promises';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHeartbeatState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== getLogFilePath Tests =====
  describe('getLogFilePath', () => {
    it('returns correct path for session id', () => {
      const sessionId = 'session-abc123';
      const result = getLogFilePath(sessionId);

      expect(result).toBe(join(LOGS_DIR, 'session-abc123.txt'));
    });

    it('handles different session id formats', () => {
      const sessionIds = [
        'simple',
        'session-with-dashes',
        'session_with_underscores',
        '123-numeric-456',
      ];

      sessionIds.forEach((id) => {
        const result = getLogFilePath(id);
        expect(result).toBe(join(LOGS_DIR, `${id}.txt`));
      });
    });

    it('constructs path relative to logs directory', () => {
      const result = getLogFilePath('test-session');
      expect(result).toContain('logs');
      expect(result).toContain('test-session.txt');
    });
  });

  // ===== log Tests =====
  describe('log', () => {
    it('writes JSONL format to log file', async () => {
      const event = 'PreToolUse';
      const sessionId = 'test-session';
      const data = { tool_name: 'Read', tool_input: { file: 'test.ts' } };

      await log(event, sessionId, data);

      // Verify mkdir was called
      expect(mkdir).toHaveBeenCalledWith(LOGS_DIR, { recursive: true });

      // Verify appendFile was called
      expect(appendFile).toHaveBeenCalled();

      // Get the call arguments
      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const [filePath, content, encoding] = firstCall;

      // Verify correct file path
      expect(filePath).toBe(join(LOGS_DIR, 'test-session.txt'));

      // Verify encoding
      expect(encoding).toBe('utf-8');

      // Verify content is valid JSONL (ends with newline)
      expect(typeof content).toBe('string');
      expect(content).toMatch(/\n$/);

      // Parse the JSON (without the newline)
      const line = (content as string).trim();
      const entry: LogEntry = JSON.parse(line);

      // Verify entry structure
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('event', event);
      expect(entry).toHaveProperty('session_id', sessionId);
      expect(entry).toHaveProperty('data', data);

      // Verify timestamp is ISO 8601 format
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('creates logs directory if it does not exist', async () => {
      await log('SessionStart', 'session-1', { source: 'startup' });

      expect(mkdir).toHaveBeenCalledWith(LOGS_DIR, { recursive: true });
    });

    it('handles EEXIST error when directory already exists', async () => {
      // Mock mkdir to throw EEXIST error
      const existError = new Error('EEXIST: file already exists') as NodeJS.ErrnoException;
      existError.code = 'EEXIST';
      vi.mocked(mkdir).mockRejectedValueOnce(existError);

      // Should not throw - EEXIST is silently ignored
      await expect(log('SessionStart', 'session-1', {})).resolves.toBeUndefined();
    });

    it('rethrows non-EEXIST errors from mkdir', async () => {
      // Mock mkdir to throw permission error
      const permError = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      permError.code = 'EACCES';
      vi.mocked(mkdir).mockRejectedValueOnce(permError);

      // Should propagate the error
      await expect(log('SessionStart', 'session-1', {})).rejects.toThrow('EACCES');
    });

    it('logs different event types correctly', async () => {
      const events = [
        { event: 'UserPromptSubmit', data: { prompt: 'Hello' } },
        { event: 'PreToolUse', data: { tool_name: 'Bash' } },
        { event: 'PostToolUse', data: { result: 'success' } },
        { event: 'SessionEnd', data: { duration: 1000 } },
      ];

      for (const { event, data } of events) {
        await log(event, 'session-1', data);
      }

      // Verify appendFile was called for each event
      expect(appendFile).toHaveBeenCalledTimes(events.length);

      // Verify each call had correct event type
      const calls = vi.mocked(appendFile).mock.calls;
      events.forEach(({ event, data }, i) => {
        const content = calls[i]?.[1] as string;
        const entry: LogEntry = JSON.parse(content.trim());
        expect(entry.event).toBe(event);
        expect(entry.data).toEqual(data);
      });
    });

    it('handles empty data object', async () => {
      await log('Notification', 'session-1', {});

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.data).toEqual({});
    });

    it('handles complex nested data', async () => {
      const complexData = {
        tool_input: {
          nested: {
            deep: {
              value: 'test',
              array: [1, 2, 3],
            },
          },
        },
      };

      await log('PreToolUse', 'session-1', complexData);

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.data).toEqual(complexData);
    });
  });

  // ===== readInput Tests =====
  describe('readInput', () => {
    // Mock Bun global for test environment
    beforeEach(() => {
      (globalThis as any).Bun = {
        stdin: {
          text: vi.fn(),
        },
      };
    });

    it('parses JSON from stdin', async () => {
      const mockData = { tool_name: 'Read', session_id: 'abc123' };
      const textMock = vi.fn().mockResolvedValue(JSON.stringify(mockData));
      (globalThis as any).Bun.stdin.text = textMock;

      const result = await readInput();

      expect(textMock).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('handles typed input with generic parameter', async () => {
      interface TestInput {
        session_id: string;
        tool_name: string;
        tool_input: Record<string, unknown>;
      }

      const mockData: TestInput = {
        session_id: 'session-1',
        tool_name: 'Bash',
        tool_input: { command: 'ls' },
      };

      const textMock = vi.fn().mockResolvedValue(JSON.stringify(mockData));
      (globalThis as any).Bun.stdin.text = textMock;

      const result = await readInput<TestInput>();

      expect(result.session_id).toBe('session-1');
      expect(result.tool_name).toBe('Bash');
      expect(result.tool_input).toEqual({ command: 'ls' });
    });

    it('handles complex JSON structures', async () => {
      const mockData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
          bool: true,
          null_value: null,
        },
      };

      const textMock = vi.fn().mockResolvedValue(JSON.stringify(mockData));
      (globalThis as any).Bun.stdin.text = textMock;

      const result = await readInput();

      expect(result).toEqual(mockData);
    });

    it('throws error for invalid JSON', async () => {
      const textMock = vi.fn().mockResolvedValue('invalid json {');
      (globalThis as any).Bun.stdin.text = textMock;

      await expect(readInput()).rejects.toThrow();
    });
  });

  // ===== writeOutput Tests =====
  describe('writeOutput', () => {
    // Mock console.log
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('writes JSON to stdout', () => {
      const output = { continue: true };

      writeOutput(output);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(output));
    });

    it('handles hook-specific output', () => {
      const output = {
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
        },
      };

      writeOutput(output);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(output));

      // Verify the output is valid JSON
      const logged = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(logged);
      expect(parsed).toEqual(output);
    });

    it('handles additional context output', () => {
      const output = {
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: 'Current git branch: main',
        },
      };

      writeOutput(output);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logged = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(logged);
      expect(parsed.hookSpecificOutput.additionalContext).toBe('Current git branch: main');
    });

    it('handles updated tool input', () => {
      const output = {
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          updatedInput: { modified: true },
        },
      };

      writeOutput(output);

      const logged = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(logged);
      expect(parsed.hookSpecificOutput.updatedInput).toEqual({ modified: true });
    });

    it('serializes complex objects correctly', () => {
      const output = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      writeOutput(output);

      const logged = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(logged);
      expect(parsed).toEqual(output);
    });

    it('handles primitive values', () => {
      writeOutput('string output');
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify('string output'));

      writeOutput(42);
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(42));

      writeOutput(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(true));

      writeOutput(null);
      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(null));
    });
  });

  // ===== maybeWriteHeartbeat Tests =====
  describe('maybeWriteHeartbeat', () => {
    beforeEach(() => {
      // Reset state before each test
      resetHeartbeatState();
      vi.clearAllMocks();

      // Mock Date.now for consistent timing
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('writes heartbeat on first call', async () => {
      await maybeWriteHeartbeat('session-1', false, false);

      expect(appendFile).toHaveBeenCalled();

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.event).toBe('Heartbeat');
      expect(entry.session_id).toBe('session-1');
      expect(entry.data).toEqual({
        tool_count: 0,
        message_count: 0,
      });
    });

    it('increments tool count when incrementTool is true', async () => {
      await maybeWriteHeartbeat('session-1', true, false);

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.data.tool_count).toBe(1);
      expect(entry.data.message_count).toBe(0);
    });

    it('increments message count when incrementMessage is true', async () => {
      await maybeWriteHeartbeat('session-1', false, true);

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.data.tool_count).toBe(0);
      expect(entry.data.message_count).toBe(1);
    });

    it('increments both counters when both flags are true', async () => {
      await maybeWriteHeartbeat('session-1', true, true);

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.data.tool_count).toBe(1);
      expect(entry.data.message_count).toBe(1);
    });

    it('accumulates counts across multiple calls', async () => {
      // First call
      await maybeWriteHeartbeat('session-1', true, false);
      vi.advanceTimersByTime(31_000); // Advance past throttle threshold

      // Second call
      await maybeWriteHeartbeat('session-1', true, true);
      vi.advanceTimersByTime(31_000);

      // Third call
      await maybeWriteHeartbeat('session-1', false, true);

      // Check the last heartbeat
      const calls = vi.mocked(appendFile).mock.calls;
      const lastCall = calls[calls.length - 1];
      const content = lastCall?.[1] as string;
      const entry: LogEntry = JSON.parse(content.trim());

      expect(entry.data.tool_count).toBe(2);
      expect(entry.data.message_count).toBe(2);
    });

    it('throttles rapid heartbeats (within 30 seconds)', async () => {
      // First heartbeat
      await maybeWriteHeartbeat('session-1', true, false);

      // Clear mocks to verify next call doesn't write
      vi.clearAllMocks();

      // Advance time by only 10 seconds (less than 30s threshold)
      vi.advanceTimersByTime(10_000);

      // Second heartbeat (should be throttled)
      await maybeWriteHeartbeat('session-1', true, false);

      // Should NOT have written a log entry
      expect(appendFile).not.toHaveBeenCalled();
    });

    it('allows heartbeat after throttle interval (30 seconds)', async () => {
      // First heartbeat
      await maybeWriteHeartbeat('session-1', true, false);

      // Clear mocks
      vi.clearAllMocks();

      // Advance time past throttle threshold
      vi.advanceTimersByTime(31_000);

      // Second heartbeat (should be allowed)
      await maybeWriteHeartbeat('session-1', true, false);

      // Should have written a log entry
      expect(appendFile).toHaveBeenCalled();

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.event).toBe('Heartbeat');
      expect(entry.data.tool_count).toBe(2); // Accumulated count
    });

    it('updates counters even when throttled', async () => {
      // First heartbeat
      await maybeWriteHeartbeat('session-1', true, false);

      // Rapid calls (throttled)
      vi.advanceTimersByTime(1_000);
      await maybeWriteHeartbeat('session-1', true, false);

      vi.advanceTimersByTime(1_000);
      await maybeWriteHeartbeat('session-1', false, true);

      vi.advanceTimersByTime(1_000);
      await maybeWriteHeartbeat('session-1', true, true);

      // Wait for throttle to expire
      vi.clearAllMocks();
      vi.advanceTimersByTime(31_000);

      // Next heartbeat should show accumulated counts
      await maybeWriteHeartbeat('session-1', false, false);

      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      // Counts from all calls (including throttled ones)
      expect(entry.data.tool_count).toBe(3); // 1 + 1 + 0 + 1 = 3
      expect(entry.data.message_count).toBe(2); // 0 + 0 + 1 + 1 = 2
    });

    it('uses exact 30 second throttle interval', async () => {
      await maybeWriteHeartbeat('session-1', true, false);

      vi.clearAllMocks();

      // Exactly 29.999 seconds - should be throttled
      vi.advanceTimersByTime(29_999);
      await maybeWriteHeartbeat('session-1', true, false);
      expect(appendFile).not.toHaveBeenCalled();

      // Exactly 30 seconds from first - should be allowed
      vi.advanceTimersByTime(1);
      await maybeWriteHeartbeat('session-1', true, false);
      expect(appendFile).toHaveBeenCalled();
    });
  });

  // ===== resetHeartbeatState Tests =====
  describe('resetHeartbeatState', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resets heartbeat state to initial values', async () => {
      // Build up some state
      await maybeWriteHeartbeat('session-1', true, true);
      vi.advanceTimersByTime(31_000);
      await maybeWriteHeartbeat('session-1', true, true);

      // Reset state
      resetHeartbeatState();

      // Clear mocks and write new heartbeat
      vi.clearAllMocks();
      await maybeWriteHeartbeat('session-1', false, false);

      // Should have reset counts to 0
      const calls = vi.mocked(appendFile).mock.calls;
      const firstCall = calls[0];
      if (!firstCall) throw new Error('appendFile was not called');
      const content = firstCall[1];
      const entry: LogEntry = JSON.parse((content as string).trim());

      expect(entry.data.tool_count).toBe(0);
      expect(entry.data.message_count).toBe(0);
    });

    it('allows immediate heartbeat after reset', async () => {
      // First heartbeat
      await maybeWriteHeartbeat('session-1', true, false);

      // Immediately after (would normally be throttled)
      vi.advanceTimersByTime(1_000);

      // Reset state
      resetHeartbeatState();

      // Should allow heartbeat immediately after reset
      vi.clearAllMocks();
      await maybeWriteHeartbeat('session-1', true, false);

      expect(appendFile).toHaveBeenCalled();
    });
  });
});
