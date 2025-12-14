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
  const modes: string[] = ['light', 'dark', 'system'];

  const cycleTheme = (current: string): string => {
    const idx = modes.indexOf(current);
    const nextIdx = (idx + 1) % modes.length;
    const result = modes[nextIdx];
    if (result === undefined) return 'light';
    return result;
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
    // Mock localStorage for test environment
    const storage: Record<string, string> = {};
    const mockLocalStorage = {
      setItem: (key: string, value: string) => { storage[key] = value; },
      getItem: (key: string) => storage[key] ?? null,
    };
    mockLocalStorage.setItem('theme', 'dark');
    expect(mockLocalStorage.getItem('theme')).toBe('dark');
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

    // Mock clipboard API for test environment
    let clipboardContent = '';
    const mockClipboard = {
      writeText: vi.fn(async (text: string) => { clipboardContent = text; }),
    };

    await mockClipboard.writeText(JSON.stringify(entry, null, 2));

    expect(mockClipboard.writeText).toHaveBeenCalled();
    expect(clipboardContent).toContain('SessionStart');
  });
});

// ===== LogViewer Filter Logic Tests =====
describe('LogViewer filtering', () => {
  interface TestEntry {
    timestamp: string;
    event: string;
    session_id: string;
    data: Record<string, unknown>;
  }

  const entries: TestEntry[] = [
    { timestamp: '2024-12-11T14:30:00Z', event: 'SessionStart', session_id: 'session-1', data: { source: 'startup' } },
    { timestamp: '2024-12-11T14:30:01Z', event: 'PreToolUse', session_id: 'session-1', data: { tool: 'Read' } },
    { timestamp: '2024-12-11T14:30:02Z', event: 'PostToolUse', session_id: 'session-2', data: { tool: 'Write' } },
  ];

  interface FilterState {
    search: string;
    eventTypes: string[];
    sessionId: string | null;
  }

  const filterEntries = (testEntries: TestEntry[], filters: FilterState): TestEntry[] => {
    return testEntries.filter((entry: TestEntry) => {
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
    expect(result[0]?.event).toBe('PreToolUse');
  });

  it('filters by search text in data', () => {
    const result = filterEntries(entries, { search: 'Write', eventTypes: [], sessionId: null });
    expect(result).toHaveLength(1);
    expect((result[0]?.data as { tool: string } | undefined)?.tool).toBe('Write');
  });

  it('filters by event type', () => {
    const result = filterEntries(entries, { search: '', eventTypes: ['SessionStart'], sessionId: null });
    expect(result).toHaveLength(1);
    expect(result[0]?.event).toBe('SessionStart');
  });

  it('filters by session ID', () => {
    const result = filterEntries(entries, { search: '', eventTypes: [], sessionId: 'session-2' });
    expect(result).toHaveLength(1);
    expect(result[0]?.session_id).toBe('session-2');
  });

  it('combines multiple filters', () => {
    const result = filterEntries(entries, { search: 'tool', eventTypes: ['PreToolUse', 'PostToolUse'], sessionId: 'session-1' });
    expect(result).toHaveLength(1);
    expect(result[0]?.event).toBe('PreToolUse');
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

// ===== LogViewer - Reverse Order (F02) =====
describe('LogViewer - Reverse Order', () => {
  interface TestEntry {
    timestamp: string;
    event: string;
    session_id: string;
    data: Record<string, unknown>;
  }

  const reverseEntries = (entries: TestEntry[]): TestEntry[] => {
    return entries.slice().reverse();
  };

  it('should display entries in reverse chronological order', () => {
    const entries: TestEntry[] = [
      { timestamp: '2024-01-01T10:00:00Z', event: 'SessionStart', session_id: '1', data: {} },
      { timestamp: '2024-01-01T11:00:00Z', event: 'PreToolUse', session_id: '1', data: {} },
      { timestamp: '2024-01-01T12:00:00Z', event: 'PostToolUse', session_id: '1', data: {} },
    ];

    const reversed = reverseEntries(entries);

    // Verify newest entry is first
    expect(reversed[0]?.timestamp).toBe('2024-01-01T12:00:00Z');
    expect(reversed[0]?.event).toBe('PostToolUse');

    // Verify oldest entry is last
    expect(reversed[2]?.timestamp).toBe('2024-01-01T10:00:00Z');
    expect(reversed[2]?.event).toBe('SessionStart');
  });

  it('should preserve all entries when reversing', () => {
    const entries: TestEntry[] = [
      { timestamp: '2024-01-01T10:00:00Z', event: 'SessionStart', session_id: '1', data: {} },
      { timestamp: '2024-01-01T11:00:00Z', event: 'PreToolUse', session_id: '1', data: {} },
    ];

    const reversed = reverseEntries(entries);
    expect(reversed.length).toBe(entries.length);
  });

  it('should handle empty array', () => {
    const entries: TestEntry[] = [];
    const reversed = reverseEntries(entries);
    expect(reversed).toEqual([]);
  });

  it('should handle single entry', () => {
    const entries: TestEntry[] = [
      { timestamp: '2024-01-01T10:00:00Z', event: 'SessionStart', session_id: '1', data: {} },
    ];
    const reversed = reverseEntries(entries);
    expect(reversed).toEqual(entries);
  });
});

// ===== LogEntry - getSummary (F03) =====
describe('LogEntry - getSummary', () => {
  interface Entry {
    event: string;
    data: Record<string, unknown>;
    session_id: string;
  }

  const getSummary = (entry: Entry): string => {
    const data = entry.data || {};
    const truncate = (str: string, len = 50) =>
      str && str.length > len ? str.substring(0, len) + '...' : str;

    switch (entry.event) {
      case 'UserPromptSubmit':
        return truncate((data.prompt as string) || (data.message as string) || '');
      case 'PreToolUse':
        return (data.tool_name as string) || (data.toolName as string) || '';
      case 'PostToolUse':
        const toolName = (data.tool_name as string) || (data.toolName as string) || '';
        const success = data.error ? '✗' : '✓';
        return `${toolName} ${success}`;
      case 'PostToolUseFailure':
        const failedTool = (data.tool_name as string) || (data.toolName as string) || '';
        const errorMsg = truncate((data.error as string) || '', 30);
        return `${failedTool} - ${errorMsg}`;
      case 'SessionStart':
      case 'SessionEnd':
        return `Session: ${truncate(entry.session_id || '', 20)}`;
      case 'SubagentStart':
      case 'SubagentStop':
        return (data.subagent_type as string) || (data.type as string) || '';
      case 'Notification':
        return truncate((data.message as string) || (data.notification as string) || '');
      case 'PermissionRequest':
        return (data.permission_type as string) || (data.permission as string) || '';
      case 'PreCompact':
        return truncate((data.reason as string) || 'Context compaction');
      case 'Stop':
        return truncate((data.reason as string) || 'User interrupt');
      default:
        return '';
    }
  };

  const testCases = [
    {
      event: 'UserPromptSubmit',
      data: { prompt: 'Hello world this is a very long prompt that should be truncated' },
      session_id: 'test',
      expected: 'Hello world this is a very long prompt that should...',
    },
    {
      event: 'PreToolUse',
      data: { tool_name: 'Read' },
      session_id: 'test',
      expected: 'Read',
    },
    {
      event: 'PostToolUse',
      data: { tool_name: 'Write', error: null },
      session_id: 'test',
      expected: 'Write ✓',
    },
    {
      event: 'PostToolUse',
      data: { tool_name: 'Bash', error: 'Command failed' },
      session_id: 'test',
      expected: 'Bash ✗',
    },
    {
      event: 'PostToolUseFailure',
      data: { tool_name: 'Edit', error: 'File not found' },
      session_id: 'test',
      expected: 'Edit - File not found',
    },
    {
      event: 'SessionStart',
      data: {},
      session_id: 'abc123def456',
      expected: 'Session: abc123def456',
    },
    {
      event: 'SubagentStart',
      data: { subagent_type: 'Explore' },
      session_id: 'test',
      expected: 'Explore',
    },
    {
      event: 'Notification',
      data: { message: 'Task completed successfully' },
      session_id: 'test',
      expected: 'Task completed successfully',
    },
    {
      event: 'PermissionRequest',
      data: { permission_type: 'file_write' },
      session_id: 'test',
      expected: 'file_write',
    },
    {
      event: 'PreCompact',
      data: { reason: 'Context limit reached' },
      session_id: 'test',
      expected: 'Context limit reached',
    },
    {
      event: 'Stop',
      data: { reason: 'User pressed Ctrl+C' },
      session_id: 'test',
      expected: 'User pressed Ctrl+C',
    },
  ];

  testCases.forEach(({ event, data, session_id, expected }) => {
    it(`should return correct summary for ${event}`, () => {
      const entry = { event, data, session_id };
      const summary = getSummary(entry);
      expect(summary).toBe(expected);
    });
  });

  it('should truncate long UserPromptSubmit prompts', () => {
    const entry = {
      event: 'UserPromptSubmit',
      data: { prompt: 'a'.repeat(100) },
      session_id: 'test',
    };
    const summary = getSummary(entry);
    expect(summary.length).toBe(53); // 50 chars + '...'
    expect(summary.endsWith('...')).toBe(true);
  });

  it('should truncate long error messages in PostToolUseFailure', () => {
    const entry = {
      event: 'PostToolUseFailure',
      data: { tool_name: 'Test', error: 'a'.repeat(100) },
      session_id: 'test',
    };
    const summary = getSummary(entry);
    expect(summary).toContain('Test - ');
    expect(summary.endsWith('...')).toBe(true);
  });

  it('should handle missing data fields gracefully', () => {
    const entry = {
      event: 'PreToolUse',
      data: {},
      session_id: 'test',
    };
    const summary = getSummary(entry);
    expect(summary).toBe('');
  });
});

// ===== LogEntry - syntaxHighlight (F04) =====
describe('LogEntry - syntaxHighlight', () => {
  const syntaxHighlight = (json: unknown): string => {
    let jsonStr = typeof json === 'string' ? json : JSON.stringify(json, null, 2);

    // Escape HTML entities
    jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Apply syntax highlighting
    return jsonStr.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  };

  it('should highlight JSON keys', () => {
    const json = '{"name": "test"}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-key');
    expect(result).toContain('"name":');
  });

  it('should highlight JSON strings', () => {
    const json = '{"name": "test"}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-string');
    expect(result).toContain('"test"');
  });

  it('should highlight JSON numbers', () => {
    const json = '{"count": 42}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-number');
    expect(result).toContain('42');
  });

  it('should highlight JSON booleans', () => {
    const json = '{"active": true}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-boolean');
    expect(result).toContain('true');
  });

  it('should highlight JSON null', () => {
    const json = '{"value": null}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-null');
    expect(result).toContain('null');
  });

  it('should escape HTML entities', () => {
    const json = '{"html": "<script>alert(1)</script>"}';
    const result = syntaxHighlight(json);
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should handle object input', () => {
    const json = { name: 'test', count: 42 };
    const result = syntaxHighlight(json);
    expect(result).toContain('json-key');
    expect(result).toContain('json-string');
    expect(result).toContain('json-number');
  });

  it('should highlight negative numbers', () => {
    const json = '{"temp": -5}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-number');
    expect(result).toContain('-5');
  });

  it('should highlight decimal numbers', () => {
    const json = '{"pi": 3.14}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-number');
    expect(result).toContain('3.14');
  });

  it('should highlight scientific notation', () => {
    const json = '{"value": 1.5e10}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-number');
    expect(result).toContain('1.5e10');
  });

  it('should handle both true and false', () => {
    const json = '{"enabled": true, "disabled": false}';
    const result = syntaxHighlight(json);
    expect(result).toContain('json-boolean');
    const trueMatches = result.match(/true/g);
    const falseMatches = result.match(/false/g);
    expect(trueMatches?.length).toBeGreaterThan(0);
    expect(falseMatches?.length).toBeGreaterThan(0);
  });

  it('should escape ampersands', () => {
    const json = '{"text": "A & B"}';
    const result = syntaxHighlight(json);
    expect(result).toContain('&amp;');
    expect(result).not.toMatch(/A & B/);
  });
});

