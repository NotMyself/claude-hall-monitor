import { describe, expect, test } from "vitest";
import {
  validateSessionId,
  sanitizePathComponent,
  validatePathWithinBase,
  getLocalhostOrigin,
  validatePlanName,
  generateAuthToken,
  verifyAuthToken,
} from "../security";

describe("validateSessionId", () => {
  test("accepts valid alphanumeric session ID", () => {
    expect(validateSessionId("abc123")).toBe("abc123");
  });

  test("accepts session ID with hyphens", () => {
    expect(validateSessionId("session-123-abc")).toBe("session-123-abc");
  });

  test("accepts mixed case alphanumeric with hyphens", () => {
    expect(validateSessionId("Session-ABC-123")).toBe("Session-ABC-123");
  });

  test("rejects null", () => {
    expect(validateSessionId(null)).toBe(null);
  });

  test("rejects non-string", () => {
    expect(validateSessionId(123 as any)).toBe(null);
  });

  test("rejects session ID over 64 chars (EC003)", () => {
    const longId = "a".repeat(65);
    expect(validateSessionId(longId)).toBe(null);
  });

  test("accepts session ID at exactly 64 chars", () => {
    const id = "a".repeat(64);
    expect(validateSessionId(id)).toBe(id);
  });

  test("rejects session ID with special characters", () => {
    expect(validateSessionId("session_123")).toBe(null);
    expect(validateSessionId("session.123")).toBe(null);
    expect(validateSessionId("session/123")).toBe(null);
    expect(validateSessionId("session\\123")).toBe(null);
  });

  test("rejects session ID with spaces", () => {
    expect(validateSessionId("session 123")).toBe(null);
  });

  test("rejects empty string (EC007)", () => {
    expect(validateSessionId("")).toBe(null);
  });

  test("rejects whitespace-only string (EC007)", () => {
    expect(validateSessionId("   ")).toBe(null);
  });
});

describe("sanitizePathComponent", () => {
  test("accepts valid filename", () => {
    expect(sanitizePathComponent("file.txt")).toBe("file.txt");
  });

  test("accepts alphanumeric with underscores and hyphens", () => {
    expect(sanitizePathComponent("my_file-123.txt")).toBe("my_file-123.txt");
  });

  test("rejects path traversal with dots (EC001)", () => {
    expect(sanitizePathComponent("..")).toBe(null);
    expect(sanitizePathComponent("../file.txt")).toBe(null);
  });

  test("rejects URL-encoded path traversal (EC001)", () => {
    expect(sanitizePathComponent("%2e%2e")).toBe(null);
    expect(sanitizePathComponent("%2e%2e%2ffile.txt")).toBe(null);
  });

  test("rejects forward slash", () => {
    expect(sanitizePathComponent("dir/file.txt")).toBe(null);
  });

  test("rejects backslash", () => {
    expect(sanitizePathComponent("dir\\file.txt")).toBe(null);
  });

  test("rejects null bytes (EC002)", () => {
    expect(sanitizePathComponent("file\x00.txt")).toBe(null);
  });

  test("rejects null", () => {
    expect(sanitizePathComponent(null as any)).toBe(null);
  });

  test("rejects non-string", () => {
    expect(sanitizePathComponent(123 as any)).toBe(null);
  });

  test("rejects empty string (EC007)", () => {
    expect(sanitizePathComponent("")).toBe(null);
  });

  test("rejects whitespace-only string (EC007)", () => {
    expect(sanitizePathComponent("   ")).toBe(null);
  });

  test("rejects invalid URL encoding", () => {
    expect(sanitizePathComponent("%GG")).toBe(null);
  });

  test("accepts filename with valid URL encoding", () => {
    expect(sanitizePathComponent("file%20name.txt")).toBe("file name.txt");
  });
});

describe("validatePathWithinBase", () => {
  test("accepts path within base directory", () => {
    const result = validatePathWithinBase("subdir/file.txt", "/base");
    expect(result).not.toBe(null);
    expect(result).toContain("subdir");
    expect(result).toContain("file.txt");
  });

  test("rejects path traversal outside base", () => {
    expect(validatePathWithinBase("../outside.txt", "/base")).toBe(null);
  });

  test("rejects absolute path outside base", () => {
    expect(validatePathWithinBase("/etc/passwd", "/base")).toBe(null);
  });

  test("accepts nested subdirectory", () => {
    const result = validatePathWithinBase("sub1/sub2/file.txt", "/base");
    expect(result).not.toBe(null);
  });

  test("rejects sneaky traversal", () => {
    expect(validatePathWithinBase("subdir/../../outside.txt", "/base")).toBe(null);
  });

  test("normalizes path correctly", () => {
    const result = validatePathWithinBase("./subdir/./file.txt", "/base");
    expect(result).not.toBe(null);
  });
});

describe("getLocalhostOrigin", () => {
  test("returns localhost origin with port", () => {
    expect(getLocalhostOrigin(3456)).toBe("http://localhost:3456");
  });

  test("works with different ports", () => {
    expect(getLocalhostOrigin(8080)).toBe("http://localhost:8080");
    expect(getLocalhostOrigin(3000)).toBe("http://localhost:3000");
  });
});

