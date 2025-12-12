/**
 * @fileoverview Notification Hook Handler
 *
 * Triggered when Claude Code generates a notification. Notifications can be
 * desktop notifications, alerts, status updates, or other user-facing messages.
 *
 * ## Capabilities
 *
 * - **Notification Logging**: Track all notifications for auditing
 * - **Custom Routing**: Forward notifications to external systems
 * - **Filtering**: Suppress or modify notifications
 *
 * ## Use Cases
 *
 * 1. **Audit Logging**: Track all notifications for compliance
 * 2. **External Integration**: Forward to Slack, Teams, email, etc.
 * 3. **Custom Handlers**: Replace default notification behavior
 * 4. **Filtering**: Suppress noisy or unwanted notifications
 * 5. **Analytics**: Track notification patterns and frequency
 *
 * ## Notification Types
 *
 * The `notification_type` field indicates the category of notification:
 * - success: Task completed successfully
 * - error: An error occurred
 * - info: Informational message
 * - warning: Warning message
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "Notification",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "message": "Build completed successfully",
 *   "title": "Claude Code",
 *   "notification_type": "success",
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
 * @module hooks/notification
 */

import {
  type NotificationHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { log, readInput, writeOutput } from "../utils/logger.ts";

async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<NotificationHookInput>();

  // Log the notification with structured data
  await log("Notification", input.session_id, {
    cwd: input.cwd,
    title: input.title,
    message: input.message,
    notification_type: input.notification_type,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    received_at: new Date().toISOString(),
  });

  // Build the output response
  // Notification doesn't support hookSpecificOutput, just continue
  const output: SyncHookJSONOutput = {
    continue: true,
  };

  // Write JSON response to stdout
  writeOutput(output);
}

main();
