# Feature: F009 - Marketplace Registration Preparation

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F008**: Plugin complete with CI/CD and E2E tests

## Objective

Prepare the marketplace registration entry and document the submission process for claude-dotnet-marketplace.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D001**: Repo renamed to `claude-hall-monitor` — Use this name in marketplace entry

## Edge Cases to Handle

None specific to this feature.

## Code References

Read these sections before implementing:
- `code/json.md#marketplace-entry` - marketplace.json format

## Constraints

- See `constraints.md` for global rules
- Marketplace entry goes in NotMyself/claude-dotnet-marketplace repo
- Do not push to marketplace repo directly - create PR

## Files to Create

| File | Purpose |
|------|---------|
| `marketplace-entry.json` | Template for marketplace submission |
| `CONTRIBUTING.md` | Submission instructions (optional) |

## Implementation Details

### marketplace-entry.json

Create this file as a template for PR to claude-dotnet-marketplace:

```json
{
  "name": "claude-hall-monitor",
  "description": "All 12 hook handlers with JSONL logging, realtime viewer UI, rules, and slash commands",
  "version": "1.0.0",
  "author": "NotMyself",
  "repository": "https://github.com/NotMyself/claude-hall-monitor",
  "homepage": "https://github.com/NotMyself/claude-hall-monitor#readme",
  "keywords": [
    "hooks",
    "logging",
    "viewer",
    "monitoring",
    "debugging",
    "bun"
  ],
  "runtime": "bun",
  "license": "MIT",
  "categories": [
    "development",
    "debugging",
    "monitoring"
  ],
  "features": [
    "12 hook handlers (SessionStart, SessionEnd, PreToolUse, etc.)",
    "Realtime log viewer with SSE streaming",
    "JSONL structured logging",
    "6 rules files for Claude Code guidance",
    "3 slash commands",
    "Cross-platform support (Windows, macOS, Linux)"
  ],
  "requirements": {
    "runtime": "bun >= 1.0.0"
  }
}
```

### Submission Process Documentation

Create `docs/marketplace-submission.md` or include in README:

```markdown
## Marketplace Submission

To add this plugin to the claude-dotnet-marketplace:

### 1. Fork the Marketplace Repository

```bash
git clone https://github.com/NotMyself/claude-dotnet-marketplace.git
cd claude-dotnet-marketplace
```

### 2. Add Plugin Entry

Edit `.claude-plugin/marketplace.json` and add:

```json
{
  "name": "claude-hall-monitor",
  "description": "All 12 hook handlers with JSONL logging, realtime viewer UI, rules, and slash commands",
  "repository": "https://github.com/NotMyself/claude-hall-monitor",
  "version": "1.0.0",
  "author": "NotMyself",
  "tags": ["hooks", "logging", "viewer", "monitoring", "bun"],
  "runtime": "bun"
}
```

### 3. Create Pull Request

```bash
git checkout -b add-claude-hall-monitor
git add .claude-plugin/marketplace.json
git commit -m "feat: add claude-hall-monitor plugin"
git push origin add-claude-hall-monitor
```

Then create a PR to the main repository.

### 4. Verification

The marketplace maintainers will:
- Verify the plugin repository exists
- Check that release artifacts are available
- Test installation process
- Merge if all checks pass
```

## Pre-Submission Checklist

Before submitting to marketplace, verify:

- [ ] Repository is public
- [ ] At least one GitHub release exists with zip artifact
- [ ] README has installation instructions
- [ ] LICENSE file exists
- [ ] Plugin works on Windows, macOS, Linux
- [ ] Bun runtime requirement is documented

## Acceptance Criteria

- [ ] `marketplace-entry.json` template created
- [ ] Submission process documented
- [ ] Pre-submission checklist completed
- [ ] Repository name matches marketplace entry

## Verification

```bash
# Validate marketplace entry JSON
cat marketplace-entry.json | jq '.'

# Verify required fields
jq -e '.name, .repository, .version, .runtime' marketplace-entry.json

# Check repo exists (after rename)
curl -s https://api.github.com/repos/NotMyself/claude-hall-monitor | jq '.name'
```

## Commit

```bash
git add marketplace-entry.json
git commit -m "docs: add marketplace submission template

Prepare marketplace.json entry for claude-dotnet-marketplace
Document submission process

Implements: F009
Decisions: D001"
```

## Next

Proceed to: `prompts/10-final-validation.md` (F010)
