/**
 * Tests for PlanEventsCapture
 *
 * Validates plan event capture from manifest.jsonl files.
 * Tests status change detection and event emission.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { PlanEventsCapture } from '../plan-events';
import { EventEmitter } from '../../utils/event-emitter';
import type { PlansConfig, PlanEvent } from '../types';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('PlanEventsCapture', () => {
  let tempDir: string;
  let config: PlansConfig;
  let emitter: EventEmitter;
  let capture: PlanEventsCapture;
  let emitSpy: Mock;

  beforeEach(() => {
    // Create temporary test directory
    tempDir = join(tmpdir(), `plan-events-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });

    config = {
      activeDir: join(tempDir, 'active'),
      completeDir: join(tempDir, 'complete'),
      watchManifest: false, // Disable watching for tests
    };

    mkdirSync(config.activeDir, { recursive: true });

    emitter = new EventEmitter();
    emitSpy = vi.fn();
    emitter.on('plan_event', emitSpy);

    // Set session ID for tests
    process.env.CLAUDE_SESSION_ID = 'test-session-123';
  });

  afterEach(() => {
    if (capture) {
      capture.stop();
    }
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize correctly with config and emitter', () => {
      capture = new PlanEventsCapture(config, emitter);
      expect(capture).toBeDefined();
    });
  });

  describe('start', () => {
    it('should scan active directory on start', () => {
      // Create a plan with manifest
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'First feature',
        depends_on: [],
        status: 'pending',
        verification: 'Tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();

      // Initial scan should not emit events (no status changes yet)
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should handle empty active directory', () => {
      capture = new PlanEventsCapture(config, emitter);
      capture.start();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('parseManifest', () => {
    it('should parse JSONL entries from manifest file', () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      const entries = [
        {
          id: 'F001',
          file: 'feature-1.md',
          description: 'First feature',
          depends_on: [],
          status: 'pending',
          verification: 'Tests pass',
        },
        {
          id: 'F002',
          file: 'feature-2.md',
          description: 'Second feature',
          depends_on: ['F001'],
          status: 'pending',
          verification: 'Build succeeds',
        },
      ];

      writeFileSync(manifestPath, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      capture = new PlanEventsCapture(config, emitter);
      const parsed = (capture as any).parseManifest(manifestPath);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('F001');
      expect(parsed[1].id).toBe('F002');
    });

    it('should handle malformed JSONL lines gracefully', () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      const content = `{"id":"F001","file":"f1.md","description":"Valid","depends_on":[],"status":"pending","verification":"OK"}
invalid json line
{"id":"F002","file":"f2.md","description":"Also valid","depends_on":[],"status":"pending","verification":"OK"}
`;

      writeFileSync(manifestPath, content);

      capture = new PlanEventsCapture(config, emitter);
      const parsed = (capture as any).parseManifest(manifestPath);

      // Should parse valid lines, skip invalid
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('F001');
      expect(parsed[1].id).toBe('F002');
    });

    it('should return empty array for non-existent file', () => {
      capture = new PlanEventsCapture(config, emitter);
      const parsed = (capture as any).parseManifest(join(tempDir, 'nonexistent.jsonl'));

      expect(parsed).toEqual([]);
    });
  });

  describe('handleManifestChange', () => {
    it('should emit feature_started when status changes to in_progress', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      // Initial state: pending
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'pending',
        verification: 'Tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();

      // Clear initial scan calls
      emitSpy.mockClear();

      // Update to in_progress
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'in_progress',
        verification: 'Tests pass',
      }) + '\n');

      (capture as any).handleManifestChange(manifestPath);

      // Wait for async emit
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const event: PlanEvent = emitSpy.mock.calls[0]?.[0];
      expect(event.event_type).toBe('feature_started');
      expect(event.plan_name).toBe('test-plan');
      expect(event.feature_id).toBe('F001');
      expect(event.status).toBe('in_progress');
    });

    it('should emit feature_completed when status changes to completed', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      // Start with in_progress
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'in_progress',
        verification: 'Tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();
      emitSpy.mockClear();

      // Update to completed
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'completed',
        verification: 'Tests pass',
      }) + '\n');

      (capture as any).handleManifestChange(manifestPath);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const event: PlanEvent = emitSpy.mock.calls[0]?.[0];
      expect(event.event_type).toBe('feature_completed');
      expect(event.status).toBe('completed');
    });

    it('should emit feature_failed when status changes to failed', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'in_progress',
        verification: 'Tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();
      emitSpy.mockClear();

      // Update to failed
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'failed',
        verification: 'Tests pass',
      }) + '\n');

      (capture as any).handleManifestChange(manifestPath);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitSpy).toHaveBeenCalledTimes(1);
      const event: PlanEvent = emitSpy.mock.calls[0]?.[0];
      expect(event.event_type).toBe('feature_failed');
      expect(event.status).toBe('failed');
    });

    it('should not emit events if status has not changed', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'pending',
        verification: 'Tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();
      emitSpy.mockClear();

      // Call again with same status
      (capture as any).handleManifestChange(manifestPath);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple features in one manifest', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      const entries = [
        {
          id: 'F001',
          file: 'feature-1.md',
          description: 'First feature',
          depends_on: [],
          status: 'pending',
          verification: 'Tests pass',
        },
        {
          id: 'F002',
          file: 'feature-2.md',
          description: 'Second feature',
          depends_on: ['F001'],
          status: 'pending',
          verification: 'Build succeeds',
        },
      ];

      writeFileSync(manifestPath, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();
      emitSpy.mockClear();

      // Update both to in_progress
      const updatedEntries = [
        { ...entries[0], status: 'in_progress' },
        { ...entries[1], status: 'in_progress' },
      ];

      writeFileSync(manifestPath, updatedEntries.map(e => JSON.stringify(e)).join('\n') + '\n');

      (capture as any).handleManifestChange(manifestPath);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitSpy).toHaveBeenCalledTimes(2);
      expect(emitSpy.mock.calls[0]?.[0]?.feature_id).toBe('F001');
      expect(emitSpy.mock.calls[1]?.[0]?.feature_id).toBe('F002');
    });

    it('should include feature metadata in event data', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: ['F000'],
        status: 'pending',
        verification: 'All tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();
      emitSpy.mockClear();

      // Update to in_progress
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: ['F000'],
        status: 'in_progress',
        verification: 'All tests pass',
      }) + '\n');

      (capture as any).handleManifestChange(manifestPath);

      await new Promise(resolve => setTimeout(resolve, 10));

      const event: PlanEvent = emitSpy.mock.calls[0]?.[0];
      expect(event.feature_description).toBe('Test feature');
      expect(event.data.depends_on).toEqual(['F000']);
      expect(event.data.verification).toBe('All tests pass');
    });
  });

  describe('stop', () => {
    it('should clean up watcher and timer resources', () => {
      capture = new PlanEventsCapture(config, emitter);
      capture.start();

      // No errors should occur
      expect(() => capture.stop()).not.toThrow();
    });

    it('should be safe to call stop multiple times', () => {
      capture = new PlanEventsCapture(config, emitter);
      capture.start();

      capture.stop();
      expect(() => capture.stop()).not.toThrow();
    });
  });

  describe('event structure', () => {
    it('should emit events with valid structure', async () => {
      const planDir = join(config.activeDir, 'test-plan');
      mkdirSync(planDir, { recursive: true });
      const manifestPath = join(planDir, 'manifest.jsonl');

      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'pending',
        verification: 'Tests pass',
      }) + '\n');

      capture = new PlanEventsCapture(config, emitter);
      capture.start();
      emitSpy.mockClear();

      // Trigger change
      writeFileSync(manifestPath, JSON.stringify({
        id: 'F001',
        file: 'feature-1.md',
        description: 'Test feature',
        depends_on: [],
        status: 'in_progress',
        verification: 'Tests pass',
      }) + '\n');

      (capture as any).handleManifestChange(manifestPath);

      await new Promise(resolve => setTimeout(resolve, 10));

      const event: PlanEvent = emitSpy.mock.calls[0]?.[0];

      // Verify all required fields
      expect(typeof event.id).toBe('string');
      expect(event.id).toMatch(/^plan-/);
      expect(typeof event.timestamp).toBe('string');
      expect(event.session_id).toBe('test-session-123');
      expect(event.event_type).toBe('feature_started');
      expect(event.plan_name).toBe('test-plan');
      expect(typeof event.plan_path).toBe('string');
      expect(event.feature_id).toBe('F001');
      expect(event.feature_description).toBe('Test feature');
      expect(event.status).toBe('in_progress');
      expect(typeof event.data).toBe('object');
    });
  });
});