describe("validatePlanName", () => {
  test("accepts valid alphanumeric plan name", () => {
    expect(validatePlanName("plan123")).toBe("plan123");
  });

  test("accepts plan name with underscores and hyphens", () => {
    expect(validatePlanName("my_plan-v2")).toBe("my_plan-v2");
  });

  test("accepts mixed case", () => {
    expect(validatePlanName("MyPlan")).toBe("MyPlan");
  });

  test("rejects plan name with spaces", () => {
    expect(validatePlanName("my plan")).toBe(null);
  });

  test("rejects plan name with special characters", () => {
    expect(validatePlanName("plan.txt")).toBe(null);
    expect(validatePlanName("plan/123")).toBe(null);
    expect(validatePlanName("plan\\123")).toBe(null);
  });

  test("rejects Unicode characters (EC004)", () => {
    expect(validatePlanName("план")).toBe(null);
    expect(validatePlanName("plan🚀")).toBe(null);
  });

  test("rejects null bytes (EC002)", () => {
    expect(validatePlanName("plan\x00name")).toBe(null);
  });

  test("rejects URL-encoded path traversal (EC001)", () => {
    expect(validatePlanName("%2e%2e")).toBe(null);
  });

  test("rejects plan name over 128 chars", () => {
    const longName = "a".repeat(129);
    expect(validatePlanName(longName)).toBe(null);
  });

  test("accepts plan name at exactly 128 chars", () => {
    const name = "a".repeat(128);
    expect(validatePlanName(name)).toBe(name);
  });

  test("rejects null", () => {
    expect(validatePlanName(null as any)).toBe(null);
  });

  test("rejects non-string", () => {
    expect(validatePlanName(123 as any)).toBe(null);
  });

  test("rejects empty string (EC007)", () => {
    expect(validatePlanName("")).toBe(null);
  });

  test("rejects whitespace-only string (EC007)", () => {
    expect(validatePlanName("   ")).toBe(null);
  });

  test("accepts URL-encoded valid characters", () => {
    expect(validatePlanName("plan%2D123")).toBe("plan-123");
  });

  test("rejects invalid URL encoding", () => {
    expect(validatePlanName("%GG")).toBe(null);
  });
});

describe("generateAuthToken", () => {
  test("generates unique tokens", () => {
    const token1 = generateAuthToken();
    const token2 = generateAuthToken();
    expect(token1).not.toBe(token2);
  });

  test("generates 64-character hex string (32 bytes)", () => {
    const token = generateAuthToken();
    expect(token.length).toBe(64);
    expect(/^[a-f0-9]{64}$/.test(token)).toBe(true);
  });

  test("generates cryptographically random tokens", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateAuthToken());
    }
    // All 100 tokens should be unique
    expect(tokens.size).toBe(100);
  });
});

describe("verifyAuthToken", () => {
  test("verifies valid token with Bearer prefix", () => {
    const token = generateAuthToken();
    expect(verifyAuthToken(`Bearer ${token}`, token)).toBe(true);
  });

  test("verifies valid token with bearer prefix (case insensitive)", () => {
    const token = generateAuthToken();
    expect(verifyAuthToken(`bearer ${token}`, token)).toBe(true);
  });

  test("rejects wrong token", () => {
    const token = generateAuthToken();
    const wrongToken = generateAuthToken();
    expect(verifyAuthToken(`Bearer ${wrongToken}`, token)).toBe(false);
  });

  test("rejects null header", () => {
    const token = generateAuthToken();
    expect(verifyAuthToken(null, token)).toBe(false);
  });

  test("rejects empty header", () => {
    const token = generateAuthToken();
    expect(verifyAuthToken("", token)).toBe(false);
  });

  test("accepts token without Bearer prefix (fallback behavior)", () => {
    // Current implementation allows raw token comparison
    const token = generateAuthToken();
    expect(verifyAuthToken(token, token)).toBe(true);
  });

  test("rejects malformed header", () => {
    const token = generateAuthToken();
    expect(verifyAuthToken("NotBearer " + token, token)).toBe(false);
  });

  test("accepts token with multiple spaces after Bearer", () => {
    // Regex \s+ matches one or more whitespace
    const token = generateAuthToken();
    expect(verifyAuthToken(`Bearer  ${token}`, token)).toBe(true);
    expect(verifyAuthToken(`Bearer   ${token}`, token)).toBe(true);
  });

  test("prevents timing attacks with constant-time comparison", () => {
    // While we can't truly test timing, we can verify behavior
    const token = generateAuthToken();
    const wrongTokenSamePrefix = token.slice(0, 60) + "0000";
    const wrongTokenDifferent = "a".repeat(64);

    expect(verifyAuthToken(`Bearer ${wrongTokenSamePrefix}`, token)).toBe(false);
    expect(verifyAuthToken(`Bearer ${wrongTokenDifferent}`, token)).toBe(false);
  });

  test("rejects auth token passed in URL query string (EC012)", () => {
    // This tests that we ONLY accept tokens in Authorization header
    // not in URL parameters (which would be insecure)
    const token = generateAuthToken();
    const urlWithToken = `?token=${token}`;
    expect(verifyAuthToken(urlWithToken, token)).toBe(false);
  });

  test("accepts tab or newline after Bearer", () => {
    const token = generateAuthToken();
    expect(verifyAuthToken(`Bearer\t${token}`, token)).toBe(true);
    expect(verifyAuthToken(`Bearer\n${token}`, token)).toBe(true);
  });
});
