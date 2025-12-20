# Feature: F003 - Install and Configure shadcn/ui

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project structure initialized
- **F001**: Vite + React configured
- **F002**: Tailwind CSS configured with custom theme

## Objective

Install and configure shadcn/ui component library with the cn() utility helper.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D010**: shadcn/ui component library — Provides accessible, composable primitives with Tailwind integration

## Code References

Read these sections before implementing:
- `code/html.md#components-json` - shadcn/ui configuration
- `code/typescript.md#utilities` - cn() helper function

## Constraints

- See `constraints.md` for global rules
- Use shadcn/ui CLI for setup
- Do not manually create UI components yet (that happens in later features)

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `hooks/viewer/components.json` | shadcn/ui configuration |
| `hooks/viewer/src/lib/utils.ts` | cn() utility for class merging |

## Implementation Details

### components.json

Configure shadcn/ui:
- Style: `default`
- Base color: Custom (terracotta)
- CSS variables: `true`
- TypeScript: `true`
- Path aliases: `@/components`, `@/lib`, etc.

### utils.ts

Create cn() helper:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Acceptance Criteria

- [ ] `components.json` configured
- [ ] `src/lib/utils.ts` created with cn() helper
- [ ] shadcn/ui dependencies installed
- [ ] Configuration uses path aliases

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
# Should compile without errors
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat(viewer): install and configure shadcn/ui

Set up shadcn/ui component library with configuration for custom
terracotta theme. Created cn() utility for class name merging.

Implements: F003
Decisions: D010

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/04-react-router.md` (F004)
