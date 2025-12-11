# Log Viewer UI Updates - Optimized Plan

This directory contains an optimized implementation plan for fixing UI issues in the log viewer, designed for Claude Code sub-agents.

## Quick Start

Execute features in order using the `/orchestrate-plan` command:

```bash
/orchestrate-plan dev/active/ui-updates-2
```

Or manually run each prompt file sequentially.

## Feature Overview

| ID | Feature | Layer | Dependencies | Status |
|----|---------|-------|--------------|--------|
| UI-001 | Copy Button Dark Mode | 1 | None | Pending |
| UI-002 | JSON Path Cleanup | 2 | None | Pending |
| UI-003 | Session Dropdown Position | 1 | None | Pending |
| UI-004 | Footer Always Visible | 1 | None | Pending |
| UI-005 | E2E Validation | 3 | All above | Pending |

## Execution Order

### Layer 1 (Parallel - CSS/Layout)
These can be executed in parallel as they don't depend on each other:
- `01-copy-button-dark-mode.md` - Fix copy button text color
- `03-session-dropdown-position.md` - Reorder filter bar
- `04-footer-always-visible.md` - Flexbox layout for footer

### Layer 2 (JavaScript)
- `02-json-path-cleanup.md` - Add path cleanup function

### Layer 3 (Validation)
- `05-e2e-validation.md` - Playwright E2E tests

## Files Modified

| File | Features |
|------|----------|
| `.claude/hooks/viewer/styles/theme.css` | UI-001, UI-004 |
| `.claude/hooks/viewer/index.html` | UI-002, UI-003 |

## Directory Structure

```
ui-updates-2/
├── README.md           # This file
├── features.json       # Feature tracking
├── constraints.md      # Global rules
├── plan.md             # Original plan
└── prompts/
    ├── 01-copy-button-dark-mode.md
    ├── 02-json-path-cleanup.md
    ├── 03-session-dropdown-position.md
    ├── 04-footer-always-visible.md
    └── 05-e2e-validation.md
```

## Techniques Applied

### From Anthropic's Long-Running Agent Blog
- **Feature-List Scaffolding**: `features.json` with testable features
- **One-Feature-Per-Session**: Each prompt tackles exactly ONE feature
- **Git-Based State Management**: Commit instructions in each prompt
- **Testing-First Validation**: Playwright verification in each prompt

### From Progressive Disclosure UX
- **Ordered Complexity**: CSS fixes → JS logic → E2E validation
- **Reduce Cognitive Load**: Small, focused prompts
- **Context Preservation**: Each prompt references prior work
- **Layered Information**: Features grouped by dependency

## Verification

Each feature can be verified using the Playwright MCP:

```bash
# Start the viewer
cd .claude/hooks && bun run viewer

# Use Playwright MCP tools:
# - browser_navigate to http://host.docker.internal:3456
# - browser_snapshot for accessibility tree
# - browser_take_screenshot for visual verification
# - browser_evaluate for computed styles
```

## Completion Checklist

- [ ] UI-001: Copy button visible in dark mode
- [ ] UI-002: JSON paths use ~ and forward slashes
- [ ] UI-003: Session dropdown below search box
- [ ] UI-004: Footer always visible
- [ ] UI-005: All E2E tests pass
- [ ] All commits made with conventional format
- [ ] features.json updated to "completed"
