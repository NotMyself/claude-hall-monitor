import { describe, it, expect } from "vitest";
import { validateHookInput, getSafeSessionId } from "../validation";

describe("validateHookInput", () => {
  it("returns true for valid input with all required fields", () => {
    const validInput = {
      session_id: "abc123",
      hook_event_name: "PreToolUse",
    };
    expect(validateHookInput(validInput)).toBe(true);
  });

  it("returns false for null input", () => {
    expect(validateHookInput(null)).toBe(false);
  });

  it("returns false for undefined input", () => {
    expect(validateHookInput(undefined)).toBe(false);
  });

  it("returns false for non-object input", () => {
    expect(validateHookInput("not an object")).toBe(false);
    expect(validateHookInput(123)).toBe(false);
    expect(validateHookInput(true)).toBe(false);
  });

  it("returns false for empty session_id", () => {
    const invalidInput = {
      session_id: "",
      hook_event_name: "PreToolUse",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for whitespace-only session_id", () => {
    const invalidInput = {
      session_id: "   ",
      hook_event_name: "PreToolUse",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for missing session_id", () => {
    const invalidInput = {
      hook_event_name: "PreToolUse",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for non-string session_id", () => {
    const invalidInput = {
      session_id: 123,
      hook_event_name: "PreToolUse",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for empty hook_event_name", () => {
    const invalidInput = {
      session_id: "abc123",
      hook_event_name: "",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for whitespace-only hook_event_name", () => {
    const invalidInput = {
      session_id: "abc123",
      hook_event_name: "  ",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for missing hook_event_name", () => {
    const invalidInput = {
      session_id: "abc123",
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns false for non-string hook_event_name", () => {
    const invalidInput = {
      session_id: "abc123",
      hook_event_name: 456,
    };
    expect(validateHookInput(invalidInput)).toBe(false);
  });

  it("returns true even with additional fields", () => {
    const validInput = {
      session_id: "abc123",
      hook_event_name: "PreToolUse",
      extra_field: "extra_value",
    };
    expect(validateHookInput(validInput)).toBe(true);
  });
});

describe("getSafeSessionId", () => {
  it("returns session_id from valid input", () => {
    const validInput = {
      session_id: "test-session-123",
      hook_event_name: "PreToolUse",
    };
    expect(getSafeSessionId(validInput)).toBe("test-session-123");
  });

  it("returns default for null input", () => {
    expect(getSafeSessionId(null)).toBe("unknown");
  });

  it("returns default for undefined input", () => {
    expect(getSafeSessionId(undefined)).toBe("unknown");
  });

  it("returns default for non-object input", () => {
    expect(getSafeSessionId("not an object")).toBe("unknown");
    expect(getSafeSessionId(123)).toBe("unknown");
  });

  it("returns default for missing session_id", () => {
    const invalidInput = {
      hook_event_name: "PreToolUse",
    };
    expect(getSafeSessionId(invalidInput)).toBe("unknown");
  });

  it("returns default for empty session_id", () => {
    const invalidInput = {
      session_id: "",
      hook_event_name: "PreToolUse",
    };
    expect(getSafeSessionId(invalidInput)).toBe("unknown");
  });

  it("returns default for whitespace-only session_id", () => {
    const invalidInput = {
      session_id: "   ",
      hook_event_name: "PreToolUse",
    };
    expect(getSafeSessionId(invalidInput)).toBe("unknown");
  });

  it("returns default for non-string session_id", () => {
    const invalidInput = {
      session_id: 123,
      hook_event_name: "PreToolUse",
    };
    expect(getSafeSessionId(invalidInput)).toBe("unknown");
  });

  it("uses custom default when provided", () => {
    expect(getSafeSessionId(null, "custom-default")).toBe("custom-default");
  });
});
