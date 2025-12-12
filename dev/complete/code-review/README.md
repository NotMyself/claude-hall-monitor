# Code Review Fixes - Orchestration Guide

This directory contains an optimized implementation plan for resolving 12 issues identified in the code review.

## Quick Start

```bash
# Run the orchestration command from project root
/orchestrate-plan dev/active/code-review
```

Or execute manually by following the prompts in order.

## Plan Structure

```
dev/active/code-review/
├── README.md           # This file - orchestration guide
├── features.json       # Feature tracking with status
├── constraints.md      # Global rules for all agents
├── init.md             # Initialization checks
├── plan.md             # Original plan (reference)
└── prompts/
    ├── 01-clear-poll-interval.md
    ├── 02-fix-before-destroy.md
    ├── 03-remove-hardcoded-path.md
    ├── 04-fix-badge-case.md
    ├── 05-extract-magic-numbers.md
    ├── 06-fix-ensure-logs-dir.md
    ├── 07-type-settings-parsing.md
    ├── 08-add-debug-logging.md
    ├── 09-standardize-handler-async.md
    ├── 10-convert-sync-to-async.md
    ├── 11-add-logger-tests.md
    └── 12-add-handler-tests.md
```

## Feature Layers

| Layer | Description | Features |
|-------|-------------|----------|
| 1 | Quick UI Fixes | F01, F02, F03, F04 |
| 2 | Code Quality | F05, F06, F07, F08 |
| 3 | Async/Consistency | F09, F10 |
| 4 | Test Coverage | F11, F12 |

## Execution Order

### Phase 1: Initialization
1. Run `init.md` to verify environment

### Phase 2: Quick Wins (Layer 1)
Execute in order:
1. `01-clear-poll-interval.md` - Fix memory leak
2. `02-fix-before-destroy.md` - Vue 3 compatibility
3. `03-remove-hardcoded-path.md` - Portability
4. `04-fix-badge-case.md` - CSS class fix

### Phase 3: Code Quality (Layer 2)
Execute in order:
5. `05-extract-magic-numbers.md` - Constants
6. `06-fix-ensure-logs-dir.md` - Race condition
7. `07-type-settings-parsing.md` - Type safety
8. `08-add-debug-logging.md` - Debugging

### Phase 4: Consistency (Layer 3)
Execute in order:
9. `09-standardize-handler-async.md` - Handler pattern
10. `10-convert-sync-to-async.md` - Async watcher

### Phase 5: Test Coverage (Layer 4)
Execute in order:
11. `11-add-logger-tests.md` - Logger tests
12. `12-add-handler-tests.md` - Handler tests

## Tracking Progress

Update `features.json` status after each feature:
- `pending` → `in_progress` → `completed`
- Or `pending` → `in_progress` → `failed` if issues arise

## Verification Commands

After each feature:
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

Final verification:
```bash
cd .claude/hooks && bun run test:coverage
```

## Rollback

Each feature has an isolated commit. To rollback:
```bash
git revert <commit-hash>
```

## Notes

- Each prompt implements exactly ONE feature
- Do not skip ahead or combine features
- Verify after each step before proceeding
- See `constraints.md` for global rules
