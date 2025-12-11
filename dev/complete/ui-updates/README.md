# Hook Viewer UI Improvements - Implementation Plan

This directory contains an optimized implementation plan for improving the Claude Code hooks viewer UI.

## Overview

**Project**: Hook Viewer UI Improvements
**Features**: 6 UI enhancements + tests + E2E validation
**Approach**: One-feature-per-session with progressive disclosure

## Quick Start

### For Human Orchestrators

1. Run `init.md` to verify environment
2. Execute prompts in order: `prompts/01-*.md` through `prompts/08-*.md`
3. Track progress in `features.json`
4. Final validation with Playwright MCP

### For Automated Orchestration

```bash
# Read feature status
cat features.json | jq '.features[] | {id, status}'

# Execute next pending feature
# (Spawn Claude Code with the prompt file content)
```

## File Structure

```
dev/active/ui-updates/
├── README.md           # This file - orchestration guide
├── features.json       # Feature tracking with status
├── constraints.md      # Global rules for all agents
├── init.md             # Initializer prompt
├── plan.md             # Original spec (reference only)
└── prompts/
    ├── 01-theme-toggle-fix.md
    ├── 02-reverse-log-order.md
    ├── 03-event-summaries.md
    ├── 04-json-syntax-highlighting.md
    ├── 05-event-filter-dropdown.md
    ├── 06-toolbar-redesign.md
    ├── 07-unit-tests.md
    └── 08-e2e-validation.md
```

## Feature Dependencies (Layers)

```
Layer 1 (Foundation) - No dependencies
├── F01: Theme Toggle Fix
└── F02: Reverse Log Order

Layer 2 (Core Features) - Depends on Layer 1
├── F03: Event Summaries
└── F04: JSON Syntax Highlighting

Layer 3 (Complex Components) - Depends on Layer 2
├── F05: Event Filter Dropdown
└── F06: Toolbar Redesign

Layer 4 (Testing) - Depends on Layer 3
└── F07: Unit Tests

Layer 5 (Validation) - Depends on all layers
└── F08: E2E Validation
```

## Execution Order

| Step | Prompt File | Feature | Est. Complexity |
|------|-------------|---------|-----------------|
| 0 | `init.md` | Setup verification | Low |
| 1 | `prompts/01-theme-toggle-fix.md` | F01 | Low |
| 2 | `prompts/02-reverse-log-order.md` | F02 | Low |
| 3 | `prompts/03-event-summaries.md` | F03 | Medium |
| 4 | `prompts/04-json-syntax-highlighting.md` | F04 | Medium |
| 5 | `prompts/05-event-filter-dropdown.md` | F05 | High |
| 6 | `prompts/06-toolbar-redesign.md` | F06 | Medium |
| 7 | `prompts/07-unit-tests.md` | F07 | Medium |
| 8 | `prompts/08-e2e-validation.md` | F08 | Low |

## Parallelization Options

Some features can be implemented in parallel:

- **Parallel Set 1**: F01 + F02 (Layer 1 - no dependencies)
- **Parallel Set 2**: F03 + F04 (Layer 2 - only need Layer 1)
- **Parallel Set 3**: F05 + F06 (Layer 3 - need Layers 1-2)

Sequential requirements:
- F07 (tests) must come after F01-F06
- F08 (E2E) must come after F07

## Agent Instructions

Each prompt file is self-contained with:

1. **Context** - What was completed before
2. **Objective** - Single, clear goal
3. **Constraints** - What NOT to do
4. **Files to Modify** - Explicit file list
5. **Implementation Details** - Code snippets and patterns
6. **Acceptance Criteria** - Testable requirements
7. **Verification** - Command to run
8. **Commit** - Git commit instructions
9. **Next** - Pointer to next prompt

## Tracking Progress

Update `features.json` after each feature:

```json
{
  "id": "F01",
  "status": "completed"  // Change from "pending"
}
```

Status values:
- `pending` - Not started
- `in_progress` - Currently being implemented
- `completed` - Done and verified
- `failed` - Blocked, needs attention

## MCP Tools Available

### Playwright (E2E Testing)
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Accessibility tree (for interactions)
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_take_screenshot` - Visual capture
- `browser_console_messages` - Check JS errors

### Context7 (Documentation)
- `resolve-library-id` - Find library
- `get-library-docs` - Get docs

## Verification Commands

```bash
# Type check
cd .claude/hooks && bun run tsc --noEmit

# Run tests
cd .claude/hooks && bun run test:run

# Start viewer
cd .claude/hooks && bun run viewer

# Check viewer
curl http://localhost:3456
```

## Troubleshooting

### Viewer not starting
```bash
# Kill existing process
pkill -f "bun.*viewer"
# Restart
cd .claude/hooks && bun run viewer
```

### Tests failing
```bash
# Run with verbose output
cd .claude/hooks && bun run test:run --reporter=verbose
```

### Type errors
```bash
# Check specific file
cd .claude/hooks && bun run tsc --noEmit viewer/index.html
```

## Success Criteria

All features complete when:
1. All 8 features show `status: "completed"` in `features.json`
2. All unit tests pass
3. E2E validation screenshots confirm visual correctness
4. No JavaScript console errors

## References

- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Nielsen Norman: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
