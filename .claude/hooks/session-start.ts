/**
 * @fileoverview SessionStart Hook Handler
 *
 * Triggered when a Claude Code session starts. This includes:
 * - Fresh startup of Claude Code
 * - Resuming a previous session
 * - Clearing conversation history (/clear command)
 * - Context compaction (manual or automatic)
 *
 * ## Capabilities
 *
 * - **Additional Context**: Inject project-specific context at session start
 * - **Session Logging**: Track session lifecycle for analytics
 * - **Environment Setup**: Log environment state at startup
 *
 * ## Use Cases
 *
 * 1. **Session Analytics**: Track session frequency, duration patterns
 * 2. **Context Injection**: Add project context (git branch, environment)
 * 3. **Welcome Messages**: Provide session-specific guidance
 * 4. **State Initialization**: Set up session-specific state
 * 5. **Environment Logging**: Capture environment at session start
 *
 * ## Source Types
 *
 * - `startup`: Fresh Claude Code launch
 * - `resume`: Resuming a previous session
 * - `clear`: User executed /clear command
 * - `compact`: Context was compacted (manual or auto)
 *
 * @example Input JSON
 * ```json
 * {
 *   "hook_event_name": "SessionStart",
 *   "session_id": "session-abc123",
 *   "transcript_path": "C:\\Users\\user\\.claude\\sessions\\session-abc123.json",
 *   "cwd": "C:\\Users\\user\\project",
 *   "source": "startup",
 *   "permission_mode": "default"
 * }
 * ```
 *
 * @example Output JSON (with welcome context)
 * ```json
 * {
 *   "continue": true,
 *   "hookSpecificOutput": {
 *     "hookEventName": "SessionStart",
 *     "additionalContext": "Welcome! Project: my-app. Git branch: main. Node version: 20.10.0"
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
 * @module hooks/session-start
 */

import {
  type SessionStartHookInput,
  type SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { spawn } from "bun";
import { mkdir } from "fs/promises";
import { join } from "path";
import { log, readInput, writeOutput } from "./utils/logger.ts";
import { CURRENT_SESSION_ENV } from "./viewer/config";

/**
 * Convert Windows path to Docker-compatible path format.
 * Transforms drive letters and backslashes for Docker volume mounts.
 *
 * @example
 * toDockerPath("C:\\Users\\foo\\project") // "/C/Users/foo/project"
 * toDockerPath("D:\\work\\repo") // "/D/work/repo"
 *
 * @param windowsPath - Windows-style path with backslashes
 * @returns Docker-compatible path with forward slashes
 */
function toDockerPath(windowsPath: string): string {
  return windowsPath
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):/, "/$1");
}

/**
 * Configure Playwright MCP to save screenshots to the current project's
 * screenshots directory. Creates the directory if it doesn't exist.
 *
 * This runs the Docker MCP CLI to set the outputDir configuration.
 * Fails silently since screenshot location is non-critical.
 *
 * @param cwd - Current working directory (Windows path)
 */
async function configurePlaywrightScreenshots(cwd: string): Promise<void> {
  const screenshotsDir = join(cwd, "screenshots");
  const dockerPath = toDockerPath(screenshotsDir);

  try {
    // Create screenshots directory if it doesn't exist
    await mkdir(screenshotsDir, { recursive: true });

    // Configure Playwright MCP via Docker CLI
    const proc = spawn([
      "docker", "mcp", "config", "set",
      "playwright", "outputDir", dockerPath
    ], {
      stdout: "ignore",
      stderr: "ignore",
    });

    await proc.exited;
  } catch {
    // Fail silently - screenshot location is non-critical
    console.error("Failed to configure Playwright screenshots directory");
  }
}

/**
 * Viewer server configuration
 */
const VIEWER_PORT = 3456;
const VIEWER_URL = `http://localhost:${VIEWER_PORT}`;

/**
 * Check if the viewer server is already running
 */
async function isViewerRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(VIEWER_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start the viewer server as a detached background process
 */
function startViewerServer(session_id: string): void {
  const viewerPath = join(import.meta.dir, "viewer", "server.ts");

  try {
    // Spawn detached process that survives parent exit
    const proc = spawn(["bun", "run", viewerPath], {
      env: {
        ...process.env,
        [CURRENT_SESSION_ENV]: session_id,
      },
      stdout: "ignore",
      stderr: "ignore",
      stdin: "ignore",
    });

    // Unref to allow parent to exit
    proc.unref();

    console.error(`\n🔍 Hook Viewer starting at ${VIEWER_URL}\n`);
  } catch (error) {
    console.error("Failed to start viewer:", error);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<SessionStartHookInput>();

  // Log the session start with structured data
  await log("SessionStart", input.session_id, {
    cwd: input.cwd,
    source: input.source,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    started_at: new Date().toISOString(),
  });

  // === Start viewer on fresh startup ===
  if (input.source === "startup") {
    const viewerRunning = await isViewerRunning();

    if (!viewerRunning) {
      startViewerServer(input.session_id);
    } else {
      console.error(`\n🔍 Hook Viewer: ${VIEWER_URL}\n`);
    }
  }

  // Build the output response
  const additionalContext = input.source === "startup"
    ? `Session started. Hook Viewer available at ${VIEWER_URL}`
    : `Session ${input.source} at ${new Date().toISOString()}`;

  const output: SyncHookJSONOutput = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
    },
  };

  // Write JSON response to stdout
  writeOutput(output);
}

// Run the main function
main();
