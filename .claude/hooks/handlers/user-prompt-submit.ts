/**
 * @fileoverview UserPromptSubmit Hook Handler
 *
 * Triggered every time a user submits a prompt to Claude Code. This hook runs
 * before the prompt is processed by the model, allowing you to:
 *
 * - Log user prompts for auditing, debugging, or analytics
 * - Inject additional context into the conversation
 * - Add time-sensitive or environment-specific information
 * - Track prompt patterns and usage
 *
 * ## Use Cases
 *
 * 1. **Audit Logging**: Track all user prompts for compliance or debugging
 * 2. **Context Injection**: Add project-specific context (git branch, env vars)
 * 3. **Analytics**: Measure prompt length, frequency, and patterns
 * 4. **Time-Sensitive Context**: Include current timestamps or deadlines
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "UserPromptSubmit",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "prompt": "Fix the authentication bug in auth.ts",
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (with additional context)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "UserPromptSubmit",
 *     "additionalContext": "Current time: 2024-12-11T14:30:00Z. Git branch: feature/auth-fix"
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
 * @module hooks/user-prompt-submit
 */

import {
  type UserPromptSubmitHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput, maybeWriteHeartbeat } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<UserPromptSubmitHookInput>();

  // Log the prompt submission with structured data
  await log("UserPromptSubmit", input.session_id, {
    cwd: input.cwd,
    prompt: input.prompt,
    prompt_length: input.prompt.length,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
  });

  // Write heartbeat event (user activity)
  await maybeWriteHeartbeat(input.session_id, false, true);

  // Build the output response
  // Uncomment hookSpecificOutput to inject additional context into the conversation
  const output: SyncHookJSONOutput = {
    continue: true,
    // hookSpecificOutput: {
    //   hookEventName: "UserPromptSubmit",
    //   additionalContext: `Prompt received at ${new Date().toISOString()}`,
    // },
  };

  // Write JSON response to stdout
  writeOutput(output);
}

await main();
