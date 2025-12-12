/**
 * @fileoverview PreCompact Hook Handler
 *
 * Triggered before Claude Code compacts the conversation context. Compaction
 * occurs when the context window fills up (auto) or when explicitly triggered
 * by the user (manual via /compact command).
 *
 * ## Capabilities
 *
 * - **Compaction Logging**: Track when and why compaction occurs
 * - **State Preservation**: Save important state before compaction
 * - **Custom Instructions**: Log custom compaction instructions
 *
 * ## Use Cases
 *
 * 1. **Context Analytics**: Track context usage patterns
 * 2. **State Preservation**: Save important information before compaction
 * 3. **Logging**: Record compaction events for debugging
 * 4. **Custom Instructions Tracking**: Monitor what instructions are preserved
 * 5. **Performance Analysis**: Understand context window utilization
 *
 * ## Trigger Types
 *
 * - `manual`: User explicitly triggered compaction (/compact command)
 * - `auto`: Context window filled, automatic compaction triggered
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "PreCompact",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "trigger": "auto",
 *   "custom_instructions": "Preserve context about the authentication system",
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
 * @module hooks/pre-compact
 */

import {
  type PreCompactHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<PreCompactHookInput>();

  // Log the pre-compaction event with structured data
  await log("PreCompact", input.session_id, {
    cwd: input.cwd,
    trigger: input.trigger,
    has_custom_instructions: input.custom_instructions !== null,
    custom_instructions: input.custom_instructions,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    compacting_at: new Date().toISOString(),
  });

  // Build the output response
  // PreCompact doesn't support hookSpecificOutput, just continue
  const output: SyncHookJSONOutput = {
    continue: true,
  };

  // Write JSON response to stdout
  writeOutput(output);
}

main();
