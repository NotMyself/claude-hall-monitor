/**
 * Test setup utilities for handler tests
 *
 * Provides common test helpers for testing hook handlers:
 * - Mock input data generators
 */

/**
 * Common test data generators
 */
export const createMockInput = {
  sessionStart: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'SessionStart',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    source: 'startup',
    permission_mode: 'default',
    ...overrides,
  }),

  sessionEnd: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'SessionEnd',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    reason: 'user_exit',
    permission_mode: 'default',
    ...overrides,
  }),

  preToolUse: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'PreToolUse',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    tool_name: 'Bash',
    tool_input: { command: 'ls', description: 'List files' },
    tool_use_id: 'tool-abc-123',
    permission_mode: 'default',
    ...overrides,
  }),

  postToolUse: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'PostToolUse',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    tool_name: 'Read',
    tool_input: { file_path: 'C:\\Users\\test\\project\\src\\app.ts' },
    tool_response: 'console.log("Hello");',
    tool_use_id: 'tool-abc-123',
    permission_mode: 'default',
    ...overrides,
  }),

  permissionRequest: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'PermissionRequest',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    tool_name: 'Bash',
    tool_input: { command: 'npm install lodash' },
    permission_suggestions: [],
    permission_mode: 'default',
    ...overrides,
  }),

  userPromptSubmit: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'UserPromptSubmit',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    user_prompt: 'Hello Claude',
    permission_mode: 'default',
    ...overrides,
  }),

  notification: (overrides: Record<string, unknown> = {}) => ({
    hook_event_name: 'Notification',
    session_id: 'test-session-123',
    transcript_path: 'C:\\Users\\test\\.claude\\sessions\\test-session-123.json',
    cwd: 'C:\\Users\\test\\project',
    notification: {
      type: 'info',
      message: 'Test notification',
    },
    permission_mode: 'default',
    ...overrides,
  }),
};
