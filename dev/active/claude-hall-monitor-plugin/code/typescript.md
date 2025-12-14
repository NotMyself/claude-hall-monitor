# TypeScript Patterns

## Types

### Plugin Manifest Types

```typescript
// .claude-plugin/plugin.json schema
interface PluginManifest {
  name: string;           // Plugin identifier (e.g., "claude-hall-monitor")
  version: string;        // Semantic version (e.g., "1.0.0")
  description: string;    // Human-readable description
  author?: string;        // Plugin author
  repository?: string;    // GitHub URL
  runtime: "bun" | "node"; // Required runtime
}
```

### Hook Configuration Types

```typescript
// .claude-plugin/hooks.json schema
interface HooksConfig {
  hooks: HookDefinition[];
}

interface HookDefinition {
  matcher: HookMatcher;
  hooks: HookEntry[];
}

interface HookMatcher {
  type: "always" | "tool" | "mcp";
  tool_name?: string;
}

interface HookEntry {
  type: HookType;
  command: string;  // Uses ${CLAUDE_PLUGIN_ROOT} variable
}

type HookType =
  | "UserPromptSubmit"
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "Notification"
  | "SessionStart"
  | "SessionEnd"
  | "Stop"
  | "SubagentStart"
  | "SubagentStop"
  | "PreCompact"
  | "PermissionRequest";
```

## Functions

### Build Script Core

```typescript
import { join } from "node:path";

// Build configuration
interface BuildConfig {
  entrypoints: string[];
  outdir: string;
  target: "bun" | "node";
  minify: boolean;
}

// Normalize paths for cross-platform compatibility
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

// Get all handler entrypoints
function getHandlerEntrypoints(handlersDir: string): string[] {
  const handlers = [
    "session-start.ts",
    "session-end.ts",
    "user-prompt-submit.ts",
    "pre-tool-use.ts",
    "post-tool-use.ts",
    "post-tool-use-failure.ts",
    "notification.ts",
    "stop.ts",
    "subagent-start.ts",
    "subagent-stop.ts",
    "pre-compact.ts",
    "permission-request.ts",
  ];
  return handlers.map((h) => join(handlersDir, h));
}
```

### Bundle Building

```typescript
// Bundle a single entrypoint with all dependencies inlined
async function bundleHandler(
  entrypoint: string,
  outdir: string
): Promise<void> {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir,
    target: "bun",
    minify: true,
    sourcemap: "none",
  });

  if (!result.success) {
    console.error(`Failed to bundle ${entrypoint}:`);
    for (const log of result.logs) {
      console.error(log);
    }
    throw new Error(`Bundle failed: ${entrypoint}`);
  }
}

// Build all handlers
async function buildAllHandlers(): Promise<void> {
  const handlersDir = join(import.meta.dir, "hooks", "handlers");
  const outdir = join(import.meta.dir, "dist", "handlers");

  const entrypoints = getHandlerEntrypoints(handlersDir);

  for (const entry of entrypoints) {
    await bundleHandler(entry, outdir);
    const name = entry.split(/[/\\]/).pop();
    console.log(`✓ Built ${name}`);
  }
}
```

### Version Sync Utility

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface VersionLocations {
  pluginJson: string;
  packageJson: string;
  changelog: string;
}

function readVersion(file: string): string {
  if (file.endsWith(".json")) {
    const content = JSON.parse(readFileSync(file, "utf-8"));
    return content.version;
  }
  // CHANGELOG.md - extract from first ## [x.x.x] header
  const content = readFileSync(file, "utf-8");
  const match = content.match(/## \[(\d+\.\d+\.\d+)\]/);
  return match ? match[1] : "";
}

function validateVersionSync(locations: VersionLocations): boolean {
  const versions = {
    plugin: readVersion(locations.pluginJson),
    package: readVersion(locations.packageJson),
    changelog: readVersion(locations.changelog),
  };

  const allMatch =
    versions.plugin === versions.package &&
    versions.package === versions.changelog;

  if (!allMatch) {
    console.error("Version mismatch detected:");
    console.error(`  plugin.json:  ${versions.plugin}`);
    console.error(`  package.json: ${versions.package}`);
    console.error(`  CHANGELOG.md: ${versions.changelog}`);
  }

  return allMatch;
}
```

## Configuration

### Bun Build Options

```typescript
// Full build.ts script structure
const BUILD_CONFIG = {
  handlers: {
    entrypoints: "hooks/handlers/*.ts",
    outdir: "dist/handlers",
    target: "bun" as const,
    minify: true,
  },
  viewer: {
    entrypoints: ["hooks/viewer/server.ts"],
    outdir: "dist/viewer",
    target: "bun" as const,
    minify: true,
  },
};

async function build(): Promise<void> {
  console.log("Building claude-hall-monitor plugin...\n");

  // Clean dist directory
  await Bun.$`rm -rf dist`;
  await Bun.$`mkdir -p dist/handlers dist/viewer`;

  // Build handlers
  console.log("Building handlers...");
  await buildAllHandlers();

  // Build viewer
  console.log("\nBuilding viewer...");
  await bundleHandler("hooks/viewer/server.ts", "dist/viewer");

  console.log("\n✓ Build complete!");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## Testing

### E2E Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "bun";
import { join } from "node:path";

describe("Plugin E2E Tests", () => {
  const distDir = join(import.meta.dir, "..", "dist");

  it("session-start handler produces valid output", async () => {
    const input = JSON.stringify({
      session_id: "test-123",
      cwd: "/tmp/test",
    });

    const proc = spawn({
      cmd: ["bun", "run", join(distDir, "handlers", "session-start.js")],
      stdin: "pipe",
      stdout: "pipe",
    });

    proc.stdin.write(input);
    proc.stdin.end();

    const output = await new Response(proc.stdout).text();
    const result = JSON.parse(output);

    expect(result).toHaveProperty("additionalContext");
  });

  it("pre-tool-use handler allows safe commands", async () => {
    const input = JSON.stringify({
      session_id: "test-123",
      tool_name: "Bash",
      tool_input: { command: "ls -la" },
    });

    const proc = spawn({
      cmd: ["bun", "run", join(distDir, "handlers", "pre-tool-use.js")],
      stdin: "pipe",
      stdout: "pipe",
    });

    proc.stdin.write(input);
    proc.stdin.end();

    const output = await new Response(proc.stdout).text();
    const result = JSON.parse(output);

    expect(result.permissionDecision).toBe("allow");
  });
});
```
