import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HANDLERS_DIR = join(__dirname, "..");

async function runHandler(handlerFile: string, input: unknown): Promise<string> {
  const handlerPath = join(HANDLERS_DIR, handlerFile);
  const inputJson = JSON.stringify(input);

  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["run", handlerPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Handler exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });

    proc.on("error", reject);

    // Write input to stdin and close it
    proc.stdin.write(inputJson);
    proc.stdin.end();
  });
}

function createMockInput(hookEventName: string): Record<string, unknown> {
  return {
    hook_event_name: hookEventName,
    session_id: "test-session-123",
    transcript_path: "/mock/path/transcript.json",
    cwd: "/mock/project",
  };
}

describe("Handler Execution", () => {
  const handlers = [
    { file: "notification.ts", event: "Notification" },
    { file: "permission-request.ts", event: "PermissionRequest" },
    { file: "post-tool-use-failure.ts", event: "PostToolUseFailure" },
    { file: "post-tool-use.ts", event: "PostToolUse" },
    { file: "pre-compact.ts", event: "PreCompact" },
    { file: "pre-tool-use.ts", event: "PreToolUse" },
    { file: "session-end.ts", event: "SessionEnd" },
    { file: "session-start.ts", event: "SessionStart" },
    { file: "stop.ts", event: "Stop" },
    { file: "subagent-start.ts", event: "SubagentStart" },
    { file: "subagent-stop.ts", event: "SubagentStop" },
    { file: "user-prompt-submit.ts", event: "UserPromptSubmit" },
  ];

  describe("Valid Input", () => {
    for (const { file, event } of handlers) {
      it(`${event} outputs valid JSON`, async () => {
        const input = {
          ...createMockInput(event),
          // Add event-specific fields as needed
          ...(event === "PreToolUse" && {
            tool_name: "Bash",
            tool_input: { command: "echo test" },
            tool_use_id: "tool-123",
          }),
          ...(event === "PostToolUse" && {
            tool_name: "Bash",
            tool_response: "test output",
            tool_use_id: "tool-123",
            tool_input: { command: "echo test" },
          }),
          ...(event === "UserPromptSubmit" && { prompt: "test prompt" }),
          ...(event === "Notification" && { message: "test", level: "info" }),
          ...(event === "PermissionRequest" && {
            tool_name: "Bash",
            tool_input: { command: "echo" },
          }),
        };

        const output = await runHandler(file, input);

        let parsed: unknown;
        expect(() => { parsed = JSON.parse(output); }).not.toThrow();
        expect(parsed).toHaveProperty("continue");
      }, 10000);
    }
  });

  describe("Invalid Input", () => {
    it("pre-tool-use handles malformed JSON gracefully", async () => {
      const handlerPath = join(HANDLERS_DIR, "pre-tool-use.ts");

      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn("bun", ["run", handlerPath], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        proc.on("close", () => {
          // Always resolve with stdout, even on error exit codes
          // The test verifies that valid JSON is output
          resolve(stdout.trim());
        });

        proc.on("error", reject);

        // Write invalid JSON to stdin and close it
        proc.stdin.write("not valid json");
        proc.stdin.end();
      });

      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.continue).toBe(true);
    }, 10000);
  });
});
