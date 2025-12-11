# Feature: F07 - Unit Tests for New Features

## Context

F01-F06 are complete. All UI features have been implemented. Now we need to add unit tests.

## Objective

Add unit tests for the new functionality introduced in F02-F06.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify the test file listed below
- Use existing test patterns and setup
- Tests should be deterministic and not rely on timing

## Files to Modify

- `.claude/hooks/viewer/__tests__/components.test.ts`

## Implementation Details

### 1. Test for reverse ordering (F02)

```typescript
describe('LogViewer - Reverse Order', () => {
  it('should display entries in reverse chronological order', () => {
    // Create entries with timestamps
    const entries = [
      { timestamp: '2024-01-01T10:00:00Z', event: 'SessionStart', session_id: '1' },
      { timestamp: '2024-01-01T11:00:00Z', event: 'PreToolUse', session_id: '1' },
      { timestamp: '2024-01-01T12:00:00Z', event: 'PostToolUse', session_id: '1' },
    ];

    // Mount component with entries
    // Verify first entry in DOM is the newest (12:00)
  });
});
```

### 2. Test for event summaries (F03)

```typescript
describe('LogEntry - getSummary', () => {
  const testCases = [
    {
      event: 'UserPromptSubmit',
      data: { prompt: 'Hello world this is a very long prompt that should be truncated' },
      expected: 'Hello world this is a very long prompt that shou...'
    },
    {
      event: 'PreToolUse',
      data: { tool_name: 'Read' },
      expected: 'Read'
    },
    {
      event: 'PostToolUse',
      data: { tool_name: 'Write', error: null },
      expected: 'Write ✓'
    },
    {
      event: 'PostToolUse',
      data: { tool_name: 'Bash', error: 'Command failed' },
      expected: 'Bash ✗'
    },
    {
      event: 'PostToolUseFailure',
      data: { tool_name: 'Edit', error: 'File not found' },
      expected: 'Edit - File not found'
    },
    {
      event: 'SessionStart',
      data: {},
      session_id: 'abc123def456',
      expected: 'Session: abc123def456'
    },
    {
      event: 'SubagentStart',
      data: { subagent_type: 'Explore' },
      expected: 'Explore'
    },
    {
      event: 'Notification',
      data: { message: 'Task completed successfully' },
      expected: 'Task completed successfully'
    },
    {
      event: 'PermissionRequest',
      data: { permission_type: 'file_write' },
      expected: 'file_write'
    },
    {
      event: 'PreCompact',
      data: { reason: 'Context limit reached' },
      expected: 'Context limit reached'
    },
    {
      event: 'Stop',
      data: { reason: 'User pressed Ctrl+C' },
      expected: 'User pressed Ctrl+C'
    }
  ];

  testCases.forEach(({ event, data, session_id, expected }) => {
    it(`should return correct summary for ${event}`, () => {
      const entry = { event, data, session_id: session_id || 'test' };
      // Mount log-entry component and verify getSummary output
    });
  });
});
```

### 3. Test for JSON syntax highlighting (F04)

```typescript
describe('LogEntry - syntaxHighlight', () => {
  it('should highlight JSON keys', () => {
    const json = '{"name": "test"}';
    // Verify output contains span with json-key class
  });

  it('should highlight JSON strings', () => {
    const json = '{"name": "test"}';
    // Verify output contains span with json-string class
  });

  it('should highlight JSON numbers', () => {
    const json = '{"count": 42}';
    // Verify output contains span with json-number class
  });

  it('should highlight JSON booleans', () => {
    const json = '{"active": true}';
    // Verify output contains span with json-boolean class
  });

  it('should highlight JSON null', () => {
    const json = '{"value": null}';
    // Verify output contains span with json-null class
  });

  it('should escape HTML entities', () => {
    const json = '{"html": "<script>alert(1)</script>"}';
    // Verify < and > are escaped as &lt; and &gt;
  });
});
```

### 4. Test for event filter dropdown (F05)

```typescript
describe('EventFilterDropdown', () => {
  const allEvents = [
    'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
    'SessionStart', 'SessionEnd', 'SubagentStart', 'SubagentStop',
    'Notification', 'PermissionRequest', 'PreCompact', 'Stop'
  ];

  it('should show "All Events" when all are selected', () => {
    // Mount with modelValue = allEvents
    // Verify button text is "All Events"
  });

  it('should show "No Events" when none are selected', () => {
    // Mount with modelValue = []
    // Verify button text is "No Events"
  });

  it('should show event name when one is selected', () => {
    // Mount with modelValue = ['PreToolUse']
    // Verify button text is "PreToolUse"
  });

  it('should show count when multiple but not all selected', () => {
    // Mount with modelValue = ['PreToolUse', 'PostToolUse', 'Notification']
    // Verify button text is "3 Events"
  });

  it('should toggle dropdown on click', () => {
    // Click trigger button
    // Verify panel is visible
    // Click again
    // Verify panel is hidden
  });

  it('should select all on Select All click', () => {
    // Click Select All
    // Verify emit with all events
  });

  it('should clear all on Clear click', () => {
    // Click Clear
    // Verify emit with empty array
  });
});
```

## Acceptance Criteria

- [ ] Test for reverse ordering behavior added
- [ ] Test for getSummary per event type added (all 12 types covered)
- [ ] Test for JSON syntax highlighting regex added
- [ ] Test for event filter dropdown label logic added
- [ ] Test for dropdown open/close behavior added
- [ ] Test for Select All / Clear buttons added
- [ ] All new tests pass
- [ ] All existing tests still pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

All tests should pass with no failures.

## Commit

```bash
git add .claude/hooks/viewer/__tests__/components.test.ts
git commit -m "$(cat <<'EOF'
test(viewer): add unit tests for new UI features

- Add tests for reverse log ordering
- Add tests for event-specific summary generation
- Add tests for JSON syntax highlighting
- Add tests for event filter dropdown component

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/08-e2e-validation.md`
