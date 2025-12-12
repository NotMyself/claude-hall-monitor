# Claude Dashboard - Implementation Plan

This directory contains an optimized implementation plan for the Claude Dashboard feature, designed for Claude Code sub-agents.

## Overview

Add a Dashboard tab to the viewer that displays:
- Session tracking with active/inactive/ended status
- Token usage statistics
- Configuration (commands, hooks, skills, MCP servers)

## Quick Start

```bash
# Run the orchestration command
/orchestrate-plan dev/active/dashboard
```

Or manually execute each prompt in order.

## Directory Structure

```
dev/active/dashboard/
├── README.md           # This file
├── features.json       # Feature tracking with status
├── constraints.md      # Global rules for all agents
├── init.md             # Initialization/verification prompt
├── plan.md             # Original implementation plan
└── prompts/
    ├── 01-types.md           # Layer 1: Type definitions
    ├── 02-config.md          # Layer 1: Configuration (parallel with 01)
    ├── 03-heartbeat.md       # Layer 2: Heartbeat function
    ├── 04-heartbeat-handlers.md  # Layer 2: Handler integration
    ├── 05-dashboard-service.md   # Layer 3: Data service
    ├── 06-api-endpoint.md    # Layer 3: API endpoint
    ├── 07-dashboard-styles.md    # Layer 4: CSS styles (parallel with 08)
    ├── 08-dashboard-component.md # Layer 4: Vue component
    ├── 09-unit-tests.md      # Layer 5: Unit tests
    └── 10-e2e-validation.md  # Layer 6: E2E validation
```

## Implementation Order

### Layer 1: Foundation (Parallel)
- `01-types.md` - Dashboard type definitions
- `02-config.md` - Dashboard configuration

### Layer 2: Heartbeat Infrastructure (Sequential)
- `03-heartbeat.md` - Heartbeat logging function
- `04-heartbeat-handlers.md` - Handler integration

### Layer 3: Backend (Sequential)
- `05-dashboard-service.md` - Data aggregation service
- `06-api-endpoint.md` - REST API endpoint

### Layer 4: Frontend (Parallel)
- `07-dashboard-styles.md` - CSS styles
- `08-dashboard-component.md` - Vue component

### Layer 5: Testing
- `09-unit-tests.md` - Unit tests

### Layer 6: Validation
- `10-e2e-validation.md` - E2E testing with Playwright

## Feature Status

Track progress in `features.json`. Update status as you complete each feature:
- `pending` - Not started
- `in_progress` - Currently working
- `completed` - Done and verified
- `failed` - Encountered issues

## Execution Guidelines

1. **One feature per session** - Each prompt tackles exactly one feature
2. **Follow constraints** - Read `constraints.md` before starting
3. **Verify before commit** - Run verification commands
4. **Update features.json** - Mark status after each feature

## Verification Commands

```bash
# Type check
cd .claude/hooks && bun run tsc --noEmit

# Run tests
cd .claude/hooks && bun run test:run

# Start viewer
cd .claude/hooks && bun run viewer
```

## Files Modified

| File | Feature |
|------|---------|
| `viewer/types.ts` | 01-types |
| `viewer/config.ts` | 02-config |
| `utils/logger.ts` | 03-heartbeat |
| `handlers/pre-tool-use.ts` | 04-heartbeat-handlers |
| `handlers/user-prompt-submit.ts` | 04-heartbeat-handlers |
| `viewer/dashboard.ts` (new) | 05-dashboard-service |
| `viewer/server.ts` | 06-api-endpoint |
| `viewer/styles/theme.css` | 07-dashboard-styles |
| `viewer/index.html` | 08-dashboard-component |
| `viewer/__tests__/dashboard.test.ts` (new) | 09-unit-tests |

## Dependencies

No new npm packages required.

## MCP Tools Available

- **Context7**: `resolve-library-id`, `get-library-docs` for documentation
- **Playwright**: `browser_navigate`, `browser_snapshot`, `browser_click`, etc. for E2E testing
