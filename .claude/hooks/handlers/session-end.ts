/**
 * @fileoverview SessionEnd Hook Handler
 *
 * Triggered when a Claude Code session ends. This hook provides the exit reason,
 * allowing you to track how sessions terminate and perform cleanup.
 *
 * ## Capabilities
 *
 * - **Session Logging**: Track session termination for analytics
 * - **Cleanup**: Perform cleanup tasks when sessions end
 * - **Analytics**: Measure session duration and exit patterns
 *
 * ## Use Cases
 *
 * 1. **Session Analytics**: Track session duration, exit reasons
 * 2. **Cleanup**: Clean up temporary files or state
 * 3. **Logging**: Final session summary and statistics
 * 4. **Exit Pattern Analysis**: Identify common exit reasons
 * 5. **Resource Management**: Release resources on session end
 *
 * ## Exit Reasons
 *
 * The `reason` field indicates why the session ended. Common values include:
 * - User-initiated exit (Ctrl+C, /exit, closing terminal)
 * - Completion of task
 * - Error conditions
 * - Timeout
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "SessionEnd",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "reason": "user_exit",
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
 * @module hooks/session-end
 */

import {
  type SessionEndHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

/**
 * Viewer server configuration
 */
const VIEWER_PORT = 3456;
const VIEWER_URL = `http://localhost:${VIEWER_PORT}`;

/**
 * Gracefully shut down the viewer server
 */
async function shutdownViewer(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    await fetch(`${VIEWER_URL}/shutdown`, {
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.error("\n🛑 Hook Viewer shut down\n");
  } catch {
    // Viewer not running or already stopped - ignore
  }
}

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<SessionEndHookInput>();

  // Log the session end with structured data
  await log("SessionEnd", input.session_id, {
    cwd: input.cwd,
    reason: input.reason,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    ended_at: new Date().toISOString(),
  });

  // Only shut down viewer on actual exit, not clear/compact
  // Clear and compact trigger SessionEnd then SessionStart - viewer should persist
  const shouldShutdown = input.reason !== "clear" && input.reason !== "compact";
  if (shouldShutdown) {
    await shutdownViewer();
  }

  // Build the output response
  // SessionEnd doesn't support hookSpecificOutput, just continue
  const output: SyncHookJSONOutput = {
    continue: true,
  };

  // Write JSON response to stdout
  writeOutput(output);
}

await main();
