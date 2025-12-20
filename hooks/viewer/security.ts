/**
 * Security utilities for the realtime log viewer
 *
 * Provides validation and security hardening functions:
 * - Session ID validation
 * - Path traversal prevention
 * - Bearer token verification
 * - Rate limiting for SSE connections
 */

import { resolve, normalize } from 'node:path';

/**
 * Validates session ID format
 *
 * Session IDs must be:
 * - Alphanumeric characters and hyphens only
 * - Maximum 64 characters in length
 *
 * @param sessionId - The session ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidSessionId(sessionId: string): boolean {
  if (typeof sessionId !== 'string' || sessionId.length === 0 || sessionId.length > 64) {
    return false;
  }
  // Only allow alphanumeric characters and hyphens
  return /^[a-zA-Z0-9-]+$/.test(sessionId);
}

/**
 * Validates that a requested path is within an allowed base directory
 *
 * Prevents path traversal attacks by:
 * 1. Resolving both paths to absolute paths
 * 2. Normalizing paths to remove ../ and ./
 * 3. Checking that the requested path starts with the allowed base
 *
 * @param path - The requested file path
 * @param allowedBase - The base directory that access is restricted to
 * @returns true if the path is safe, false if it attempts traversal
 */
export function validatePath(path: string, allowedBase: string): boolean {
  if (typeof path !== 'string' || typeof allowedBase !== 'string') {
    return false;
  }

  try {
    // Resolve to absolute paths
    const resolvedPath = resolve(normalize(path));
    const resolvedBase = resolve(normalize(allowedBase));

    // Check if the resolved path starts with the allowed base
    return resolvedPath.startsWith(resolvedBase);
  } catch {
    return false;
  }
}

/**
 * Verifies Bearer token from Authorization header
 *
 * Expects header format: "Authorization: Bearer <token>"
 * Performs constant-time comparison to prevent timing attacks
 *
 * @param req - The HTTP request object
 * @param expectedToken - The expected token value
 * @returns true if token matches, false otherwise
 */
export function verifyBearerToken(req: Request, expectedToken: string): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false;
  }

  const providedToken = parts[1];
  if (!providedToken || !expectedToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (providedToken.length !== expectedToken.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < providedToken.length; i++) {
    // Use bitwise OR to accumulate mismatches without short-circuiting
    mismatch |= providedToken.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Rate limiter for SSE connections
 *
 * Implements EC005: Limits SSE connections per IP address to prevent
 * resource exhaustion attacks. Uses a sliding window algorithm with
 * automatic cleanup of expired entries.
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly windowMs: number;

  /**
   * Creates a new rate limiter
   *
   * @param limit - Maximum number of connections allowed per IP
   * @param windowMs - Time window in milliseconds
   */
  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Check if an IP address is allowed to make a new connection
   *
   * Automatically cleans up expired entries and tracks new attempts.
   *
   * @param ip - The IP address to check
   * @returns true if allowed, false if rate limit exceeded
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing attempts for this IP
    let ipAttempts = this.attempts.get(ip) || [];

    // Remove expired attempts (older than the window)
    ipAttempts = ipAttempts.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (ipAttempts.length >= this.limit) {
      return false;
    }

    // Record this attempt
    ipAttempts.push(now);
    this.attempts.set(ip, ipAttempts);

    // Cleanup: remove IPs with no recent attempts
    this.cleanup(windowStart);

    return true;
  }

  /**
   * Remove IPs with no attempts within the current window
   *
   * @param windowStart - Timestamp marking the start of the current window
   */
  private cleanup(windowStart: number): void {
    const entries = Array.from(this.attempts.entries());
    for (const [ip, timestamps] of entries) {
      // Filter out expired timestamps
      const activeTimestamps = timestamps.filter(ts => ts > windowStart);

      if (activeTimestamps.length === 0) {
        // No active attempts, remove this IP
        this.attempts.delete(ip);
      } else if (activeTimestamps.length < timestamps.length) {
        // Some timestamps expired, update the array
        this.attempts.set(ip, activeTimestamps);
      }
    }
  }
}
