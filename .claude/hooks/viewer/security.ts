/**
 * Security utilities for path sanitization, session ID validation,
 * and other security functions.
 */
import { randomBytes } from "node:crypto";

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

/**
 * Validate a session ID matches expected format.
 * Session IDs are alphanumeric with hyphens, max 64 chars.
 *
 * @param id - The session ID to validate
 * @returns The validated session ID or null if invalid
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
 * @param component - The path component to sanitize
 * @returns The sanitized component or null if invalid
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
 *
 * @param relativePath - The relative path to validate
 * @param baseDir - The base directory path
 * @returns The full path if valid, null if outside base
 */
export function validatePathWithinBase(
  relativePath: string,
  baseDir: string
): string | null {
  const { join, resolve, normalize } = require("node:path");

  const normalizedBase = normalize(resolve(baseDir));
  const fullPath = normalize(resolve(baseDir, relativePath));

  if (!fullPath.startsWith(normalizedBase)) {
    return null;
  }

  return fullPath;
}

/**
 * Get the localhost origin string for CORS.
 *
 * @param port - The port number
 * @returns The localhost origin URL
 */
export function getLocalhostOrigin(port: number): string {
  return `http://localhost:${port}`;
}

/**
 * Validate a plan name for the /api/plans/:name endpoint.
 * Plan names are ASCII alphanumeric with underscores and hyphens.
 *
 * @param name - The plan name to validate
 * @returns The validated plan name or null if invalid
 */
export function validatePlanName(name: string): string | null {
  if (!name || typeof name !== "string") return null;

  // Decode URL encoding first
  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    return null; // Invalid encoding
  }

  // Reject null bytes
  if (decoded.includes("\x00")) return null;

  // Only allow ASCII alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(decoded)) return null;

  // Reasonable length limit
  if (decoded.length > 128) return null;

  return decoded;
}
