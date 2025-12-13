# Feature: F002 - Configuration Security Hardening

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project initialization verified
- **F001**: Security utilities module created

## Objective

Harden server configuration by binding to localhost only, making the port configurable via environment variable, and pinning the @types/bun dependency version.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D001**: Bind to localhost (127.0.0.1) by default. Override via `HOOK_VIEWER_HOST` env var if needed.

## Edge Cases to Handle

From `edge-cases.md`:
- No specific edge cases for configuration changes.

## Code References

No code samples needed - straightforward config changes.

## Constraints

- See `constraints.md` for global rules
- Maintain backward compatibility for existing env var usage
- Don't change any server logic, only config values

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/config.ts` | Change HOST from "0.0.0.0" to "127.0.0.1", add env var support for PORT |
| `.claude/hooks/package.json` | Pin @types/bun to specific version |

## Implementation Details

### config.ts changes

```typescript
// Before
HOST: "0.0.0.0",

// After
HOST: process.env.HOOK_VIEWER_HOST || "127.0.0.1",
```

```typescript
// Before
PORT: 3456,

// After
PORT: parseInt(process.env.HOOK_VIEWER_PORT || "3456", 10),
```

### package.json changes

Find the current @types/bun version and pin it:

```json
// Before
"@types/bun": "latest"

// After (use actual installed version)
"@types/bun": "^1.1.14"
```

Check the installed version with: `bun pm ls @types/bun`

## Acceptance Criteria

- [ ] HOST defaults to "127.0.0.1" instead of "0.0.0.0"
- [ ] HOST can be overridden via HOOK_VIEWER_HOST env var
- [ ] PORT can be overridden via HOOK_VIEWER_PORT env var
- [ ] @types/bun is pinned to a specific version (not "latest")
- [ ] TypeScript compiles without errors
- [ ] Server still starts correctly (manual verification)

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/config.ts .claude/hooks/package.json
git commit -m "$(cat <<'EOF'
feat(viewer): harden server configuration

- Bind to localhost (127.0.0.1) by default instead of 0.0.0.0
- Add HOOK_VIEWER_HOST env var for override
- Add HOOK_VIEWER_PORT env var for port configuration
- Pin @types/bun to specific version

Implements: F002
Decisions: D001

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/03-cors-restriction.md` (F003)
