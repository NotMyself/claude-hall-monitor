/**
 * @fileoverview SubagentStop Hook Handler
 *
 * Triggered when a subagent (Task tool) completes execution. This hook receives
 * information about the completed agent including its transcript path.
 *
 * ## Capabilities
 *
 * - **Completion Logging**: Track when agents complete
 * - **Result Analysis**: Access agent transcript for analysis
 * - **Performance Tracking**: Measure agent execution time
 *
 * ## Use Cases
 *
 * 1. **Completion Logging**: Track agent completion for analytics
 * 2. **Performance Analysis**: Measure agent execution time
 * 3. **Transcript Analysis**: Analyze agent transcripts for patterns
 * 4. **Resource Cleanup**: Release resources after agent completion
 * 5. **Result Aggregation**: Collect results from multiple agents
 *
 * ## Fields
 *
 * - `agent_id`: Unique identifier for the completed agent
 * - `agent_transcript_path`: Path to the agent's transcript file
 * - `stop_hook_active`: Whether a stop hook is currently active
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "SubagentStop",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "stop_hook_active": false,
 *   "agent_id": "agent-xyz789",
 *   "agent_transcript_path": "C:\\Users\\user\\.claude\\sessions\\agent-xyz789.json",
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
 * @module hooks/subagent-stop
 */

import {
  type SubagentStopHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<SubagentStopHookInput>();

  // Log the subagent stop with structured data
  await log("SubagentStop", input.session_id, {
    cwd: input.cwd,
    agent_id: input.agent_id,
    agent_transcript_path: input.agent_transcript_path,
    stop_hook_active: input.stop_hook_active,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    stopped_at: new Date().toISOString(),
  });

  // Build the output response
  // SubagentStop doesn't support hookSpecificOutput, just continue
  const output: SyncHookJSONOutput = {
    continue: true,
  };

  // Write JSON response to stdout
  writeOutput(output);
}

await main();
