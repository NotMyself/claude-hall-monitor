# Architectural and Security Review

**Project:** Claude Code Hooks Implementation (Bun on Windows)
**Review Date:** December 13, 2025
**Reviewer:** Claude Opus 4.5 (Automated Multi-Agent Analysis)

---

## Executive Summary

This review provides a comprehensive architectural and security analysis of the Claude Code hooks implementation. The project implements all 12 Claude Code hooks with JSONL logging, a realtime log viewer web UI, and comprehensive type safety using the `@anthropic-ai/claude-agent-sdk`.

### Overall Assessment

| Category | Rating | Summary |
|----------|--------|---------|
| **Architecture** | Good | Clean design with excellent separation of concerns |
| **Security** | Critical Issues | Multiple path traversal and network exposure vulnerabilities |
| **Code Quality** | Good | Consistent patterns, strong type safety |
| **Test Coverage** | Moderate | Infrastructure tests solid, behavioral tests lacking |
| **Dependencies** | Excellent | Minimal footprint, all current versions |
| **Error Handling** | Needs Improvement | Inconsistent patterns, silent failures |

### Critical Findings Requiring Immediate Action

1. **Path Traversal Vulnerabilities** - Attackers can read arbitrary files via `/styles/` and `/api/plans/` endpoints
2. **Network Exposure** - Web server binds to `0.0.0.0:3456` with no authentication
3. **Permissive CORS** - `Access-Control-Allow-Origin: *` enables cross-origin data theft
4. **Session ID Injection** - Unsanitized session parameters enable file access attacks

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Security Analysis](#2-security-analysis)
3. [Code Quality Assessment](#3-code-quality-assessment)
4. [Test Coverage Analysis](#4-test-coverage-analysis)
5. [Dependency Analysis](#5-dependency-analysis)
6. [Error Handling Patterns](#6-error-handling-patterns)
7. [Session Management](#7-session-management)
8. [Recommendations](#8-recommendations)
9. [Appendix: Detailed Findings](#9-appendix-detailed-findings)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
Claude Code Runtime
    |
    v
.claude/settings.json (hook registration)
    |
    v (spawn process)
+--------------------------------------------------+
|  Hook Handler Process (bun run handlers/*.ts)    |
|    +-- readInput() --> JSON from stdin           |
|    +-- logger.log() --> append to logs/{id}.txt  |
|    +-- Custom logic (optional)                   |
|    +-- writeOutput() --> JSON to stdout          |
+--------------------------------------------------+
    |
    v (return control)
+-------------------+        +-----------------------+
| Claude Code       |        | Log Files (JSONL)     |
| (applies output)  |        | .claude/hooks/logs/   |
+-------------------+        +-----------+-----------+
                                         |
                             +-----------v-----------+
                             |  Log Watcher (500ms)  |
                             |  SSE Broadcaster      |
                             +-----------+-----------+
                                         |
                             +-----------v-----------+
                             | Web UI (Port 3456)    |
                             | Realtime Dashboard    |
                             +-----------------------+
```

### 1.2 Hook Coverage

All 12 Claude Code hooks are implemented:

| Hook | Handler | Purpose | Output Type |
|------|---------|---------|-------------|
| UserPromptSubmit | `user-prompt-submit.ts` | Log prompts, inject context | `additionalContext` |
| PreToolUse | `pre-tool-use.ts` | Permission decisions, modify inputs | `permissionDecision`, `updatedInput` |
| PostToolUse | `post-tool-use.ts` | Log results, modify MCP output | `additionalContext`, `updatedMCPToolOutput` |
| PostToolUseFailure | `post-tool-use-failure.ts` | Log failures, recovery context | `additionalContext` |
| Notification | `notification.ts` | Log system notifications | None |
| SessionStart | `session-start.ts` | Log start, auto-start viewer | `additionalContext` |
| SessionEnd | `session-end.ts` | Log end, shutdown viewer | None |
| Stop | `stop.ts` | Log user interrupts | None |
| SubagentStart | `subagent-start.ts` | Log subagent spawn | `additionalContext` |
| SubagentStop | `subagent-stop.ts` | Log subagent completion | None |
| PreCompact | `pre-compact.ts` | Log context compaction | None |
| PermissionRequest | `permission-request.ts` | Auto-approve/deny permissions | `decision` |

### 1.3 Design Patterns

**Strengths:**
- **Consistent Handler Pattern**: All handlers follow `readInput() -> log() -> process -> writeOutput()`
- **Type Safety**: Full utilization of SDK types with TypeScript strict mode
- **Per-Session Isolation**: Each session gets dedicated JSONL log file
- **Stateless Handlers**: Each invocation is independent, scalable design
- **Cross-Platform Support**: Explicit Windows handling with PowerShell

**Design Considerations:**
- Process spawning overhead (new Bun process per hook invocation)
- No batching for high-frequency hooks
- Module-level global state in heartbeat logic

### 1.4 Data Flow

**Input Flow:**
```
Claude Code Runtime -> stdin (JSON) -> readInput<T>() -> Handler Logic
```

**Output Flow:**
```
Handler Logic -> writeOutput() -> stdout (JSON) -> Claude Code Runtime
```

**Logging Flow:**
```
Handler -> logger.log() -> appendFile() -> logs/{session_id}.txt
```

---

## 2. Security Analysis

### 2.1 Critical Vulnerabilities

#### CVE-Candidate: Path Traversal in Static File Serving

**Severity:** CRITICAL
**Location:** `.claude/hooks/viewer/server.ts:213-215`

```typescript
if (path.startsWith("/styles/") && request.method === "GET") {
  const filePath = `${PATHS.STYLES_DIR}${path.replace("/styles", "")}`;
  return serveFile(filePath);
}
```

**Attack Vector:**
```
GET /styles/../../settings.json
GET /styles/../../../../etc/passwd
GET /styles/../../logs/session-abc123.txt
```

**Impact:** Read arbitrary files from file system including:
- Session logs (prompts, tool commands, secrets)
- Configuration files
- SSH keys, credentials
- System files

**Root Cause:** String concatenation without path normalization or bounds checking.

---

#### CVE-Candidate: Path Traversal via Plan Name

**Severity:** CRITICAL
**Location:** `.claude/hooks/viewer/server.ts:312-314`

```typescript
if (path.startsWith("/api/plans/") && request.method === "GET") {
  const name = path.replace("/api/plans/", "");
  const plan = planWatcher.getPlan(name);
```

**Attack Vector:**
```
GET /api/plans/../../../etc/passwd
GET /api/plans/../../settings.json
```

**Impact:** Same as above - arbitrary file read.

---

#### CVE-Candidate: Session ID Injection

**Severity:** CRITICAL
**Location:** `.claude/hooks/viewer/server.ts:239-242`

```typescript
const session = url.searchParams.get("session") || currentSessionId;
if (session && session !== watcher.getCurrentSessionId()) {
  watcher.setSession(session);
}
```

**Attack Vector:**
```
GET /api/entries?session=../../../etc/passwd
GET /api/entries?session=../../sensitive-file
```

**Impact:** Access files outside the logs directory.

---

#### Network Exposure Without Authentication

**Severity:** CRITICAL
**Location:** `.claude/hooks/viewer/config.ts:10-11`

```typescript
export const SERVER_CONFIG = {
  PORT: 3456,
  HOST: "0.0.0.0",  // Accepts connections from any interface
```

**Combined with:**
```typescript
"Access-Control-Allow-Origin": "*",  // Allows all cross-origin requests
```

**Impact:**
- Any machine on the network can access all session logs
- Cross-site attacks can steal session data
- Unauthenticated `/shutdown` endpoint allows DoS

### 2.2 High Severity Issues

| Issue | Location | Description |
|-------|----------|-------------|
| XSS via v-html | `index.html:774` | User content rendered with `v-html` directive |
| No Authentication | `server.ts` (all) | All API endpoints accessible without auth |
| Sensitive Data Logging | All handlers | Tool inputs logged without filtering (may contain secrets) |
| Unauthenticated Shutdown | `server.ts:282-296` | `POST /shutdown` has no auth |

### 2.3 Medium Severity Issues

| Issue | Location | Description |
|-------|----------|-------------|
| No Rate Limiting | `server.ts` | SSE endpoints accept unlimited connections |
| No Input Validation | All handlers | JSON input parsed without schema validation |
| Error Information Disclosure | `dashboard.ts` | Debug messages may leak paths |
| Missing HTTPS | `config.ts` | No TLS support for production |

### 2.4 Security Recommendations

**Immediate (Before Production Use):**

1. **Bind to localhost only:**
   ```typescript
   HOST: "127.0.0.1",  // or "localhost"
   ```

2. **Implement path sanitization:**
   ```typescript
   function sanitizePath(basePath: string, userInput: string): string | null {
     const resolved = path.resolve(basePath, userInput);
     if (!resolved.startsWith(path.resolve(basePath))) {
       return null; // Path traversal attempt
     }
     return resolved;
   }
   ```

3. **Validate session IDs:**
   ```typescript
   function isValidSessionId(id: string): boolean {
     return /^[a-f0-9-]{36}$/i.test(id); // UUID format only
   }
   ```

4. **Remove wildcard CORS:**
   ```typescript
   "Access-Control-Allow-Origin": "http://localhost:3456",
   ```

5. **Add authentication token:**
   ```typescript
   const AUTH_TOKEN = process.env.VIEWER_AUTH_TOKEN;
   if (request.headers.get("Authorization") !== `Bearer ${AUTH_TOKEN}`) {
     return new Response("Unauthorized", { status: 401 });
   }
   ```

---

## 3. Code Quality Assessment

### 3.1 Type Safety

**Excellent Coverage:**
- All 12 handlers import specific types from `@anthropic-ai/claude-agent-sdk`
- Generic `readInput<T>()` enables compile-time type checking
- TypeScript strict mode enforced via `tsconfig.json`
- Viewer has 21 comprehensive type definitions

**Gaps:**
- No runtime validation of SDK types
- Generic `Record<string, unknown>` in LogEntry allows untyped payloads
- Output object validation is implicit

### 3.2 Code Consistency

All handlers follow the same pattern:

```typescript
import { log, readInput, writeOutput } from '../utils/logger';
import type { HookInputType, SyncHookJSONOutput } from '@anthropic-ai/claude-agent-sdk';

async function main(): Promise<void> {
  const input = await readInput<HookInputType>();
  await log('EventName', input.session_id, { /* relevant data */ });
  const output: SyncHookJSONOutput = { continue: true };
  writeOutput(output);
}

await main();
```

**Quality Indicators:**
- JSDoc comments on all handlers with examples
- Consistent import ordering
- Uniform error handling (where present)

### 3.3 Cross-Platform Handling

**Good Practices:**
```typescript
// Platform-specific process spawning
const cmd = process.platform === "win32"
  ? ["powershell", "-NoProfile", "-Command", ...]
  : ["sh", "-c", `bun run "${viewerPath}" &`];

// Path normalization
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}
```

**Issues:**
- Not all paths use `join()` consistently
- Some hardcoded forward slashes in tests

---

## 4. Test Coverage Analysis

### 4.1 Coverage Summary

| Category | Coverage | Status |
|----------|----------|--------|
| Logger Utility | 85% | Good - JSONL/file I/O tests |
| Component Logic | 75% | Good - UI logic tests |
| Server Endpoints | 40% | Basic - Missing streaming/concurrency |
| Handler Execution | 5% | Critical Gap - No actual execution |
| Security | 0% | Critical Gap - No security tests |
| Cross-Platform | 10% | Gap - No platform-specific tests |
| Integration | 20% | Partial - No full pipeline tests |
| Performance | 0% | Missing - No stress tests |
| **Overall** | **~35%** | Moderate |

### 4.2 Critical Testing Gaps

**Handler Execution Tests (MAJOR GAP):**
Handlers are never actually executed in tests - only file existence is verified:

```typescript
// Current test - just checks file exists
it('all handler files exist', async () => {
  const exists = await stat(handlerPath).then(() => true).catch(() => false);
  expect(exists).toBe(true);
});

// Missing - actually run the handler
it('pre-tool-use handler allows tools', async () => {
  const output = await executeHandler('pre-tool-use.ts', JSON.stringify(mockInput));
  expect(JSON.parse(output).hookSpecificOutput.permissionDecision).toBe('allow');
});
```

**Security Tests (NOT PRESENT):**
- No input injection tests
- No path traversal tests
- No XSS prevention verification
- No permission bypass tests

**Cross-Platform Tests (NOT PRESENT):**
- No Windows path handling tests
- No PowerShell command verification
- No Unix shell tests

### 4.3 Test Recommendations

**Priority 1 - Add Handler Execution Tests:**
```typescript
describe('PreToolUse Handler', () => {
  it('allows tools by default', async () => {
    const input = createMockInput.preToolUse();
    const output = await runHandler('pre-tool-use.ts', input);
    expect(output.hookSpecificOutput.permissionDecision).toBe('allow');
  });
});
```

**Priority 2 - Add Security Tests:**
```typescript
describe('Security - Path Traversal', () => {
  it('blocks path traversal in styles endpoint', async () => {
    const response = await fetch('/styles/../../etc/passwd');
    expect(response.status).toBe(403);
  });
});
```

---

## 5. Dependency Analysis

### 5.1 Dependency Summary

**Production Dependencies (1):**
| Package | Version | Purpose |
|---------|---------|---------|
| `@anthropic-ai/claude-agent-sdk` | `^0.1.62` | Hook type definitions |

**Development Dependencies (5):**
| Package | Version | Purpose |
|---------|---------|---------|
| `@types/bun` | `latest` | Bun runtime types |
| `vitest` | `^2.0.0` | Test runner |
| `@vitest/coverage-v8` | `^2.0.0` | Code coverage |
| `@vue/test-utils` | `^2.4.0` | Vue testing |
| `happy-dom` | `^15.0.0` | DOM mocking |

### 5.2 Security Status

| Metric | Status |
|--------|--------|
| Known Vulnerabilities | None |
| Outdated Packages | None |
| Lock File Present | Yes (`bun.lock`) |
| Version Pinning | Good (caret versions) |
| Dev/Prod Separation | Excellent |

### 5.3 Recommendations

1. **Minor:** Pin `@types/bun` to specific version instead of `latest`
2. **Best Practice:** Monthly dependency update reviews
3. **Maintenance:** Run `bun update` regularly to check for updates

---

## 6. Error Handling Patterns

### 6.1 Error Handling Summary

| Pattern | Status | Impact |
|---------|--------|--------|
| Try/Catch Usage | Good | 7 files with proper coverage |
| Async Error Handling | Issue Found | Unhandled promise in watcher |
| Silent Failures | Pattern Found | 14+ empty catch blocks |
| Error Propagation | Good | Logger re-throws correctly |
| Graceful Degradation | Good | Safe defaults returned |
| Error Logging | Inconsistent | Mixed debug/silent handling |

### 6.2 Critical Issues

**Unhandled Promise Rejection:**
**Location:** `.claude/hooks/viewer/watcher.ts:150-155`

```typescript
slice.text().then((content) => {
  const entries = this.parseLines(content);
  for (const entry of entries) {
    this.emit(entry);
  }
});
// Missing .catch() handler!
```

**Fix:**
```typescript
try {
  const content = await slice.text();
  const entries = this.parseLines(content);
  for (const entry of entries) {
    this.emit(entry);
  }
} catch (error) {
  console.error("Error reading log slice:", error);
}
```

**Silent Catch Blocks:**

Multiple files have empty catch blocks that swallow errors:
- `watcher.ts` - 4 instances
- `session-start.ts` - 1 instance
- `session-end.ts` - 1 instance
- `plan-watcher.ts` - 4 instances
- `server.ts` - 4 instances

### 6.3 Handler Error Safety

All handlers lack top-level error handling. If `readInput()` throws (e.g., malformed JSON), the handler crashes:

```typescript
// Current - crashes on bad input
await main();

// Recommended
try {
  await main();
} catch (error) {
  console.error("Handler error:", error);
  writeOutput({ continue: true }); // Safe default
  process.exit(1);
}
```

---

## 7. Session Management

### 7.1 Session Lifecycle

```
SessionStart Hook
    |
    +-- Log session metadata
    +-- Check if viewer running (fetch with 1s timeout)
    +-- Spawn viewer if needed (PowerShell/sh)
    +-- Pass session_id via environment variable
    |
    v
[Session Active - Tools executed, prompts submitted]
    |
    v
SessionEnd Hook
    |
    +-- Log session end metadata
    +-- Check reason (user_exit, completion, error, clear, compact)
    +-- If NOT clear/compact: POST /shutdown to viewer
    +-- Graceful viewer shutdown
```

### 7.2 Per-Session Isolation

- Each session gets dedicated log file: `logs/{session_id}.txt`
- JSONL format enables machine parsing
- 32+ concurrent sessions observed in logs directory
- Viewer can switch between sessions via query parameter

### 7.3 Concurrency Handling

| Scenario | Handling |
|----------|----------|
| Multiple sessions writing logs | File isolation per session |
| File truncation detected | Watcher resets position |
| Viewer session switching | Query param selection |
| Multiple concurrent tool uses | Sequential JSONL appends |

### 7.4 State Persistence

- **Handler State:** Not persisted (stateless processes)
- **Session Data:** Persisted in JSONL files
- **Heartbeat Counters:** Module-level variables, reset per invocation
- **Viewer State:** In-memory, reconstructed from logs

---

## 8. Recommendations

### 8.1 Critical (Must Fix Before Production)

| Priority | Issue | Fix | Effort |
|----------|-------|-----|--------|
| P0 | Path traversal in `/styles/` | Add path sanitization | Low |
| P0 | Path traversal in `/api/plans/` | Validate plan names | Low |
| P0 | Session ID injection | UUID validation | Low |
| P0 | Network exposure (0.0.0.0) | Bind to 127.0.0.1 | Trivial |
| P0 | CORS wildcard | Restrict to localhost | Trivial |
| P0 | No authentication | Add bearer token auth | Medium |

### 8.2 High Priority

| Priority | Issue | Fix | Effort |
|----------|-------|-----|--------|
| P1 | XSS via v-html | Use textContent | Low |
| P1 | Sensitive data in logs | Add redaction filters | Medium |
| P1 | Unhandled promise | Add catch handler | Low |
| P1 | Empty catch blocks | Add error logging | Low |
| P1 | Handler error safety | Add top-level try/catch | Low |

### 8.3 Medium Priority

| Priority | Issue | Fix | Effort |
|----------|-------|-----|--------|
| P2 | No rate limiting | Add connection limits | Medium |
| P2 | No input validation | Add schema validation | Medium |
| P2 | Test coverage gaps | Add handler execution tests | High |
| P2 | Missing security tests | Add injection/traversal tests | High |

### 8.4 Low Priority

| Priority | Issue | Fix | Effort |
|----------|-------|-----|--------|
| P3 | @types/bun "latest" | Pin to specific version | Trivial |
| P3 | Hardcoded port | Make configurable | Low |
| P3 | No HTTPS support | Add TLS configuration | Medium |
| P3 | Process spawn overhead | Consider daemon mode | High |

---

## 9. Appendix: Detailed Findings

### 9.1 Files Analyzed

```
.claude/
├── settings.json              # Hook configuration
├── hooks/
│   ├── handlers/              # 12 hook handlers
│   │   ├── notification.ts
│   │   ├── permission-request.ts
│   │   ├── post-tool-use-failure.ts
│   │   ├── post-tool-use.ts
│   │   ├── pre-compact.ts
│   │   ├── pre-tool-use.ts
│   │   ├── session-end.ts
│   │   ├── session-start.ts
│   │   ├── stop.ts
│   │   ├── subagent-start.ts
│   │   ├── subagent-stop.ts
│   │   ├── user-prompt-submit.ts
│   │   └── __tests__/
│   ├── utils/
│   │   ├── logger.ts          # Shared logging utility
│   │   └── __tests__/
│   ├── viewer/
│   │   ├── server.ts          # HTTP server
│   │   ├── watcher.ts         # File watcher
│   │   ├── dashboard.ts       # Dashboard service
│   │   ├── plan-watcher.ts    # Plan tracking
│   │   ├── session-summary.ts # Session summaries
│   │   ├── config.ts          # Configuration
│   │   ├── types.ts           # Type definitions
│   │   ├── index.html         # Vue.js SPA
│   │   └── __tests__/
│   ├── package.json
│   └── bun.lock
└── rules/                     # Project conventions
```

### 9.2 Vulnerability Details

#### Path Traversal - Full Analysis

**Vulnerable Code Pattern:**
```typescript
const filePath = `${baseDir}${userInput.replace("/prefix", "")}`;
```

**Safe Pattern:**
```typescript
import { resolve, normalize } from "node:path";

function safeJoin(base: string, userPath: string): string | null {
  const normalizedBase = resolve(base);
  const targetPath = resolve(base, userPath);

  // Ensure resolved path is within base directory
  if (!targetPath.startsWith(normalizedBase + path.sep)) {
    return null; // Traversal attempt detected
  }

  return targetPath;
}
```

#### Authentication Implementation

**Recommended Pattern:**
```typescript
// In config.ts
export const AUTH_TOKEN = process.env.CLAUDE_HOOKS_VIEWER_TOKEN ||
  crypto.randomBytes(32).toString('hex');

// In server.ts
function requireAuth(request: Request): Response | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== AUTH_TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" }
    });
  }
  return null;
}

// Usage
const authError = requireAuth(request);
if (authError) return authError;
```

### 9.3 Test Coverage Details

**Files with Tests:**
- `handlers/__tests__/handlers.test.ts` - Handler existence checks
- `handlers/__tests__/setup.ts` - Mock input generators
- `utils/__tests__/logger.test.ts` - Logger utility tests
- `viewer/__tests__/components.test.ts` - UI component tests
- `viewer/__tests__/server.test.ts` - Server endpoint tests
- `viewer/__tests__/dashboard.test.ts` - Dashboard service tests
- `viewer/__tests__/plan-watcher.test.ts` - Plan watcher tests

**Missing Test Files:**
- No handler execution tests
- No security/injection tests
- No cross-platform tests
- No integration tests
- No performance tests

---

## Conclusion

This Claude Code hooks implementation demonstrates solid architectural patterns, excellent type safety, and clean code organization. However, **critical security vulnerabilities in the web viewer must be addressed before any production use**. The primary issues are:

1. **Path traversal allowing arbitrary file reads**
2. **Network exposure without authentication**
3. **Permissive CORS enabling cross-origin attacks**

The recommended immediate actions are:
1. Bind server to localhost only
2. Add path sanitization to all file-serving endpoints
3. Validate all user inputs (session IDs, plan names)
4. Remove CORS wildcard
5. Add authentication token requirement

With these security fixes implemented, the project would be suitable for development use. For production deployment, additional hardening (HTTPS, rate limiting, comprehensive logging) is recommended.

---

*Generated by Claude Opus 4.5 via automated multi-agent architectural review*
