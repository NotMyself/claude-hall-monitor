/**
 * @fileoverview PostToolUse Hook Handler
 *
 * Triggered after a tool has executed successfully. This hook receives both
 * the original tool input and the tool's response, allowing you to:
 *
 * - Log successful tool executions for auditing
 * - Add contextual information based on tool results
 * - Transform MCP tool outputs before they reach the model
 * - Track tool execution patterns and performance
 *
 * ## Capabilities
 *
 * - **Additional Context**: Inject context based on tool results
 * - **MCP Output Modification**: Transform outputs from MCP tools
 * - **Audit Logging**: Record all successful tool executions
 *
 * ## Use Cases
 *
 * 1. **Audit Logging**: Track successful tool executions with results
 * 2. **Result Annotation**: Add metadata to tool results
 * 3. **MCP Transformation**: Modify MCP tool outputs before model sees them
 * 4. **Performance Tracking**: Measure tool execution success rates
 * 5. **Contextual Hints**: Add helpful context based on results
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "PostToolUse",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "tool_name": "Read",
 *   "tool_input": {
 *     "file_path": "C:\\Users\\user\\project\\src\\app.ts"
 *   },
 *   "tool_response": "import express from 'express';\n\nconst app = express();\n...",
 *   "tool_use_id": "tool-xyz789",
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (with additional context)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PostToolUse",
 *     "additionalContext": "Note: This file was last modified 2 hours ago"
 *   }
 * }
 * ```
 *
 * @example Output JSON (modifying MCP tool output)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "PostToolUse",
 *     "updatedMCPToolOutput": {
 *       "transformed": true,
 *       "data": "processed result..."
 *     }
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
 * @module hooks/post-tool-use
 */

import {
  type PostToolUseHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

/**
 * Truncates a string to a maximum length for logging.
 * Helps keep log entries reasonably sized for large tool responses.
 *
 * @param value - The value to truncate
 * @param maxLength - Maximum length before truncation (default: 500)
 * @returns Truncated string with indicator if truncated
 */
function truncateForLog(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") {
    const stringified = JSON.stringify(value);
    if (stringified.length > maxLength) {
      return stringified.substring(0, maxLength) + "... [truncated]";
    }
    return stringified;
  }

  if (value.length > maxLength) {
    return value.substring(0, maxLength) + "... [truncated]";
  }
  return value;
}

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<PostToolUseHookInput>();

  // Log the successful tool execution with structured data
  await log("PostToolUse", input.session_id, {
    cwd: input.cwd,
    tool_name: input.tool_name,
    tool_input: input.tool_input,
    tool_use_id: input.tool_use_id,
    response_preview: truncateForLog(input.tool_response),
    response_type: typeof input.tool_response,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
  });

  // Build the output response
  // Default: pass-through with no modifications
  const output: SyncHookJSONOutput = {
    continue: true,
    // Uncomment to add context based on results:
    // hookSpecificOutput: {
    //   hookEventName: "PostToolUse",
    //   additionalContext: "Tool executed successfully",
    // },

    // Uncomment to modify MCP tool output:
    // hookSpecificOutput: {
    //   hookEventName: "PostToolUse",
    //   updatedMCPToolOutput: transformedOutput,
    // },
  };

  // Write JSON response to stdout
  writeOutput(output);
}

main();
