/**
 * @fileoverview SubagentStart Hook Handler
 *
 * Triggered when Claude Code spawns a subagent using the Task tool. Subagents
 * are specialized agents that handle specific types of tasks (exploration,
 * planning, code review, etc.).
 *
 * ## Capabilities
 *
 * - **Additional Context**: Inject context specific to the agent type
 * - **Agent Logging**: Track agent hierarchies and spawning patterns
 * - **Resource Monitoring**: Track resource usage by agent type
 *
 * ## Use Cases
 *
 * 1. **Agent Analytics**: Track which agent types are spawned most often
 * 2. **Context Injection**: Add type-specific context for agents
 * 3. **Hierarchy Tracking**: Monitor parent-child agent relationships
 * 4. **Resource Monitoring**: Track subagent resource usage
 * 5. **Debugging**: Understand agent spawning patterns
 *
 * ## Agent Types
 *
 * Common agent types include:
 * - `Explore`: Fast codebase exploration
 * - `Plan`: Implementation planning
 * - `general-purpose`: General multi-step tasks
 * - Custom agent types defined in configuration
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "SubagentStart",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "agent_id": "agent-xyz789",
 *   "agent_type": "Explore",
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (with agent-specific context)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "SubagentStart",
 *     "additionalContext": "Agent 'Explore' started. Focus on finding relevant files efficiently."
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
 * @module hooks/subagent-start
 */

import {
  type SubagentStartHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<SubagentStartHookInput>();

  // Log the subagent start with structured data
  await log("SubagentStart", input.session_id, {
    cwd: input.cwd,
    agent_id: input.agent_id,
    agent_type: input.agent_type,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    started_at: new Date().toISOString(),
  });

  // Build the output response
  // Optionally inject context specific to the agent type
  const output: SyncHookJSONOutput = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "SubagentStart",
      additionalContext: `Subagent '${input.agent_type}' (${input.agent_id}) spawned`,
    },
  };

  // Write JSON response to stdout
  writeOutput(output);
}

main();
