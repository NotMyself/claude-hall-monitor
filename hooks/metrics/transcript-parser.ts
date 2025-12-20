/**
 * TranscriptParser - Watch and parse Claude transcript files for token usage
 *
 * Implements: F008 - Transcript Parser
 * Decisions: D007 (fs.watch for file monitoring)
 * Edge Cases: EC002, EC006, EC007, EC008
 *
 * Features:
 * - Event-driven file watching with fs.watch
 * - Automatic polling fallback when fs.watch unavailable
 * - Incremental parsing (only new lines processed)
 * - Robust error handling for malformed JSON and missing files
 * - Emits 'transcript_metric' events for each parsed metric
 */

import { watch, type FSWatcher } from 'fs';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { MetricEntry, TokenUsage } from './types.js';
import { EventEmitter } from '../utils/event-emitter.js';
import type { TranscriptConfig } from './types.js';
import { randomUUID } from 'crypto';

/**
 * Transcript entry format from Claude API
 */
export interface TranscriptEntry {
  type: string;
  timestamp: string;
  message?: {
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
  model?: string;
}

/**
 * TranscriptParser - Watch ~/.claude/projects/ for transcript files
 *
 * Usage:
 * ```typescript
 * const parser = new TranscriptParser(config, emitter);
 * parser.start();
 *
 * emitter.on('transcript_metric', (metric) => {
 *   console.log('Token usage:', metric.tokens);
 * });
 *
 * // Later...
 * parser.stop();
 * ```
 */
export class TranscriptParser {
  private watcher: FSWatcher | null = null;
  private pollTimer: Timer | null = null;
  private processedLines: Map<string, number> = new Map(); // file -> last line processed
  private emitter: EventEmitter;
  private config: TranscriptConfig;
  private projectsDir: string;

  constructor(config: TranscriptConfig, emitter: EventEmitter) {
    this.config = config;
    this.emitter = emitter;
    this.projectsDir = this.expandPath(config.projectsDir);
  }

  /**
   * Start watching for transcript changes
   *
   * Attempts to use fs.watch for event-driven monitoring. Falls back to
   * polling if fs.watch is unavailable (e.g., network drives, some filesystems).
   */
  start(): void {
    if (this.config.useFsWatch) {
      try {
        this.watcher = watch(this.projectsDir, { recursive: true }, (eventType, filename) => {
          if (filename?.endsWith('.jsonl')) {
            this.handleFileChange(filename);
          }
        });
      } catch (error) {
        console.warn('fs.watch failed, falling back to polling:', error);
        this.startPolling();
      }
    } else {
      this.startPolling();
    }
  }

  /**
   * Stop watching for transcript changes
   *
   * Cleans up file watcher and polling timer resources.
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.stopPolling();
  }

  /**
   * Parse a transcript file and return metrics
   *
   * Reads the file line by line, parsing JSONL entries. Skips lines without
   * token usage data and handles malformed JSON gracefully.
   *
   * @param filePath Absolute path to transcript file
   * @returns Array of MetricEntry objects extracted from file
   */
  parseFile(filePath: string): MetricEntry[] {
    const metrics: MetricEntry[] = [];
    try {
      // EC007: Handle missing files gracefully
      if (!existsSync(filePath)) {
        return metrics;
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as TranscriptEntry;
          if (entry.message?.usage) {
            const metric = this.entryToMetric(entry, filePath);
            if (metric) {
              metrics.push(metric);
            }
          }
        } catch (parseError) {
          // EC002: Skip malformed JSON
          console.warn(`Skipping malformed line in ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
    return metrics;
  }

  /**
   * Handle file change event
   *
   * Parses only new lines since last processing to avoid duplicate events.
   * Emits 'transcript_metric' event for each new metric found.
   *
   * @param filename Relative filename from projectsDir
   */
  handleFileChange(filename: string): void {
    const filePath = join(this.projectsDir, filename);

    try {
      // EC007: Handle missing files
      if (!existsSync(filePath)) {
        return;
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      // Get last processed line index for this file
      const lastProcessed = this.processedLines.get(filePath) ?? -1;
      const newLines = lines.slice(lastProcessed + 1);

      // Process only new lines
      for (let i = 0; i < newLines.length; i++) {
        const line = newLines[i];
        try {
          const entry = JSON.parse(line!) as TranscriptEntry;
          if (entry.message?.usage) {
            const metric = this.entryToMetric(entry, filePath);
            if (metric) {
              // Emit event asynchronously
              void this.emitter.emit('transcript_metric', metric);
            }
          }
        } catch (parseError) {
          // EC002: Skip malformed JSON
          console.warn(`Skipping malformed line in ${filePath}`);
        }
      }

      // Update last processed line index
      if (newLines.length > 0) {
        this.processedLines.set(filePath, lastProcessed + newLines.length);
      }
    } catch (error) {
      console.error(`Error handling file change for ${filePath}:`, error);
    }
  }

  /**
   * Start polling fallback
   *
   * Scans directory at regular intervals when fs.watch is unavailable.
   * Implements EC006 edge case handling.
   */
  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      this.scanDirectory();
    }, this.config.fallbackPollIntervalMs);
  }

  /**
   * Stop polling timer
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Scan directory for transcript files
   *
   * Used by polling fallback to detect new or modified files.
   * Handles EC008 (renamed files) by re-scanning directory structure.
   */
  private scanDirectory(): void {
    try {
      if (!existsSync(this.projectsDir)) {
        return;
      }

      const files = this.findTranscriptFiles(this.projectsDir);

      for (const file of files) {
        this.handleFileChange(file);
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
    }
  }

  /**
   * Recursively find all .jsonl files in directory
   *
   * @param dir Directory to search
   * @returns Array of relative file paths
   */
  private findTranscriptFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = this.findTranscriptFiles(fullPath);
          files.push(...subFiles.map(f => join(entry.name, f)));
        } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          files.push(entry.name);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return files;
  }

  /**
   * Convert TranscriptEntry to MetricEntry
   *
   * Extracts token usage and metadata from transcript entry format.
   *
   * @param entry Transcript entry from JSONL file
   * @param filePath Path to source file
   * @returns MetricEntry or null if conversion fails
   */
  private entryToMetric(entry: TranscriptEntry, filePath: string): MetricEntry | null {
    if (!entry.message?.usage) {
      return null;
    }

    const usage = entry.message.usage;
    const tokens: TokenUsage = {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    };

    // Extract session ID from file path (e.g., session-abc123.jsonl)
    const filename = filePath.split(/[/\\]/).pop() ?? 'unknown';
    const sessionMatch = filename.match(/session-(.+)\.jsonl$/);
    const sessionId = sessionMatch?.[1] ?? 'unknown';

    const metric: MetricEntry = {
      id: randomUUID(),
      timestamp: entry.timestamp,
      session_id: sessionId,
      project_path: this.projectsDir,
      source: 'transcript',
      event_type: 'api_response',
      event_category: 'api',
      model: entry.model,
      tokens,
      data: { entry_type: entry.type },
      tags: ['transcript', 'api'],
    };

    return metric;
  }

  /**
   * Expand tilde (~) in file paths
   *
   * @param path Path that may contain ~
   * @returns Absolute path with ~ expanded to home directory
   */
  private expandPath(path: string): string {
    if (path.startsWith('~/') || path === '~') {
      return join(homedir(), path.slice(2));
    }
    return resolve(path);
  }
}
