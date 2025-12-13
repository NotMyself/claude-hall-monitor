# Plan Tracker - Implementation Plan

## Overview

Add a new "Plans" tab to the Claude Hall Monitor viewer that displays real-time updates of optimized plans being orchestrated by the `/orchestrate-plan` command.

## Features

- **Plan List**: Shows all plans in `dev/active/` and optionally `dev/complete/`
- **Progress Tracking**: Visual progress bar showing feature completion percentage
- **Feature Status**: Color-coded status badges (pending, in_progress, completed, failed)
- **Real-time Updates**: SSE-based updates when `features.json` changes
- **Layer Grouping**: Option to group features by dependency layer
- **Expandable Details**: Click to expand feature details (acceptance criteria, files, dependencies)

## Execution

Use the orchestrate command to execute this plan:

```
/orchestrate-plan dev/active/plan-tracker
```

## Layers

1. **Foundation** - Type definitions and configuration
2. **Watcher** - File watching infrastructure
3. **Backend** - API endpoints
4. **Frontend** - Vue component and CSS (can run in parallel)
5. **Testing** - Unit tests
6. **Validation** - E2E testing

## File Structure

```
.claude/hooks/viewer/
├── types.ts           # Add plan types
├── config.ts          # Add plan paths
├── plan-watcher.ts    # NEW: Plan file watcher
├── server.ts          # Add plan API endpoints
├── styles/theme.css   # Add plan styles
├── index.html         # Add plan-tracker-view component
└── __tests__/
    └── plan-watcher.test.ts  # NEW: Plan watcher tests
```

## Progress

See `features.json` for current implementation status.
