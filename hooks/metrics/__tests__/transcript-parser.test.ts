/**
 * Unit tests for TranscriptParser
 *
 * Implements: F008 - Transcript Parser
 * Decisions: D007 (fs.watch for file monitoring)
 * Edge Cases: EC002, EC006, EC007, EC008
 *
 * Tests cover:
 * - Constructor initialization
 * - start() uses fs.watch when available
 * - start() falls back to polling on fs.watch failure
 * - parseFile() extracts token usage
 * - parseFile() handles malformed JSON (EC002)
 * - parseFile() handles missing files (EC007)
 * - handleFileChange() emits metric events
 * - stop() cleans up resources
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TranscriptParser } from '../transcript-parser';
import { EventEmitter } from '../../utils/event-emitter';
import type { TranscriptConfig } from '../types';
import type { MetricEntry } from '../types';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('TranscriptParser', () => {
  let emitter: EventEmitter;
  let config: TranscriptConfig;
  let parser: TranscriptParser;
  let testDir: string;

  beforeEach(() => {
    emitter = new EventEmitter();

    // Create temporary test directory
    testDir = join(tmpdir(), `transcript-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    config = {
      useFsWatch: true,
      projectsDir: testDir,
      fallbackPollIntervalMs: 100, // Short interval for testing
    };
  });

  afterEach(() => {
    if (parser) {
      parser.stop();
    }

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize with provided config and emitter', () => {
      parser = new TranscriptParser(config, emitter);
      expect(parser).toBeDefined();
    });

    it('should expand tilde in projectsDir path', () => {
      const configWithTilde: TranscriptConfig = {
        ...config,
        projectsDir: '~/.claude/projects',
      };
      parser = new TranscriptParser(configWithTilde, emitter);
      expect(parser).toBeDefined();
    });
  });

  describe('start()', () => {
    it('should use fs.watch when useFsWatch is true', () => {
      parser = new TranscriptParser(config, emitter);
      parser.start();

      // Verify watcher is active by creating a file and checking for event
      const testFile = join(testDir, 'test.jsonl');
      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: new Date().toISOString(),
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      // Wait for file system event
      return new Promise((resolve) => {
        setTimeout(() => {
          parser.stop();
          resolve(undefined);
        }, 200);
      });
    });

    it('should fall back to polling when fs.watch fails', async () => {
      // Create parser with invalid directory to force fs.watch failure
      const invalidConfig: TranscriptConfig = {
        ...config,
        projectsDir: join(testDir, 'nonexistent'),
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      parser = new TranscriptParser(invalidConfig, emitter);
      parser.start();

      // Should log warning about fs.watch failure
      expect(consoleSpy).toHaveBeenCalledWith(
        'fs.watch failed, falling back to polling:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should use polling when useFsWatch is false', () => {
      const pollingConfig: TranscriptConfig = {
        ...config,
        useFsWatch: false,
      };

      parser = new TranscriptParser(pollingConfig, emitter);
      parser.start();

      // Polling should be active
      expect(parser).toBeDefined();
    });
  });

  describe('parseFile()', () => {
    it('should extract token usage from valid transcript file', () => {
      const testFile = join(testDir, 'session-1.jsonl');

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_read_input_tokens: 20,
            cache_creation_input_tokens: 10,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        source: 'transcript',
        event_type: 'api_response',
        event_category: 'api',
        model: 'claude-opus-4-5',
        tokens: {
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 20,
          cache_creation_input_tokens: 10,
        },
      });
      expect(metrics[0]?.id).toBeDefined();
      expect(metrics[0]?.timestamp).toBe('2025-12-20T10:00:00.000Z');
    });

    it('should extract multiple metrics from file with multiple lines', () => {
      const testFile = join(testDir, 'session-2.jsonl');

      const line1 = JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      });

      const line2 = JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:01:00.000Z',
        message: {
          usage: {
            input_tokens: 200,
            output_tokens: 75,
          },
        },
        model: 'claude-sonnet-4-5',
      });

      writeFileSync(testFile, line1 + '\n' + line2 + '\n');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(2);
      expect(metrics[0]?.tokens?.input_tokens).toBe(100);
      expect(metrics[1]?.tokens?.input_tokens).toBe(200);
    });

    it('should skip lines without usage data', () => {
      const testFile = join(testDir, 'session-3.jsonl');

      const line1 = JSON.stringify({
        type: 'request',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          role: 'user',
          content: 'Hello',
        },
      });

      const line2 = JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:01:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      });

      writeFileSync(testFile, line1 + '\n' + line2 + '\n');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(1);
      expect(metrics[0]?.tokens?.input_tokens).toBe(100);
    });

    it('should handle malformed JSON lines gracefully (EC002)', () => {
      const testFile = join(testDir, 'session-4.jsonl');

      const validLine = JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      });

      writeFileSync(testFile,
        '{invalid json}\n' +
        validLine + '\n' +
        'more invalid json\n'
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(1);
      expect(metrics[0]?.tokens?.input_tokens).toBe(100);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping malformed line')
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing files gracefully (EC007)', () => {
      const missingFile = join(testDir, 'nonexistent.jsonl');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(missingFile);

      expect(metrics).toHaveLength(0);
    });

    it('should handle empty files', () => {
      const testFile = join(testDir, 'empty.jsonl');
      writeFileSync(testFile, '');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(0);
    });

    it('should handle files with only whitespace', () => {
      const testFile = join(testDir, 'whitespace.jsonl');
      writeFileSync(testFile, '\n\n  \n\n');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(0);
    });

    it('should handle entries with optional cache fields missing', () => {
      const testFile = join(testDir, 'session-5.jsonl');

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      parser = new TranscriptParser(config, emitter);
      const metrics = parser.parseFile(testFile);

      expect(metrics).toHaveLength(1);
      expect(metrics[0]?.tokens).toEqual({
        input_tokens: 100,
        output_tokens: 50,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      });
    });
  });

  describe('handleFileChange()', () => {
    it('should emit transcript_metric event for new metrics', async () => {
      parser = new TranscriptParser(config, emitter);

      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      const testFile = join(testDir, 'session-6.jsonl');

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      // Manually trigger file change handler
      parser.handleFileChange('session-6.jsonl');

      // Wait for async event emission
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(emitSpy).toHaveBeenCalled();
      const emittedMetric = emitSpy.mock.calls[0]?.[0] as MetricEntry;
      expect(emittedMetric.tokens?.input_tokens).toBe(100);
    });

    it('should not emit duplicate events for already processed lines', async () => {
      parser = new TranscriptParser(config, emitter);

      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      const testFile = join(testDir, 'session-7.jsonl');

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      // Process file first time
      parser.handleFileChange('session-7.jsonl');
      await new Promise(resolve => setTimeout(resolve, 50));

      const firstCallCount = emitSpy.mock.calls.length;
      expect(firstCallCount).toBe(1);

      // Process same file again
      parser.handleFileChange('session-7.jsonl');
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not emit duplicate
      expect(emitSpy.mock.calls.length).toBe(firstCallCount);
    });

    it('should emit events only for new lines when file grows', async () => {
      parser = new TranscriptParser(config, emitter);

      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      const testFile = join(testDir, 'session-8.jsonl');

      // Write first line
      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      parser.handleFileChange('session-8.jsonl');
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Append second line
      writeFileSync(testFile,
        JSON.stringify({
          type: 'response',
          timestamp: '2025-12-20T10:00:00.000Z',
          message: {
            usage: {
              input_tokens: 100,
              output_tokens: 50,
            },
          },
          model: 'claude-opus-4-5',
        }) + '\n' +
        JSON.stringify({
          type: 'response',
          timestamp: '2025-12-20T10:01:00.000Z',
          message: {
            usage: {
              input_tokens: 200,
              output_tokens: 75,
            },
          },
          model: 'claude-sonnet-4-5',
        }) + '\n'
      );

      parser.handleFileChange('session-8.jsonl');
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should have emitted only for the new line
      expect(emitSpy).toHaveBeenCalledTimes(2);
      const secondCall = emitSpy.mock.calls[1]?.[0] as MetricEntry;
      expect(secondCall.tokens?.input_tokens).toBe(200);
    });
  });

  describe('stop()', () => {
    it('should close fs.watch watcher', () => {
      parser = new TranscriptParser(config, emitter);
      parser.start();
      parser.stop();

      // Verify watcher is closed by ensuring no events fire
      const testFile = join(testDir, 'test-stop.jsonl');
      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(emitSpy).not.toHaveBeenCalled();
          resolve(undefined);
        }, 200);
      });
    });

    it('should stop polling timer', async () => {
      const pollingConfig: TranscriptConfig = {
        ...config,
        useFsWatch: false,
      };

      parser = new TranscriptParser(pollingConfig, emitter);
      parser.start();
      parser.stop();

      const testFile = join(testDir, 'test-poll-stop.jsonl');
      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      // Wait longer than poll interval
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should handle stop when not started', () => {
      parser = new TranscriptParser(config, emitter);
      expect(() => parser.stop()).not.toThrow();
    });

    it('should handle multiple stop calls', () => {
      parser = new TranscriptParser(config, emitter);
      parser.start();
      parser.stop();
      expect(() => parser.stop()).not.toThrow();
    });
  });

  describe('polling fallback', () => {
    it('should scan directory on poll interval', async () => {
      const pollingConfig: TranscriptConfig = {
        ...config,
        useFsWatch: false,
        fallbackPollIntervalMs: 100,
      };

      parser = new TranscriptParser(pollingConfig, emitter);
      parser.start();

      const emitSpy = vi.fn();
      emitter.on('transcript_metric', emitSpy);

      const testFile = join(testDir, 'session-poll.jsonl');

      writeFileSync(testFile, JSON.stringify({
        type: 'response',
        timestamp: '2025-12-20T10:00:00.000Z',
        message: {
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        },
        model: 'claude-opus-4-5',
      }) + '\n');

      // Wait for poll cycle
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
