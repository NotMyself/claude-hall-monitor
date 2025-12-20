# Feature: F004 - Set Up React Router

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F002**: Project setup and styling configured
- **F003**: shadcn/ui configured

## Objective

Set up React Router with basic route structure for Overview, Plans, Sessions, and Settings pages.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D003**: Sidebar navigation layout — Routes correspond to sidebar nav items

## Code References

Read these sections before implementing:
- `code/typescript.md#react-router` - Router setup pattern
- `code/html.md#index-html` - Entry point setup

## Constraints

- See `constraints.md` for global rules
- Create placeholder page components (will be implemented in later features)
- Configure routes only - no navigation UI yet

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `hooks/viewer/index.html` | HTML entry point |
| `hooks/viewer/src/main.tsx` | React entry point with router |
| `hooks/viewer/src/App.tsx` | Root component with routes |
| `hooks/viewer/src/pages/overview.tsx` | Overview page placeholder |
| `hooks/viewer/src/pages/plans.tsx` | Plans page placeholder |
| `hooks/viewer/src/pages/sessions.tsx` | Sessions page placeholder |
| `hooks/viewer/src/pages/settings.tsx` | Settings page placeholder |

## Implementation Details

### Routes

- `/` → Overview (default)
- `/plans` → Plans
- `/sessions` → Sessions
- `/settings` → Settings

### Page Placeholders

Each page component should be minimal:
```typescript
export function OverviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  )
}
```

## Acceptance Criteria

- [ ] index.html created
- [ ] main.tsx sets up React with router
- [ ] App.tsx defines routes
- [ ] All four page components created as placeholders
- [ ] Navigation works between routes
- [ ] TypeScript compiles without errors

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
bun run dev
# Navigate to http://localhost:5173 and test route navigation
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat(viewer): set up React Router with page placeholders

Configure React Router with routes for Overview, Plans, Sessions,
and Settings pages. Created placeholder components for each page.

Implements: F004
Decisions: D003

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/05-typescript-types.md` (F005)
