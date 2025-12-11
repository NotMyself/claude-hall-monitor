/**
 * @fileoverview SessionStart Hook Handler
 *
 * Triggered when a Claude Code session starts. This includes:
 * - Fresh startup of Claude Code
 * - Resuming a previous session
 * - Clearing conversation history (/clear command)
 * - Context compaction (manual or automatic)
 *
 * ## Capabilities
 *
 * - **Additional Context**: Inject project-specific context at session start
 * - **Session Logging**: Track session lifecycle for analytics
 * - **Environment Setup**: Log environment state at startup
 *
 * ## Use Cases
 *
 * 1. **Session Analytics**: Track session frequency, duration patterns
 * 2. **Context Injection**: Add project context (git branch, environment)
 * 3. **Welcome Messages**: Provide session-specific guidance
 * 4. **State Initialization**: Set up session-specific state
 * 5. **Environment Logging**: Capture environment at session start
 *
 * ## Source Types
 *
 * - `startup`: Fresh Claude Code launch
 * - `resume`: Resuming a previous session
 * - `clear`: User executed /clear command
 * - `compact`: Context was compacted (manual or auto)
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "SessionStart",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "source": "startup",
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (with welcome context)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "SessionStart",
 *     "additionalContext": "Welcome! Project: my-app. Git branch: main. Node version: 20.10.0"
 *   }
 * }
 * ```
 *
 * @example Output JSON (pass-through, no modification)
 * ```json
 * {
 *   "continue": true
 * }
 * ```
 *
 * @module hooks/session-start
 */

import {
  type SessionStartHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "./utils/logger.ts";

// Read and parse the hook input from stdin
const input = await readInput<SessionStartHookInput>();

// Log the session start with structured data
await log("SessionStart", input.session_id, {
  cwd: input.cwd,
  source: input.source,
  transcript_path: input.transcript_path,
  permission_mode: input.permission_mode,
  started_at: new Date().toISOString(),
});

// Build the output response
// Optionally inject context at session start
const output: SyncHookJSONOutput = {
  continue: true,
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: `Session started (${input.source}) at ${new Date().toISOString()}`,
  },
};

// Write JSON response to stdout
writeOutput(output);
