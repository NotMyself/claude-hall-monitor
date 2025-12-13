# Edge Cases

| ID | Case | Handling | Affected Features |
|----|------|----------|-------------------|
| EC001 | Encoded path traversal (`%2e%2e`, `%2f`) | URL-decode input before validation. Reject if decoded path contains `..` or traverses outside base directory. | F004, F005 |
| EC002 | Null bytes in paths (`file%00.txt`) | Reject any path containing null bytes (`\x00`). These can truncate strings in some systems. | F004, F005 |
| EC003 | Very long session IDs (>64 chars) | Truncate or reject. Session IDs should be reasonable length; long IDs suggest injection attempt. | F006 |
| EC004 | Unicode in plan names | Reject non-ASCII characters. Plan names are internal identifiers; restrict to `[a-zA-Z0-9_-]`. | F005 |
| EC005 | Rate limit bypass via X-Forwarded-For | Use connection IP directly, not X-Forwarded-For header. No reverse proxy in front of local dev server. | F012 |
| EC006 | Existing log files with old format | No schema changes needed. All fixes are in server code. Existing JSONL logs remain compatible. | F009, F010 |
| EC007 | Empty or whitespace-only inputs | Treat as invalid. Empty session ID, empty path component, or whitespace-only strings should be rejected. | F004, F005, F006 |
| EC008 | Case sensitivity in paths (Windows) | Use case-insensitive comparison for file extensions on Windows. Path traversal checks should be case-insensitive. | F004, F005 |
| EC009 | Symlink traversal | Security utilities use regex-based validation (D003) which doesn't resolve symlinks. This is intentional to avoid complexity. | F004, F005 |
| EC010 | Concurrent handler errors | Each handler process is independent. Top-level catch ensures valid JSON output even if concurrent handlers fail. | F011 |
| EC011 | SSE client disconnection during write | Catch errors in SSE controller.enqueue(). Already handled but should log, not silently swallow. | F010 |
| EC012 | Auth token in browser URL | Token passed via Authorization header, not URL. Prevents token leakage in browser history/logs. | F007 |
