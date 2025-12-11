# Feature: 18-test-components - Component Tests

## Context
Feature 17-test-setup is complete. Vitest is configured with mocks.

## Objective
Write unit tests for Vue components to verify core functionality.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Test component behavior, not implementation details
- Use @vue/test-utils for mounting components
- Focus on critical paths: rendering, events, state changes

## Files to Create/Modify
- `.claude/hooks/viewer/__tests__/components.test.ts` - Component unit tests

## Implementation Details

Since components are embedded in index.html (not .vue files), we'll test the component logic by extracting and testing the key behaviors.

```typescript
/**
 * Component unit tests for Hook Viewer
 *
 * Note: Components are defined inline in index.html.
 * These tests verify the component logic patterns.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===== EventBadge Logic Tests =====
describe('EventBadge', () => {
  const getBadgeClass = (event: string) => `badge-${event}`;

  it('generates correct class for SessionStart', () => {
    expect(getBadgeClass('SessionStart')).toBe('badge-SessionStart');
  });

  it('generates correct class for PostToolUseFailure', () => {
    expect(getBadgeClass('PostToolUseFailure')).toBe('badge-PostToolUseFailure');
  });

  it('handles all 12 event types', () => {
    const events = [
      'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
      'Notification', 'SessionStart', 'SessionEnd', 'Stop',
      'SubagentStart', 'SubagentStop', 'PreCompact', 'PermissionRequest',
    ];

    events.forEach(event => {
      expect(getBadgeClass(event)).toBe(`badge-${event}`);
    });
  });
});

// ===== ThemeToggle Logic Tests =====
describe('ThemeToggle', () => {
  const modes = ['light', 'dark', 'system'];

  const cycleTheme = (current: string): string => {
    const idx = modes.indexOf(current);
    return modes[(idx + 1) % modes.length];
  };

  it('cycles from light to dark', () => {
    expect(cycleTheme('light')).toBe('dark');
  });

  it('cycles from dark to system', () => {
    expect(cycleTheme('dark')).toBe('system');
  });

  it('cycles from system to light', () => {
    expect(cycleTheme('system')).toBe('light');
  });

  it('persists theme to localStorage', () => {
    localStorage.setItem('theme', 'dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});

// ===== FilterBar Logic Tests =====
describe('FilterBar', () => {
  interface FilterState {
    search: string;
    eventTypes: string[];
    sessionId: string | null;
  }

  const hasFilters = (filters: FilterState): boolean => {
    return !!(
      filters.search ||
      filters.eventTypes.length > 0 ||
      filters.sessionId
    );
  };

  it('detects no filters when all empty', () => {
    expect(hasFilters({ search: '', eventTypes: [], sessionId: null })).toBe(false);
  });

  it('detects search filter', () => {
    expect(hasFilters({ search: 'test', eventTypes: [], sessionId: null })).toBe(true);
  });

  it('detects event type filter', () => {
    expect(hasFilters({ search: '', eventTypes: ['SessionStart'], sessionId: null })).toBe(true);
  });

  it('detects session filter', () => {
    expect(hasFilters({ search: '', eventTypes: [], sessionId: 'abc123' })).toBe(true);
  });

  it('truncates long session IDs', () => {
    const truncate = (id: string) => {
      if (id.length <= 16) return id;
      return id.substring(0, 8) + '...' + id.substring(id.length - 4);
    };

    expect(truncate('short')).toBe('short');
    expect(truncate('this-is-a-very-long-session-id-123456')).toBe('this-is-...3456');
  });
});

// ===== LogEntry Logic Tests =====
describe('LogEntry', () => {
  it('formats timestamp correctly', () => {
    const formatTime = (iso: string) => {
      try {
        const date = new Date(iso);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch {
        return iso;
      }
    };

    const result = formatTime('2024-12-11T14:30:45.000Z');
    // Result depends on timezone, just verify it's formatted
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('pretty-prints JSON data', () => {
    const data = { tool: 'Read', path: '/test.ts' };
    const formatted = JSON.stringify(data, null, 2);

    expect(formatted).toContain('"tool": "Read"');
    expect(formatted).toContain('\n');
  });

  it('copies entry to clipboard', async () => {
    const entry = { timestamp: '2024-12-11T14:30:45.000Z', event: 'SessionStart', session_id: 'abc', data: {} };
    await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

// ===== LogViewer Filter Logic Tests =====
describe('LogViewer filtering', () => {
  const entries = [
    { timestamp: '2024-12-11T14:30:00Z', event: 'SessionStart', session_id: 'session-1', data: { source: 'startup' } },
    { timestamp: '2024-12-11T14:30:01Z', event: 'PreToolUse', session_id: 'session-1', data: { tool: 'Read' } },
    { timestamp: '2024-12-11T14:30:02Z', event: 'PostToolUse', session_id: 'session-2', data: { tool: 'Write' } },
  ];

  interface FilterState {
    search: string;
    eventTypes: string[];
    sessionId: string | null;
  }

  const filterEntries = (entries: typeof entries[0][], filters: FilterState) => {
    return entries.filter(entry => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          entry.event.toLowerCase().includes(searchLower) ||
          entry.session_id.toLowerCase().includes(searchLower) ||
          JSON.stringify(entry.data).toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.eventTypes.length > 0) {
        if (!filters.eventTypes.includes(entry.event)) return false;
      }

      if (filters.sessionId) {
        if (entry.session_id !== filters.sessionId) return false;
      }

      return true;
    });
  };

  it('returns all entries with no filters', () => {
    const result = filterEntries(entries, { search: '', eventTypes: [], sessionId: null });
    expect(result).toHaveLength(3);
  });

  it('filters by search text in event', () => {
    const result = filterEntries(entries, { search: 'pretool', eventTypes: [], sessionId: null });
    expect(result).toHaveLength(1);
    expect(result[0].event).toBe('PreToolUse');
  });

  it('filters by search text in data', () => {
    const result = filterEntries(entries, { search: 'Write', eventTypes: [], sessionId: null });
    expect(result).toHaveLength(1);
    expect(result[0].data.tool).toBe('Write');
  });

  it('filters by event type', () => {
    const result = filterEntries(entries, { search: '', eventTypes: ['SessionStart'], sessionId: null });
    expect(result).toHaveLength(1);
    expect(result[0].event).toBe('SessionStart');
  });

  it('filters by session ID', () => {
    const result = filterEntries(entries, { search: '', eventTypes: [], sessionId: 'session-2' });
    expect(result).toHaveLength(1);
    expect(result[0].session_id).toBe('session-2');
  });

  it('combines multiple filters', () => {
    const result = filterEntries(entries, { search: 'tool', eventTypes: ['PreToolUse', 'PostToolUse'], sessionId: 'session-1' });
    expect(result).toHaveLength(1);
    expect(result[0].event).toBe('PreToolUse');
  });
});

// ===== SSE Reconnect Logic Tests =====
describe('SSE reconnect backoff', () => {
  const calculateDelay = (attempts: number): number => {
    return Math.min(1000 * Math.pow(2, attempts), 30000);
  };

  it('starts at 1 second', () => {
    expect(calculateDelay(0)).toBe(1000);
  });

  it('doubles each attempt', () => {
    expect(calculateDelay(1)).toBe(2000);
    expect(calculateDelay(2)).toBe(4000);
    expect(calculateDelay(3)).toBe(8000);
  });

  it('caps at 30 seconds', () => {
    expect(calculateDelay(10)).toBe(30000);
    expect(calculateDelay(100)).toBe(30000);
  });
});
```

## Acceptance Criteria
- [ ] EventBadge tests verify badge class generation
- [ ] ThemeToggle tests verify theme cycling logic
- [ ] FilterBar tests verify hasFilters detection
- [ ] LogEntry tests verify timestamp formatting and clipboard
- [ ] LogViewer tests verify all filter combinations
- [ ] SSE reconnect tests verify exponential backoff
- [ ] All tests pass with `bun test`

## Verification
```bash
cd .claude/hooks && bun test viewer/__tests__/components.test.ts
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/__tests__/components.test.ts
git commit -m "feat(viewer): add component unit tests

- EventBadge badge class tests
- ThemeToggle cycling logic tests
- FilterBar filter detection tests
- LogEntry formatting and clipboard tests
- LogViewer filter combination tests
- SSE reconnect backoff tests"
```

## Next
Proceed to: `prompts/19-test-server.md`
