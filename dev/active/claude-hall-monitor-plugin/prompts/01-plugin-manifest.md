# Feature: F001 - Create Plugin Manifest

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project restructured - files now at `hooks/`, `rules/`, `commands/`

## Objective

Create the `.claude-plugin/` directory with `plugin.json` metadata and initial `hooks.json` configuration.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D007**: Use `${CLAUDE_PLUGIN_ROOT}` in hook commands — Commands will reference bundled files via this variable

## Edge Cases to Handle

From `edge-cases.md`:
- **EC004**: Plugin variable not expanded at runtime → Use correct variable syntax

## Code References

Read these sections before implementing:
- `code/json.md#plugin-manifest` - plugin.json schema
- `code/json.md#hook-configurations` - hooks.json structure

## Constraints

- See `constraints.md` for global rules
- hooks.json should reference dist/ paths (bundles created in F004/F005)
- Use exact variable syntax: `${CLAUDE_PLUGIN_ROOT}`

## Files to Create

| File | Purpose |
|------|---------|
| `.claude-plugin/plugin.json` | Plugin metadata (name, version, description) |
| `.claude-plugin/hooks.json` | Hook configurations for all 12 hooks |

## Implementation Details

### plugin.json

```json
{
  "name": "claude-hall-monitor",
  "version": "1.0.0",
  "description": "All 12 hook handlers, realtime log viewer, rules, and slash commands for Claude Code",
  "author": "NotMyself",
  "repository": "https://github.com/NotMyself/claude-hall-monitor",
  "runtime": "bun",
  "keywords": ["hooks", "logging", "viewer", "monitoring"]
}
```

### hooks.json

Create hook entries for all 12 handlers. Each hook command should:
- Use `bun run` as the runtime
- Reference `${CLAUDE_PLUGIN_ROOT}/dist/handlers/<handler>.js`
- Use the "always" matcher for universal application

All 12 hooks to configure:
1. SessionStart
2. SessionEnd
3. UserPromptSubmit
4. PreToolUse
5. PostToolUse
6. PostToolUseFailure
7. Notification
8. Stop
9. SubagentStart
10. SubagentStop
11. PreCompact
12. PermissionRequest

## Acceptance Criteria

- [ ] `.claude-plugin/` directory exists
- [ ] `plugin.json` contains valid JSON with all required fields
- [ ] `hooks.json` contains all 12 hook configurations
- [ ] All hook commands use `${CLAUDE_PLUGIN_ROOT}` variable
- [ ] All hook commands reference `dist/handlers/*.js` paths

## Verification

```bash
# Verify directory exists
test -d .claude-plugin && echo "✓ .claude-plugin directory exists"

# Validate JSON syntax
cat .claude-plugin/plugin.json | jq '.' > /dev/null && echo "✓ plugin.json is valid JSON"
cat .claude-plugin/hooks.json | jq '.' > /dev/null && echo "✓ hooks.json is valid JSON"

# Check required fields in plugin.json
jq -e '.name, .version, .runtime' .claude-plugin/plugin.json > /dev/null && echo "✓ plugin.json has required fields"

# Count hooks (should be 12)
jq '.hooks[0].hooks | length' .claude-plugin/hooks.json
```

## Commit

```bash
git add .claude-plugin/
git commit -m "feat(plugin): add plugin manifest files

Create .claude-plugin/ with:
- plugin.json: Plugin metadata
- hooks.json: All 12 hook configurations

Implements: F001
Decisions: D007"
```

## Next

Proceed to: `prompts/02-build-system.md` (F002)
