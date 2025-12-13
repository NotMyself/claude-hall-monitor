# Architectural Decisions

| ID | Decision | Rationale | Affected Features |
|----|----------|-----------|-------------------|
| D001 | Bind to localhost (127.0.0.1) by default | Primary use is local development; single-user tool doesn't need network access. Override via `HOOK_VIEWER_HOST` env var if needed. | F002 |
| D002 | Simple token authentication for /shutdown | Matches project scope as single-user development tool. Token generated on startup and printed to console. No need for OAuth/JWT complexity. | F007 |
| D003 | Regex-based path validation over path.resolve() | More predictable behavior; cross-platform consistent. Avoids symlink resolution edge cases. Explicitly reject `..`, encoded traversal, and null bytes. | F001, F004, F005 |
| D004 | Rate limit of 5 SSE connections per IP in 60s window | Reasonable for single-user; prevents runaway reconnects from browser tabs. Not designed to stop malicious actors (that's what localhost binding is for). | F012 |
| D005 | Console.error for catch blocks | Matches existing logging pattern in the codebase. Low overhead, sufficient for debugging. Doesn't require structured log changes. | F010 |
| D006 | Session ID format: alphanumeric, hyphens, max 64 chars | Aligns with Claude Code's session ID format. Rejects injection attempts while allowing valid IDs. | F001, F006 |
| D007 | ASCII alphanumeric only for plan names | Prevents Unicode normalization attacks and path confusion. Plan names are internal identifiers, not user-facing. | F001, F005 |
| D008 | Decode URL-encoded paths before validation | Attackers use %2e%2e to bypass naive path checks. Must decode first, then validate. | F001, F004, F005 |
| D009 | Top-level try/catch with safe default output | Handlers must always produce valid JSON. If handler crashes, output `{ continue: true }` as safe default so Claude Code continues. | F011 |
| D010 | CSP with 'self' and 'unsafe-inline' for styles | Vue.js single-file component uses inline styles. Can't use strict CSP without major refactor. Focus on script restrictions. | F008 |
