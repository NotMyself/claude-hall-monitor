/**
 * @fileoverview PreToolUse Hook Handler
 *
 * Triggered before Claude executes any tool. This is the primary hook for
 * implementing custom permission logic, input validation, or tool blocking.
 * It runs after Claude decides to use a tool but before the tool executes.
 *
 * ## Capabilities
 *
 * - **Allow**: Let the tool execute as requested
 * - **Deny**: Block the tool execution with a reason
 * - **Ask**: Prompt the user for permission (default behavior)
 * - **Modify**: Change the tool input before execution
 *
 * ## Use Cases
 *
 * 1. **Security Policies**: Block dangerous commands (rm -rf, format, etc.)
 * 2. **Input Validation**: Ensure tool inputs meet requirements
 * 3. **Audit Logging**: Track all tool usage attempts
 * 4. **Input Modification**: Add flags, change paths, sanitize inputs
 * 5. **Rate Limiting**: Control how often certain tools can be used
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "PreToolUse",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "tool_name": "Bash",
 *   "tool_input": {
 *     "command": "npm install lodash",
 *     "description": "Install lodash package"
 *   },
 *   "tool_use_id": "tool-xyz789",
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (allow tool execution)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PreToolUse",
 *     "permissionDecision": "allow"
 *   }
 * }
 * ```
 *
 * @example Output JSON (deny with reason)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PreToolUse",
 *     "permissionDecision": "deny",
 *     "permissionDecisionReason": "Operation blocked: rm -rf is not allowed by policy"
 *   }
 * }
 * ```
 *
 * @example Output JSON (allow with modified input)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PreToolUse",
 *     "permissionDecision": "allow",
 *     "updatedInput": {
 *       "command": "npm install lodash --save-exact",
 *       "description": "Install lodash package with exact version"
 *     }
 *   }
 * }
 * ```
 *
 * @example Output JSON (prompt user for permission)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PreToolUse",
 *     "permissionDecision": "ask"
 *   }
 * }
 * ```
 *
 * @module hooks/pre-tool-use
 */

import {
  type PreToolUseHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput, maybeWriteHeartbeat } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<PreToolUseHookInput>();

  // Log the tool use attempt with structured data
  await log("PreToolUse", input.session_id, {
    cwd: input.cwd,
    tool_name: input.tool_name,
    tool_input: input.tool_input,
    tool_use_id: input.tool_use_id,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
  });

  // Write heartbeat event (tool activity)
  await maybeWriteHeartbeat(input.session_id, true, false);

  // Build the output response
  // Default: allow all tools (modify this logic to implement custom policies)
  const output: SyncHookJSONOutput = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      // Uncomment to deny:
      // permissionDecision: "deny",
      // permissionDecisionReason: "Operation not allowed by policy",

      // Uncomment to modify input:
      // updatedInput: {
      //   ...input.tool_input as Record<string, unknown>,
      //   // Add or modify fields here
      // },
    },
  };

  // Write JSON response to stdout
  writeOutput(output);
}

await main();
