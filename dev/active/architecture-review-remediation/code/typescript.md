# TypeScript Patterns

## Types

### Security Types

```typescript
/**
 * Result of session ID validation
 */
export type SessionIdResult = string | null;

/**
 * Result of path sanitization
 */
export type SanitizedPath = string | null;

/**
 * Rate limiter entry for tracking connections
 */
export interface RateLimitEntry {
  count: number;
  windowStart: number;
}
```

### Server Types

```typescript
/**
 * Authentication token configuration
 */
export interface AuthConfig {
  token: string;
  headerName: string;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  maxConnections: number;
  windowMs: number;
}
```

## Functions

### Security Utilities

Core security functions for the `security.ts` module:

```typescript
/**
 * Validate a session ID matches expected format.
 * Session IDs are alphanumeric with hyphens, max 64 chars.
 *
 * @param id - Raw session ID from user input
 * @returns Validated session ID or null if invalid
 */
export function validateSessionId(id: string | null): string | null {
  if (!id || typeof id !== "string") return null;
  if (id.length > 64) return null;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  return id;
}

/**
 * Sanitize a path component (filename or single directory name).
 * Rejects traversal attempts, null bytes, and invalid characters.
 *
 * @param component - Raw path component from user input
 * @returns Sanitized component or null if invalid
 */
export function sanitizePathComponent(component: string): string | null {
  if (!component || typeof component !== "string") return null;

  // Decode URL encoding first (handles %2e%2e etc.)
  let decoded: string;
  try {
    decoded = decodeURIComponent(component);
  } catch {
    return null; // Invalid encoding
  }

  // Reject null bytes
  if (decoded.includes("\x00")) return null;

  // Reject path traversal
  if (decoded.includes("..")) return null;
  if (decoded.includes("/") || decoded.includes("\\")) return null;

  // Reject empty or whitespace-only
  if (!decoded.trim()) return null;

  return decoded;
}

/**
 * Validate a path is within a base directory.
 * Uses string comparison after normalization.
 *
 * @param relativePath - Sanitized relative path
 * @param baseDir - Base directory path
 * @returns Full path if valid, null if traversal detected
 */
export function validatePathWithinBase(
  relativePath: string,
  baseDir: string
): string | null {
  const { join, resolve, normalize } = require("node:path");

  const normalizedBase = normalize(resolve(baseDir));
  const fullPath = normalize(resolve(baseDir, relativePath));

  // Ensure the resolved path starts with the base directory
  if (!fullPath.startsWith(normalizedBase)) {
    return null;
  }

  return fullPath;
}

/**
 * Get the localhost origin string for CORS.
 *
 * @param port - Server port number
 * @returns Origin string like "http://localhost:3456"
 */
export function getLocalhostOrigin(port: number): string {
  return `http://localhost:${port}`;
}
```

### Plan Name Validation

```typescript
/**
 * Validate a plan name for the /api/plans/:name endpoint.
 * Plan names are ASCII alphanumeric with underscores and hyphens.
 *
 * @param name - Raw plan name from URL
 * @returns Validated name or null if invalid
 */
export function validatePlanName(name: string): string | null {
  if (!name || typeof name !== "string") return null;

  // Decode URL encoding first
  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    return null;
  }

  // Reject null bytes
  if (decoded.includes("\x00")) return null;

  // Only allow ASCII alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(decoded)) return null;

  // Reasonable length limit
  if (decoded.length > 128) return null;

  return decoded;
}
```

### Rate Limiting

```typescript
/**
 * Simple in-memory rate limiter for SSE connections.
 */
export class RateLimiter {
  private connections: Map<string, RateLimitEntry> = new Map();
  private maxConnections: number;
  private windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxConnections = config.maxConnections;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if a connection should be allowed.
   *
   * @param ip - Client IP address
   * @returns true if allowed, false if rate limited
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    const entry = this.connections.get(ip);

    if (!entry || now - entry.windowStart > this.windowMs) {
      // New window
      this.connections.set(ip, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= this.maxConnections) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Clean up expired entries to prevent memory leaks.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.connections) {
      if (now - entry.windowStart > this.windowMs) {
        this.connections.delete(ip);
      }
    }
  }
}
```

### Authentication

```typescript
/**
 * Generate a secure random token for authentication.
 * Uses crypto.randomBytes for cryptographic randomness.
 */
export function generateAuthToken(): string {
  const crypto = require("node:crypto");
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verify an authorization header matches the expected token.
 *
 * @param header - Authorization header value
 * @param expectedToken - Expected token
 * @returns true if valid, false otherwise
 */
export function verifyAuthToken(
  header: string | null,
  expectedToken: string
): boolean {
  if (!header) return false;
  const token = header.replace(/^Bearer\s+/i, "");
  return token === expectedToken;
}
```

## Error Handling

### Handler Error Wrapper

Pattern for top-level handler error handling:

```typescript
import { writeOutput } from "../utils/logger.ts";

/**
 * Wrap handler main function with error handling.
 * Ensures valid JSON output even on crash.
 */
async function safeMain(main: () => Promise<void>): Promise<void> {
  try {
    await main();
  } catch (error) {
    console.error("Handler error:", error);
    // Always output valid JSON
    writeOutput({ continue: true });
    process.exit(1);
  }
}

// Usage in handler:
await safeMain(main);
```

### Promise Error Handling

Pattern for fixing unhandled promises:

```typescript
// Before (unhandled promise)
slice.text().then((content) => {
  const entries = this.parseLines(content);
  for (const entry of entries) {
    this.emit(entry);
  }
});

// After (with error handling)
slice.text()
  .then((content) => {
    const entries = this.parseLines(content);
    for (const entry of entries) {
      this.emit(entry);
    }
  })
  .catch((error) => {
    console.error("Error reading log file slice:", error);
  });
```

### Catch Block Logging

Pattern for replacing silent catch blocks:

```typescript
// Before (silent failure)
try {
  const data = JSON.parse(line);
  // process data
} catch {
  // Skip invalid JSON lines
}

// After (with logging)
try {
  const data = JSON.parse(line);
  // process data
} catch (error) {
  console.error("Failed to parse JSON line:", error);
}
```

## Hooks

### Input Validation Hook

Pattern for validating hook inputs:

```typescript
import type { HookInput } from "@anthropic-ai/claude-agent-sdk";

/**
 * Validate required fields are present in hook input.
 */
export function validateHookInput(input: unknown): input is HookInput {
  if (!input || typeof input !== "object") return false;

  const obj = input as Record<string, unknown>;

  // Required fields for all hooks
  if (typeof obj.session_id !== "string") return false;
  if (typeof obj.hook_event_name !== "string") return false;

  return true;
}
```

## Server Patterns

### CSP Header

```typescript
/**
 * Content Security Policy for HTML responses.
 * Restricts script sources to prevent XSS.
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",  // Vue.js needs inline
  "style-src 'self' 'unsafe-inline'",   // Vue.js needs inline
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join("; ");
```

### CORS Headers

```typescript
/**
 * Get CORS headers for localhost-only access.
 */
export function getCorsHeaders(port: number): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": `http://localhost:${port}`,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
```
