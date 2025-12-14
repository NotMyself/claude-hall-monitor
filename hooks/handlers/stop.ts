/**
 * @fileoverview Stop Hook Handler
 *
 * Triggered when Claude Code execution is stopped or interrupted by the user.
 * This typically occurs when the user presses Escape or Ctrl+C during execution.
 *
 * ## Capabilities
 *
 * - **Stop Logging**: Track when and why execution was stopped
 * - **State Preservation**: Save state before stopping
 * - **Graceful Shutdown**: Handle cleanup on stop
 *
 * ## Use Cases
 *
 * 1. **Interrupt Logging**: Track user-initiated stops
 * 2. **State Preservation**: Save work-in-progress before stopping
 * 3. **Analytics**: Measure how often users interrupt execution
 * 4. **Graceful Cleanup**: Clean up resources on stop
 * 5. **Debugging**: Understand why users stop execution
 *
 * ## Fields
 *
 * - `stop_hook_active`: Indicates if this hook is currently processing a stop
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "Stop",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "stop_hook_active": true,
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON
 * ```json
 * {
 *   "continue": true
 * }
 * ```
 *
 * @module hooks/stop
 */

import {
  type StopHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<StopHookInput>();

  // Log the stop event with structured data
  await log("Stop", input.session_id, {
    cwd: input.cwd,
    stop_hook_active: input.stop_hook_active,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    stopped_at: new Date().toISOString(),
  });

  // Build the output response
  // Stop doesn't support hookSpecificOutput, just continue
  const output: SyncHookJSONOutput = {
    continue: true,
  };

  // Write JSON response to stdout
  writeOutput(output);
}

try {
  await main();
} catch (error) {
  console.error("Handler error:", error);
  // Always output valid JSON
  writeOutput({ continue: true });
  process.exit(1);
}
