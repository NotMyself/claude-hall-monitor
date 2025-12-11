# Realtime Log Viewer - Implementation Plan

This directory contains an optimized implementation plan for building a real-time log viewer for Claude Code hooks. The plan is structured using techniques from [Anthropic's Engineering Blog on Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) and progressive disclosure UX principles.

## Overview

The realtime-log-viewer displays entries from `.claude/hooks/hooks-log.txt` in a web UI with:
- Real-time updates via Server-Sent Events (SSE)
- Vue.js UI with Claude Code Docs-inspired theming
- Filtering by search, event type, and session
- Light/dark/system theme modes
- Auto-start on Claude Code session startup

## Key Techniques Applied

### From Anthropic Engineering Blog

| Technique | Implementation |
|-----------|---------------|
| **Feature-List Scaffolding** | `features.json` tracks 22 features with pass/fail status |
| **One-Feature-Per-Session** | Each prompt in `prompts/` tackles exactly ONE feature |
| **Explicit Constraints** | `constraints.md` defines unambiguous rules |
| **Git-Based State** | Every prompt ends with commit instructions |
| **Testing-First** | Verification commands in each prompt |

### From Progressive Disclosure UX

| Principle | Implementation |
|-----------|---------------|
| **Ordered Complexity** | Features progress from simple types → complex UI |
| **Reduce Cognitive Load** | Small, focused prompts instead of monolithic spec |
| **Context Preservation** | Each prompt references completed prior work |
| **Layered Information** | 9 layers from foundation to validation |

## Directory Structure

```
dev/active/realtime-log-viewer/
├── README.md           # This file - orchestration guide
├── features.json       # Feature tracking with status
├── constraints.md      # Global rules for all agents
├── init.md             # Initializer agent prompt
└── prompts/
    ├── 01-types.md         # Layer 1: Foundation
    ├── 02-config.md        #
    ├── 03-watcher.md       # Layer 2: Infrastructure
    ├── 04-server-basic.md  #
    ├── 05-server-sse.md    # Layer 3: Server Features
    ├── 06-server-api.md    #
    ├── 07-theme-css.md     # Layer 4: Styling
    ├── 08-html-skeleton.md # Layer 5: UI Components
    ├── 09-eventbadge.md    #
    ├── 10-themetoggle.md   #
    ├── 11-filterbar.md     #
    ├── 12-logentry.md      #
    ├── 13-logviewer.md     #
    ├── 14-tabcontainer.md  #
    ├── 15-sse-client.md    # Layer 6: Client Logic
    ├── 16-app-integration.md
    ├── 17-test-setup.md    # Layer 7: Testing
    ├── 18-test-components.md
    ├── 19-test-server.md   #
    ├── 20-session-start.md # Layer 8: Integration
    ├── 21-package-json.md  #
    └── 22-final-validation.md # Layer 9: Validation
```

## How to Use This Plan

### Option 1: Manual Execution

Run each prompt sequentially in Claude Code:

1. Start with `init.md` to set up the project structure
2. Execute prompts 01-22 in order
3. After each prompt, verify and commit as instructed
4. Update `features.json` status as you complete features

```bash
# Example workflow
cat dev/active/realtime-log-viewer/init.md | pbcopy  # Copy to clipboard
# Paste into Claude Code and execute

cat dev/active/realtime-log-viewer/prompts/01-types.md | pbcopy
# Paste into Claude Code and execute
# ... continue for each prompt
```

### Option 2: Automated Agent Orchestration

Use this plan with an agent harness that:

1. Reads `features.json` to find the next `pending` feature
2. Reads the corresponding prompt file
3. Executes the prompt in a fresh Claude Code session
4. Runs the verification command
5. Updates `features.json` status to `completed` or `failed`
6. Commits changes with the specified message
7. Repeats until all features are complete

### Option 3: Sub-Agent Swarm

Launch multiple agents in parallel for independent features:

**Layer 1 (parallel)**:
- Agent A: `01-types.md`
- Agent B: `02-config.md`

**Layer 2 (after Layer 1)**:
- Agent A: `03-watcher.md`
- Agent B: `04-server-basic.md`

**Layer 4 (parallel with Layer 2-3)**:
- Agent C: `07-theme-css.md`

## Progress Tracking

### Using features.json

The `features.json` file tracks all features:

```json
{
  "features": [
    {
      "id": "01-types",
      "status": "pending",  // pending | in_progress | completed | failed
      "verification": "cd .claude/hooks && bun run tsc --noEmit viewer/types.ts"
    }
  ]
}
```

Update status after each feature:
```bash
# Using jq (if available)
jq '.features[0].status = "completed"' features.json > tmp.json && mv tmp.json features.json
```

### Using Git History

Each feature creates a commit. View progress with:
```bash
git log --oneline --grep="feat(viewer)"
```

## Recovery from Failures

### Feature Failed Verification

1. Read the failure output
2. Fix the issue in the relevant file
3. Re-run verification
4. Update `features.json` status
5. Commit with amended message

### Agent Crashed Mid-Feature

1. Check `git status` for uncommitted changes
2. Review the partially completed work
3. Resume from the current prompt (agent has context from prior commits)
4. Complete the feature and commit

### Rollback a Feature

```bash
git log --oneline  # Find the commit to revert
git revert <commit-hash>
# Update features.json status back to "pending"
```

## Dependency Graph

```
01-types ─────┬─► 03-watcher ─────────┐
              │                       │
02-config ────┴─► 04-server-basic ────┴─► 05-server-sse ─► 06-server-api
                                                                │
07-theme-css ─► 08-html-skeleton ─► 09-eventbadge ─► 10-themetoggle
                        │                                      │
                        └─► 11-filterbar ─► 12-logentry ─► 13-logviewer
                                                              │
                        14-tabcontainer ◄─────────────────────┘
                                │
                        15-sse-client ─► 16-app-integration
                                                │
                        17-test-setup ─► 18-test-components ─► 19-test-server
                                                                    │
                        20-session-start ─► 21-package-json ─► 22-final-validation
```

## Final Output

When complete, the project will have:

| File | Purpose |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Bun HTTP server with SSE |
| `.claude/hooks/viewer/index.html` | Vue 3 UI with all components |
| `.claude/hooks/viewer/styles/theme.css` | Claude Code Docs theme |
| `.claude/hooks/viewer/types.ts` | TypeScript definitions |
| `.claude/hooks/viewer/config.ts` | Configuration constants |
| `.claude/hooks/viewer/watcher.ts` | Log file watcher |
| `.claude/hooks/viewer/vitest.config.ts` | Test configuration |
| `.claude/hooks/viewer/__tests__/*` | Unit and server tests |
| `.claude/hooks/session-start.ts` | Modified for auto-start |
| `.claude/hooks/package.json` | Updated with scripts/deps |

## Running the Viewer

After implementation:

```bash
# Manual start
cd .claude/hooks && bun run viewer

# Opens at http://localhost:3456

# Or it auto-starts when Claude Code launches
```

## Available MCP Tools

### Playwright MCP (Browser Automation)

This plan assumes access to Playwright MCP for automated browser testing. The following tools are available:

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Navigate to URLs |
| `browser_snapshot` | Get accessibility tree (for element verification) |
| `browser_take_screenshot` | Capture page images |
| `browser_click` | Click elements by ref |
| `browser_type` | Type text into inputs |
| `browser_console_messages` | Check for JS errors |
| `browser_close` | Close the browser |

**Usage in Feature 22 (Final Validation):**
- Automated E2E testing replaces manual browser verification
- Screenshots captured for visual confirmation
- Accessibility snapshots verify UI structure
- Console messages checked for runtime errors

**Why Playwright MCP?**
- Localhost testing avoids Cloudflare challenges
- Automated verification is reproducible
- Screenshots provide visual documentation
- Console inspection catches JS errors early

### Context7 MCP (Documentation)

Available for looking up library documentation:
- `resolve-library-id` - Find library IDs
- `get-library-docs` - Fetch documentation

Useful for Vue.js, Vitest, or Bun API reference during implementation.

## References

- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Anthropic Engineering Blog
- [Progressive Disclosure in UX](https://www.nngroup.com/articles/progressive-disclosure/) - Nielsen Norman Group
- [Original Spec](../realtime-log-viewer.md) - Source specification document
