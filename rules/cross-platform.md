# Cross-Platform Compatibility

This project runs on Windows with Bun. Follow these conventions to ensure code works across platforms.

## Path Handling

### Always use `join()` for paths

```typescript
import { join } from "node:path";

// Good - works on all platforms
const filePath = join(baseDir, "subdir", "file.ts");

// Bad - breaks on Windows
const filePath = `${baseDir}/subdir/file.ts`;
```

### Normalize paths for shell commands

Windows `cmd.exe` has issues with backslashes in quoted paths. Convert to forward slashes:

```typescript
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

const safePath = normalizePath(join(dir, "file.ts"));
```

## Spawning Background Processes

Bun's `spawn()` with `cmd.exe`'s `start /b` has path handling issues on Windows. Use PowerShell instead:

```typescript
import { spawn } from "bun";

const cmd = process.platform === "win32"
  ? ["powershell", "-NoProfile", "-Command",
     `Start-Process -NoNewWindow -FilePath bun -ArgumentList 'run', '${normalizedPath}'`]
  : ["sh", "-c", `bun run "${path}" &`];

spawn(cmd, { stdout: "ignore", stderr: "ignore", stdin: "ignore" });
```

## Test Mocking with Paths

When mocking `node:fs` functions, use `join()` for mock paths to ensure platform-correct separators:

```typescript
// In test setup
const MOCK_DIR = join("/mock", "path");  // Platform-correct separators

// In mock implementation
mockExistsSync.mockImplementation((path: string) => {
  return path === MOCK_DIR || path === join(MOCK_DIR, "file.json");
});
```

Hardcoded forward slash paths like `/mock/path` will fail on Windows because `join()` produces `\mock\path`.
