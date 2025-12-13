# Project Context

## Summary

Address all 18 security and quality issues identified in the architectural review of the Claude Code hooks viewer implementation. The review found critical security vulnerabilities including path traversal attacks, network exposure, and permissive CORS that must be remediated before production use.

**Why this matters:** The hooks viewer exposes session logs containing prompts, tool commands, and potentially sensitive data. Without proper security controls, attackers on the local network could read arbitrary files, steal session data via cross-origin requests, or shut down the viewer remotely.

## Architecture Vision

The remediation follows a defense-in-depth approach:

1. **Security Utilities First**: Create a centralized security module with path sanitization and session validation functions that all endpoints will use consistently.

2. **Network Hardening**: Bind to localhost only, restrict CORS to same-origin, and add token authentication for destructive operations.

3. **Input Validation Everywhere**: Validate all user inputs (paths, session IDs, plan names) before use, with proper encoding handling.

4. **Robust Error Handling**: Add proper error handling to all async operations and handlers to prevent silent failures and ensure graceful degradation.

5. **Protection Layer**: Add rate limiting to prevent resource exhaustion and CSP headers to mitigate XSS risks.

6. **Comprehensive Testing**: Add security-focused tests to prevent regression of fixed vulnerabilities.

## Goals

- Fix all 6 critical (P0) security vulnerabilities
- Address 4 high-priority (P1) error handling issues
- Implement 4 medium-priority (P2) protection measures
- Complete 2 low-priority (P3) maintenance improvements
- Maintain backward compatibility with existing log format
- Ensure cross-platform compatibility (Windows/Unix)

## Scope

**In Scope:**
- `.claude/hooks/viewer/` - Server, watcher, config files
- `.claude/hooks/handlers/` - All 12 hook handlers
- `.claude/hooks/utils/` - Logger and new validation utilities
- New test files for security and handler execution

**Out of Scope:**
- Log format changes (backward compatible)
- Vue.js frontend changes (except CSP-related)
- New features beyond security fixes
