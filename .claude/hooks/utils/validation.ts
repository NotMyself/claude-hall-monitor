/**
 * Base hook input fields that all hooks must have.
 */
export interface BaseHookInput {
  session_id: string;
  hook_event_name: string;
}

/**
 * Validate that an input object has required hook fields.
 *
 * @param input - The input object to validate
 * @returns True if input has valid session_id and hook_event_name
 */
export function validateHookInput(input: unknown): input is BaseHookInput {
  if (!input || typeof input !== "object") {
    return false;
  }

  const obj = input as Record<string, unknown>;

  // Required: session_id must be a non-empty string
  if (typeof obj.session_id !== "string" || !obj.session_id.trim()) {
    return false;
  }

  // Required: hook_event_name must be a non-empty string
  if (typeof obj.hook_event_name !== "string" || !obj.hook_event_name.trim()) {
    return false;
  }

  return true;
}

/**
 * Get a safe session ID from input or return a default.
 *
 * @param input - The input object to extract session_id from
 * @param defaultId - The default ID to return if extraction fails (default: "unknown")
 * @returns The session_id from input or the default value
 */
export function getSafeSessionId(
  input: unknown,
  defaultId: string = "unknown"
): string {
  if (!input || typeof input !== "object") {
    return defaultId;
  }

  const obj = input as Record<string, unknown>;
  if (typeof obj.session_id === "string" && obj.session_id.trim()) {
    return obj.session_id;
  }

  return defaultId;
}
