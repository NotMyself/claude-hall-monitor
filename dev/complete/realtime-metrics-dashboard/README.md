# Realtime Metrics Dashboard - Implementation Plan

## Overview

This is an optimized implementation plan for building a plan-centric realtime dashboard using React + Vite + shadcn/ui. The plan is structured for execution by Claude Code sub-agents, with each feature isolated into a discrete, testable unit.

**Key Principle**: One feature per session. Each prompt is self-contained with all necessary context.

## Quick Start

Execute features in order using the manifest.jsonl file:

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/dev/active/realtime-metrics-dashboard

# Start with initialization
cat init.md

# Then proceed through prompts in order
cat prompts/01-vite-react-setup.md
cat prompts/02-tailwind-theme.md
# ... and so on
```

## Files

| File | Purpose |
|------|---------|
| `manifest.jsonl` | Feature metadata for orchestration (33 features: F000-F032) |
| `context.md` | Project rationale and architecture vision |
| `decisions.md` | Architectural decisions with rationale (D001-D012) |
| `edge-cases.md` | Edge cases mapped to features (EC001-EC010) |
| `testing-strategy.md` | Testing philosophy and patterns |
| `constraints.md` | Global rules for all prompts |
| `code/*.md` | Code samples by language (progressive disclosure) |
| `init.md` | Project initialization (F000) |
| `prompts/*.md` | Individual feature prompts (F001-F032) |

## Code Samples

The `code/` directory contains reusable code patterns organized by language:

- **`typescript.md`**: Types, utilities, API functions, hooks, components
- **`css.md`**: Theme config, animations, layouts, component styles
- **`bash.md`**: Setup, development, testing, build commands
- **`html.md`**: Templates, configs, entry points

Each file uses hierarchical headings for progressive disclosure. Reference specific sections via anchors:
- `code/typescript.md#basic-types`
- `code/typescript.md#hooks`
- `code/css.md#theme-configuration`

Patterns are ordered from simple → complex within each file.

## Orchestration

Process the manifest.jsonl line by line. Each line contains metadata for one feature:

```bash
# Example: Read manifest and execute prompts
while IFS= read -r line; do
  file=$(echo "$line" | jq -r '.file')
  id=$(echo "$line" | jq -r '.id')
  description=$(echo "$line" | jq -r '.description')

  echo "Executing $id: $description"

  # Execute prompt file with sub-agent
  # Update status in manifest after completion
done < manifest.jsonl
```

### Manual Execution

Alternatively, execute prompts manually in order:

1. **F000**: `init.md` - Initialize project structure
2. **F001-F004**: Project setup (Vite, Tailwind, shadcn/ui, routing)
3. **F005-F008**: Core infrastructure (types, API client, hooks)
4. **F009-F014**: Shared components (shadcn/ui, layout)
5. **F015-F021**: Feature components (plans, metrics, sessions)
6. **F022-F025**: Pages assembly
7. **F026-F032**: Polish & integration

## Feature Status Tracking

Track progress by updating the `status` field in manifest.jsonl:

- `pending` - Not started
- `in_progress` - Currently being implemented
- `completed` - Done and verified
- `failed` - Needs attention

Example update:
```bash
# Mark F001 as completed
jq 'if .id == "F001" then .status = "completed" else . end' manifest.jsonl > tmp.jsonl
mv tmp.jsonl manifest.jsonl
```

## Implementation Layers

Features are organized into dependency layers for progressive implementation:

### Layer 1: Project Setup (F001-F004)
- Vite + React initialization
- Tailwind CSS configuration
- shadcn/ui setup
- React Router

**Dependencies**: None (foundation layer)

### Layer 2: Core Infrastructure (F005-F008)
- TypeScript type definitions
- API client with error handling
- SSE hook with auto-reconnect
- Data fetching hooks

**Dependencies**: Layer 1

### Layer 3: Shared Components (F009-F014)
- Install shadcn/ui components (layout, data, forms, charts)
- Build layout components (sidebar, header)
- Create app shell

**Dependencies**: Layers 1-2

### Layer 4: Feature Components (F015-F021)
- Plan cards and orchestrations
- Metrics display and charts
- Plan list/detail/timeline
- Session components

**Dependencies**: Layers 1-3

### Layer 5: Pages Assembly (F022-F025)
- Overview page
- Plans page
- Sessions page
- Settings page

**Dependencies**: Layers 1-4

### Layer 6: Polish & Integration (F026-F032)
- Loading/error states
- Responsive design
- Keyboard shortcuts
- Theme persistence
- Server integration
- Build configuration
- Testing

**Dependencies**: Layers 1-5

## Decision Log

See `decisions.md` for all architectural choices and rationale. Key decisions:

- **D001**: Plan-centric design (orchestrations front and center)
- **D002**: React + Vite (modern tooling, shadcn/ui support)
- **D003**: Sidebar layout (more space for plan cards)
- **D007**: SSE for realtime updates (efficient, instant)
- **D010**: shadcn/ui component library (accessible, composable)
- **D012**: Replace Vue.js viewer (React ecosystem advantages)

## Edge Cases

See `edge-cases.md` for complete list. Key cases:

- **EC001**: SSE disconnection → Auto-reconnect with exponential backoff
- **EC002**: No active plans → Empty state with helpful message
- **EC003**: 5+ concurrent plans → Auto-switch to compact card view
- **EC004**: API errors → Toast notifications + retry logic
- **EC007**: Mobile viewport → Collapse sidebar to sheet

## Testing

Each feature includes:
- Acceptance criteria (testable requirements)
- Verification command (usually `bun run tsc --noEmit`)
- Commit instructions

See `testing-strategy.md` for comprehensive testing approach using Vitest + React Testing Library.

## Prerequisites

This dashboard depends on the realtime-data-collection API layer being implemented first:
- API endpoints at `http://localhost:3456/api/*`
- SSE streams at `/events/plans` and `/events/metrics`

Ensure the API layer is running before testing the dashboard.

## Verification Commands

Each feature specifies a verification command. Common commands:

```bash
# Type checking
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit

# Run tests
bun test

# Build for production
bun run build

# Start dev server (manual verification)
bun run dev
```

## Commit Guidelines

Every feature includes a commit template following this pattern:

```bash
git commit -m "feat(scope): description

Full implementation details.

Implements: F0XX
Decisions: D0XX (if applicable)
Edge Cases: EC0XX (if applicable)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

## Scope Enforcement

Each prompt explicitly states:

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

Sub-agents should:
- Implement ONLY the specified feature
- Not work ahead to future features
- Note additional work needed in commit messages
- Adhere strictly to the acceptance criteria

## Support

- **Context questions**: Refer to `context.md`
- **Implementation patterns**: Check `code/` directory
- **Decision rationale**: See `decisions.md`
- **Edge case handling**: Check `edge-cases.md`
- **Global rules**: Review `constraints.md`

All necessary information is self-contained in these documents. Sub-agents should not need external resources.
