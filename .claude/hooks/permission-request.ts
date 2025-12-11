/**
 * @fileoverview PermissionRequest Hook Handler
 *
 * Triggered when Claude Code needs a permission decision for a tool use.
 * This hook allows you to programmatically approve, deny, or modify permission
 * requests without user interaction.
 *
 * ## Capabilities
 *
 * - **Allow**: Approve the tool use (optionally with modified input)
 * - **Deny**: Block the tool use with a message
 * - **Pass-through**: Let the default permission handler prompt the user
 * - **Permission Updates**: Apply permission rule changes
 *
 * ## Use Cases
 *
 * 1. **Automated Policies**: Auto-approve safe operations
 * 2. **Security Enforcement**: Block dangerous operations automatically
 * 3. **Audit Logging**: Track all permission requests
 * 4. **Input Modification**: Modify tool input before approval
 * 5. **Custom Permission Logic**: Implement complex approval rules
 *
 * ## Decision Types
 *
 * - `allow`: Approve the tool use
 *   - Can include `updatedInput` to modify the tool input
 *   - Can include `updatedPermissions` to apply permission changes
 * - `deny`: Block the tool use
 *   - Must include `message` explaining the denial
 *   - Can include `interrupt: true` to stop execution entirely
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "PermissionRequest",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "tool_name": "Bash",
 *   "tool_input": {
 *     "command": "npm install lodash"
 *   },
 *   "permission_suggestions": [
 *     {
 *       "type": "addRules",
 *       "rules": [{ "toolName": "Bash", "ruleContent": "npm install *" }],
 *       "behavior": "allow",
 *       "destination": "session"
 *     }
 *   ],
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (allow)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PermissionRequest",
 *     "decision": {
 *       "behavior": "allow"
 *     }
 *   }
 * }
 * ```
 *
 * @example Output JSON (allow with modified input)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PermissionRequest",
 *     "decision": {
 *       "behavior": "allow",
 *       "updatedInput": {
 *         "command": "npm install lodash --save-exact"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @example Output JSON (deny)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PermissionRequest",
 *     "decision": {
 *       "behavior": "deny",
 *       "message": "This operation is not allowed by policy"
 *     }
 *   }
 * }
 * ```
 *
 * @example Output JSON (deny and interrupt)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PermissionRequest",
 *     "decision": {
 *       "behavior": "deny",
 *       "message": "Critical security violation - stopping execution",
 *       "interrupt": true
 *     }
 *   }
 * }
 * ```
 *
 * @example Output JSON (pass-through to default handler)
 * ```json
 * {
 *   "continue": true
 * }
 * ```
 *
 * @module hooks/permission-request
 */

import {
  type PermissionRequestHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "./utils/logger.ts";

// Read and parse the hook input from stdin
const input = await readInput<PermissionRequestHookInput>();

// Log the permission request with structured data
await log("PermissionRequest", input.session_id, {
  cwd: input.cwd,
  tool_name: input.tool_name,
  tool_input: input.tool_input,
  has_suggestions:
    Array.isArray(input.permission_suggestions) &&
    input.permission_suggestions.length > 0,
  suggestion_count: input.permission_suggestions?.length ?? 0,
  transcript_path: input.transcript_path,
  permission_mode: input.permission_mode,
  requested_at: new Date().toISOString(),
});

// Build the output response
// Default: pass-through to default handler (prompts user)
// Uncomment examples below to implement automated permission logic
const output: SyncHookJSONOutput = {
  continue: true,

  // Uncomment to auto-approve:
  // hookSpecificOutput: {
  //   hookEventName: "PermissionRequest",
  //   decision: {
  //     behavior: "allow",
  //   },
  // },

  // Uncomment to auto-deny:
  // hookSpecificOutput: {
  //   hookEventName: "PermissionRequest",
  //   decision: {
  //     behavior: "deny",
  //     message: "Blocked by policy",
  //   },
  // },

  // Uncomment to approve with modified input:
  // hookSpecificOutput: {
  //   hookEventName: "PermissionRequest",
  //   decision: {
  //     behavior: "allow",
  //     updatedInput: {
  //       ...(input.tool_input as Record<string, unknown>),
  //       // Add modifications here
  //     },
  //   },
  // },
};

// Write JSON response to stdout
writeOutput(output);
