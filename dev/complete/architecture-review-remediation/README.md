# Architecture Review Remediation - Implementation Plan

## Overview

Address all 18 security and quality issues identified in the architectural review of the Claude Code hooks viewer implementation. Fixes 6 critical security vulnerabilities, 4 high-priority issues, 4 medium-priority gaps, and 2 low-priority improvements.

## Quick Start

1. Run features in order using manifest.jsonl
2. Each prompt is self-contained with context
3. Verify after each feature before proceeding

```bash
# Start with initialization
# Read init.md and follow instructions

# Then proceed through prompts in order
# prompts/01-security-utils.md -> prompts/15-handler-tests.md
```

## Files

| File | Purpose |
|------|---------|
| `manifest.jsonl` | Feature metadata for orchestration |
| `context.md` | Project rationale and architecture |
| `decisions.md` | Architectural decisions with rationale |
| `edge-cases.md` | Edge cases mapped to features |
| `testing-strategy.md` | Testing philosophy and patterns |
| `constraints.md` | Global rules for all prompts |
| `code/typescript.md` | Code samples (progressive disclosure) |
| `init.md` | Project initialization (F000) |
| `prompts/*.md` | Individual feature prompts (F001-F015) |

## Code Samples

The `code/` directory contains reusable code patterns organized by language:
- Each file uses hierarchical headings for progressive disclosure
- Reference specific sections via anchors: `code/typescript.md#security-utilities`
- Patterns are ordered from simple to complex within each file

## Feature Summary

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F000 | Project initialization | - | pending |
| F001 | Security utilities module | P0 | pending |
| F002 | Config hardening (localhost, port, deps) | P0/P3 | pending |
| F003 | CORS restriction | P0 | pending |
| F004 | Path traversal fix (/styles/) | P0 | pending |
| F005 | Path traversal fix (/api/plans/) | P0 | pending |
| F006 | Session ID validation | P0 | pending |
| F007 | Shutdown authentication | P0 | pending |
| F008 | CSP headers | P1 | pending |
| F009 | Promise error handling | P1 | pending |
| F010 | Catch block logging | P1 | pending |
| F011 | Handler error handling | P1 | pending |
| F012 | Rate limiting | P2 | pending |
| F013 | Input validation | P2 | pending |
| F014 | Security tests | P2 | pending |
| F015 | Handler execution tests | P2 | pending |

## Dependency Graph

```
F000 (init)
  └── F001 (security utils)
        ├── F002 (config) ── F003 (CORS) ── F008 (CSP)
        ├── F004 (styles path)
        ├── F005 (plans path)
        ├── F006 (session validation)
        ├── F007 (shutdown auth)
        └── F012 (rate limiting)

F009 (promise) ─────────────┐
F010 (catch logging) ───────┼── (can run in parallel)
F011 (handler errors) ──────┤
F013 (input validation) ────┘

F014 (security tests) ── depends on F001-F007, F012
F015 (handler tests) ── depends on F011
```

## Orchestration

Process manifest.jsonl line by line:

```bash
# Example: Read manifest and execute prompts
while IFS= read -r line; do
  file=$(echo "$line" | jq -r '.file')
  id=$(echo "$line" | jq -r '.id')
  echo "Processing $id: $file"
  # Execute prompt file with sub-agent
done < manifest.jsonl
```

## Feature Status

Track progress by updating status in manifest.jsonl:
- `pending` - Not started
- `in_progress` - Currently being implemented
- `completed` - Done and verified
- `failed` - Needs attention

## Verification Commands

```bash
cd .claude/hooks

# Type check
bun run tsc --noEmit

# Run all tests
bun run test:run

# Run security tests only
bun run test:run --grep "Security"

# Run handler tests only
bun run test:run --grep "Handler"
```

## Decision Log

See `decisions.md` for architectural choices and rationale:

| ID | Decision |
|----|----------|
| D001 | Bind to localhost by default |
| D002 | Simple token auth for shutdown |
| D003 | Regex-based path validation |
| D004 | Rate limit: 5 connections/60s |
| D005 | Console.error for catch blocks |
| D006 | Session ID: alphanumeric+hyphens, 64 chars |
| D007 | Plan names: ASCII alphanumeric only |
| D008 | URL-decode before validation |
| D009 | Handler safe default: { continue: true } |
| D010 | CSP with 'unsafe-inline' for Vue.js |

## Edge Cases

See `edge-cases.md` for handling details:

| ID | Case |
|----|------|
| EC001 | Encoded path traversal |
| EC002 | Null bytes in paths |
| EC003 | Long session IDs |
| EC004 | Unicode in plan names |
| EC005 | Rate limit bypass via headers |
| EC006 | Old log format compatibility |
| EC007 | Empty/whitespace inputs |
| EC008 | Case sensitivity (Windows) |
| EC009 | Symlink traversal |
| EC010 | Concurrent handler errors |
| EC011 | SSE client disconnection |
| EC012 | Auth token in URL |
