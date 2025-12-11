/**
 * @fileoverview PostToolUseFailure Hook Handler
 *
 * Triggered when a tool execution fails or is interrupted. This hook receives
 * the tool input, error message, and whether the failure was due to an interrupt.
 *
 * ## Capabilities
 *
 * - **Additional Context**: Provide troubleshooting hints based on error
 * - **Error Logging**: Track failures for debugging and analysis
 * - **Recovery Suggestions**: Help the model recover from common errors
 *
 * ## Use Cases
 *
 * 1. **Error Logging**: Track tool failures with full context
 * 2. **Troubleshooting**: Inject helpful context based on error patterns
 * 3. **Pattern Analysis**: Identify recurring failure modes
 * 4. **Recovery Hints**: Suggest alternative approaches after failures
 * 5. **Interrupt Handling**: Track user-initiated interrupts vs errors
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "PostToolUseFailure",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "tool_name": "Bash",
 *   "tool_input": {
 *     "command": "npm run build"
 *   },
 *   "tool_use_id": "tool-xyz789",
 *   "error": "Command failed with exit code 1: npm ERR! Missing script: \"build\"",
 *   "is_interrupt": false,
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (with troubleshooting context)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PostToolUseFailure",
 *     "additionalContext": "Common fix: Check package.json for available scripts using 'npm run'"
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
 * @module hooks/post-tool-use-failure
 */

import {
  type PostToolUseFailureHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "./utils/logger.ts";

// Read and parse the hook input from stdin
const input = await readInput<PostToolUseFailureHookInput>();

// Log the tool failure with structured data
await log("PostToolUseFailure", input.session_id, {
  cwd: input.cwd,
  tool_name: input.tool_name,
  tool_input: input.tool_input,
  tool_use_id: input.tool_use_id,
  error: input.error,
  is_interrupt: input.is_interrupt ?? false,
  transcript_path: input.transcript_path,
  permission_mode: input.permission_mode,
});

// Build the output response
// Optionally provide context to help with recovery
const output: SyncHookJSONOutput = {
  continue: true,
  hookSpecificOutput: {
    hookEventName: "PostToolUseFailure",
    additionalContext: input.is_interrupt
      ? "Tool execution was interrupted by user"
      : `Tool '${input.tool_name}' failed. Error logged for analysis.`,
  },
};

// Write JSON response to stdout
writeOutput(output);
