# Feature: F002 - Configure Tailwind CSS with Custom Theme

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project structure initialized
- **F001**: Vite + React configured

## Objective

Configure Tailwind CSS with the warm terracotta color palette to maintain visual consistency with the existing viewer.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D006**: Preserve warm terracotta color palette — Maintains consistency with existing viewer aesthetic
- **D008**: Specific color semantics — Blue for running, green for complete, red for failed, gray for pending

## Code References

Read these sections before implementing:
- `code/css.md#theme-configuration` - Tailwind config with custom colors
- `code/css.md#color-system` - Color palette values

## Constraints

- See `constraints.md` for global rules
- Use exact color values from existing viewer
- Support both light and dark themes
- Configure path aliases for imports

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `hooks/viewer/tailwind.config.ts` | Tailwind configuration with custom theme |
| `hooks/viewer/postcss.config.js` | PostCSS configuration |
| `hooks/viewer/src/index.css` | Tailwind imports and global styles |
| `hooks/viewer/tsconfig.json` | Add path aliases |

## Implementation Details

### Tailwind Config

Configure custom colors:
- Primary: `#D4A27F` (terracotta)
- Background light: `#FDFDF7`
- Background dark: `#09090B`
- Success: `#10B981` (green)
- Running: `#3B82F6` (blue with pulse animation)
- Failed: `#EF4444` (red)
- Pending: `#9CA3AF` (gray)

### Path Aliases

Configure in tsconfig.json:
```json
{
  "@/*": ["./src/*"]
}
```

## Acceptance Criteria

- [ ] Tailwind CSS configured with custom color palette
- [ ] PostCSS configured for Tailwind processing
- [ ] index.css imports Tailwind directives
- [ ] Path aliases configured in tsconfig.json
- [ ] Dark mode support enabled
- [ ] Custom colors match existing viewer

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run dev
# Verify Tailwind processes correctly (no errors in console)
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat(viewer): configure Tailwind CSS with custom theme

Set up Tailwind CSS with warm terracotta color palette matching
existing viewer aesthetic. Configured dark mode support and custom
status colors for plan monitoring.

Implements: F002
Decisions: D006, D008

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/03-shadcn-setup.md` (F003)
