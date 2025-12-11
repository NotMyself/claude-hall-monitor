/**
 * @fileoverview Shared logging utility for Claude Code hooks.
 *
 * This module provides a centralized, structured logging mechanism that appends
 * timestamped JSONL (JSON Lines) entries to a unified log file. All hook handlers
 * use this utility to ensure consistent, machine-readable log output.
 *
 * @module utils/logger
 *
 * ## Log Format (JSONL)
 *
 * Each log entry is a single JSON object on its own line:
 * ```jsonl
 * {"timestamp":"2024-12-11T14:30:00.000Z","event":"PreToolUse","session_id":"abc123","data":{...}}
 * {"timestamp":"2024-12-11T14:30:01.000Z","event":"PostToolUse","session_id":"abc123","data":{...}}
 * ```
 *
 * ## Schema
 *
 * ```typescript
 * interface LogEntry {
 *   timestamp: string;      // ISO 8601 format
 *   event: string;          // Hook event name
 *   session_id: string;     // Session identifier for correlation
 *   data: Record<string, unknown>; // Event-specific payload
 * }
 * ```
 *
 * @example Basic usage in a hook
 * ```typescript
 * import { log, readInput, writeOutput } from './utils/logger.ts';
 * import { type PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
 *
 * const input = await readInput<PreToolUseHookInput>();
 * await log('PreToolUse', input.session_id, {
 *   tool_name: input.tool_name,
 *   tool_input: input.tool_input,
 * });
 * writeOutput({ continue: true });
 * ```
 */

import { existsSync } from "node:fs";
import { mkdir, appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Directory containing this module (utils/).
 * Used to resolve paths relative to the hooks directory.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Path to the unified hooks log file.
 * Located at `.claude/hooks/hooks-log.txt` relative to the hooks directory.
 * @deprecated Use getLogFilePath(session_id) for per-session logs instead.
 */
export const LOG_FILE_PATH = join(__dirname, "..", "hooks-log.txt");

/**
 * Directory containing per-session log files.
 * Located at `.claude/hooks/logs/` relative to the hooks directory.
 */
export const LOGS_DIR = join(__dirname, "..", "logs");

/**
 * Returns the path to the log file for a specific session.
 *
 * @param session_id - Unique session identifier
 * @returns Path to the session-specific log file (e.g., `.claude/hooks/logs/abc123.txt`)
 *
 * @example Get log file path for a session
 * ```typescript
 * const logPath = getLogFilePath('session-abc123');
 * // Returns: C:\Users\...\claude\claude-bun-win11-hooks\.claude\hooks\logs\session-abc123.txt
 * ```
 */
export function getLogFilePath(session_id: string): string {
  return join(LOGS_DIR, `${session_id}.txt`);
}

/**
 * Ensures the logs directory exists, creating it if necessary.
 *
 * @returns Promise that resolves when the directory is confirmed to exist
 */
async function ensureLogsDir(): Promise<void> {
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
}

/**
 * Structured log entry format for JSONL output.
 *
 * @property timestamp - ISO 8601 formatted timestamp (e.g., "2024-12-11T14:30:00.000Z")
 * @property event - Hook event name (e.g., "PreToolUse", "SessionStart", "UserPromptSubmit")
 * @property session_id - Unique session identifier for correlating related log entries
 * @property data - Event-specific payload containing relevant details
 */
export interface LogEntry {
  timestamp: string;
  event: string;
  session_id: string;
  data: Record<string, unknown>;
}

/**
 * Appends a structured log entry to the unified hooks log file.
 *
 * Each entry is written as a single JSON object on its own line (JSONL format),
 * making the log file easy to parse, grep, and stream process.
 *
 * @param event - The hook event type (e.g., "PreToolUse", "SessionStart")
 * @param session_id - Unique session identifier from the hook input
 * @param data - Event-specific payload to log
 * @returns Promise that resolves when the log entry is written
 *
 * @example Log a tool use event
 * ```typescript
 * await log('PreToolUse', 'session-abc123', {
 *   tool_name: 'Bash',
 *   tool_input: { command: 'npm install' },
 *   tool_use_id: 'tool-xyz789',
 * });
 * ```
 *
 * @example Log a session start event
 * ```typescript
 * await log('SessionStart', 'session-abc123', {
 *   source: 'startup',
 *   cwd: 'C:\\Users\\project',
 * });
 * ```
 */
export async function log(
  event: string,
  session_id: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureLogsDir();
  const filePath = getLogFilePath(session_id);
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    event,
    session_id,
    data,
  };

  const line = JSON.stringify(entry) + "\n";

  await appendFile(filePath, line, "utf-8");
}

/**
 * Reads and parses JSON input from stdin.
 *
 * All Claude Code hooks receive their input as a JSON object via stdin.
 * This function reads stdin as text and parses it as JSON, which is more
 * reliable on Windows than using Bun.stdin.json() directly.
 *
 * @typeParam T - The expected input type from the SDK (e.g., PreToolUseHookInput)
 * @returns Promise resolving to the parsed input object
 *
 * @example Read PreToolUse input
 * ```typescript
 * import { type PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
 *
 * const input = await readInput<PreToolUseHookInput>();
 * console.log(input.tool_name);  // e.g., "Bash"
 * console.log(input.tool_input); // e.g., { command: "npm install" }
 * ```
 */
export async function readInput<T>(): Promise<T> {
  const text = await Bun.stdin.text();
  return JSON.parse(text) as T;
}

/**
 * Writes JSON output to stdout for Claude Code to consume.
 *
 * Hooks that need to return data to Claude Code (like PreToolUse for permission
 * decisions or UserPromptSubmit for additional context) must write valid JSON
 * to stdout. This function handles serialization and ensures proper formatting.
 *
 * @param output - The output object to serialize and write (typically SyncHookJSONOutput)
 *
 * @example Allow a tool use
 * ```typescript
 * writeOutput({
 *   continue: true,
 *   hookSpecificOutput: {
 *     hookEventName: 'PreToolUse',
 *     permissionDecision: 'allow',
 *   }
 * });
 * ```
 *
 * @example Add context to a prompt
 * ```typescript
 * writeOutput({
 *   continue: true,
 *   hookSpecificOutput: {
 *     hookEventName: 'UserPromptSubmit',
 *     additionalContext: 'Current git branch: main',
 *   }
 * });
 * ```
 *
 * @example Simple pass-through (no modification)
 * ```typescript
 * writeOutput({ continue: true });
 * ```
 */
export function writeOutput(output: unknown): void {
  console.log(JSON.stringify(output));
}