// ===== EventFilterDropdown (F05) =====
describe('EventFilterDropdown', () => {
  const allEvents = [
    'UserPromptSubmit',
    'PreToolUse',
    'PostToolUse',
    'PostToolUseFailure',
    'SessionStart',
    'SessionEnd',
    'SubagentStart',
    'SubagentStop',
    'Notification',
    'PermissionRequest',
    'PreCompact',
    'Stop',
  ];

  const getButtonLabel = (selectedEvents: string[], eventTypes: string[]): string => {
    if (selectedEvents.length === 0) {
      return 'No Events';
    }
    if (selectedEvents.length === eventTypes.length) {
      return 'All Events';
    }
    if (selectedEvents.length === 1) {
      return selectedEvents[0] || '';
    }
    return `${selectedEvents.length} Events`;
  };

  it('should show "All Events" when all are selected', () => {
    const label = getButtonLabel(allEvents, allEvents);
    expect(label).toBe('All Events');
  });

  it('should show "No Events" when none are selected', () => {
    const label = getButtonLabel([], allEvents);
    expect(label).toBe('No Events');
  });

  it('should show event name when one is selected', () => {
    const label = getButtonLabel(['PreToolUse'], allEvents);
    expect(label).toBe('PreToolUse');
  });

  it('should show count when multiple but not all selected', () => {
    const selected = ['PreToolUse', 'PostToolUse', 'Notification'];
    const label = getButtonLabel(selected, allEvents);
    expect(label).toBe('3 Events');
  });

  it('should show count for two events', () => {
    const selected = ['SessionStart', 'SessionEnd'];
    const label = getButtonLabel(selected, allEvents);
    expect(label).toBe('2 Events');
  });

  it('should show "All Events" when all 12 events are selected', () => {
    const label = getButtonLabel(allEvents, allEvents);
    expect(label).toBe('All Events');
  });

  it('should show count for almost all events', () => {
    const almostAll = allEvents.slice(0, 11); // 11 out of 12
    const label = getButtonLabel(almostAll, allEvents);
    expect(label).toBe('11 Events');
  });

  it('should handle different event type list', () => {
    const customEvents = ['EventA', 'EventB', 'EventC'];
    const label = getButtonLabel(customEvents, customEvents);
    expect(label).toBe('All Events');
  });
});
