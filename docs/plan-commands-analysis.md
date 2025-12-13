# Plan Commands Analysis

Analysis of the `/plan-*` command system for feature planning and implementation.

## Command Overview

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/plan-new` | Create a new feature plan | User discussion | `dev/active/<title>/plan.md` |
| `/plan-optimize` | Transform plan into sub-agent prompts | `plan.md` path | Optimized directory structure |
| `/plan-orchestrate` | Execute plan with sub-agents | Plan directory | Implemented features |

---

## `/plan-new` - Create a New Feature Plan

**Purpose:** Enter planning mode to collaboratively design a feature with the user.

### Steps

1. **Enter Planning Mode** - Use `EnterPlanMode` tool
2. **Gather Requirements** - Discuss with user, research codebase using available tools:
   - Sequential Thinking (complex design decisions)
   - Context7 (library documentation)
   - Filesystem (codebase exploration)
   - Playwright (web UI interaction)
   - WebSearch (best practices research)
3. **Design the Approach** - Explore codebase, identify files to modify, consider edge cases
4. **Generate Plan Title** - Create kebab-case title (e.g., `user-authentication`)
5. **Write the Plan** - Create `dev/active/<title>/plan.md` containing:
   - Summary
   - Requirements
   - Implementation Approach
   - Files to Modify
   - Edge Cases
   - Testing Strategy
   - Decisions with rationale
6. **Pre-Exit Checklist** - Verify:
   - All technical questions researched and resolved
   - User has made decisions on all options presented
   - Plan contains only implementation details
   - No open questions remain
7. **Exit Planning Mode** - Use `ExitPlanMode` tool

### Output

```
dev/active/<title>/
└── plan.md
```

### Constraints

- No open questions allowed at exit
- Implementation-only scope (no project management, time estimates)

---

## `/plan-optimize` - Transform Plan into Sub-Agent Prompts

**Purpose:** Transform a plan.md into an optimized implementation structure designed for Claude Code sub-agents.

### Techniques Applied

**From Anthropic's Long-Running Agent Blog:**
- Feature-List Scaffolding with `manifest.jsonl`
- One-Feature-Per-Session constraint
- Git-Based State Management
- Testing-First Validation

**From Progressive Disclosure UX:**
- Ordered Complexity (simple → complex)
- Reduced Cognitive Load (small, focused prompts)
- Context Preservation (references to prior work)
- Layered Information (dependency layers)

### Steps

1. **Read** input spec file
2. **Extract Summary** → Write to `context.md` with the "why" and architecture vision
3. **Extract Decisions** → Write to `decisions.md` with IDs (D001, D002, ...)
4. **Extract Edge Cases** → Write to `edge-cases.md` with IDs (EC001, EC002, ...)
5. **Extract Testing Strategy** → Write to `testing-strategy.md`
6. **Extract Code Samples** → Organize into `code/` directory by language
7. **Analyze** to identify discrete features, assign IDs (F001, F002, ...)
8. **Map relationships** - Link edge cases, decisions, code refs to features
9. **Group** features into dependency layers
10. **Write** `constraints.md` referencing context docs
11. **Write** `init.md` for project setup (F000)
12. **Write** individual prompt files in `prompts/`
13. **Write** `manifest.jsonl` with metadata for each feature
14. **Write** `README.md` with orchestration guide

### Output Structure

```
dev/active/<title>/
├── README.md              # Orchestration guide
├── manifest.jsonl         # Feature metadata for orchestration
├── context.md             # Summary, rationale, architecture vision
├── decisions.md           # Decision log with rationale
├── edge-cases.md          # Global edge cases reference
├── testing-strategy.md    # Holistic testing approach
├── constraints.md         # Global rules for all agents
├── init.md                # Initializer agent prompt
├── code/                  # Code samples by language
│   ├── typescript.md
│   ├── css.md
│   └── ...
└── prompts/
    ├── 01-<feature>.md
    ├── 02-<feature>.md
    └── ...
```

### manifest.jsonl Format

```jsonl
{"id":"F000","file":"init.md","description":"Project initialization","depends_on":[],"edge_cases":[],"decisions":[],"code_refs":[],"status":"pending","verification":"bun run tsc --noEmit"}
{"id":"F001","file":"prompts/01-types.md","description":"Core type definitions","depends_on":["F000"],"edge_cases":[],"decisions":["D001"],"code_refs":["code/typescript.md#basic-types"],"status":"pending","verification":"bun run tsc --noEmit"}
```

### Feature Layering Example

- **Layer 1**: Types, configuration (no dependencies)
- **Layer 2**: Core infrastructure (depends on Layer 1)
- **Layer 3**: Main features (depends on Layer 2)
- **Layer 4**: UI/Styling (may be parallel)
- **Layer 5**: Integration (depends on features)
- **Layer 6**: Testing (depends on implementation)
- **Layer 7**: Final validation (E2E)

---

## `/plan-orchestrate` - Execute the Plan with Sub-Agents

**Purpose:** Execute an optimized implementation plan by spawning sub-agents for each feature.

### Steps

1. **Create Feature Branch** - Create `plan/<plan-name>` branch (or switch to it if resuming)

2. **Load Plan State** - Read `manifest.jsonl` to understand:
   - Total features and their IDs
   - Current status of each feature
   - Dependencies between features
   - Related edge cases and decisions
   - Code references for each feature

3. **Load Context Files**:
   - `context.md` - Project rationale and architecture vision
   - `decisions.md` - Architectural decisions with rationale
   - `edge-cases.md` - Edge cases mapped to features
   - `testing-strategy.md` - Testing philosophy
   - `constraints.md` - Global rules
   - `code/` directory - Available code pattern files
   - `README.md` - Orchestration guide

4. **Discover Available MCP Tools**:
   - Playwright (browser automation)
   - Context7 (library docs)
   - Documentation (Azure/Microsoft docs)
   - Sequential Thinking (problem decomposition)

5. **Run Initialization** (F000) if status is `pending`

6. **Resolve Code References** - For each feature:
   - Parse `code_refs` array
   - Extract relevant sections from `code/*.md` files
   - Store resolved snippets for sub-agent prompt

7. **Execute Features in Parallel Batches**:
   - **Check Dependencies** - All `depends_on` features must be `completed`
   - **Update Status** → `in_progress`
   - **Read Prompt** - Load corresponding prompt file
   - **Resolve Feature Context**:
     - Code patterns from `code_refs`
     - Edge case details from `edge-cases.md`
     - Decision details from `decisions.md`
   - **Spawn Sub-Agent** with enriched prompt including:
     - Full prompt content
     - Resolved code snippets
     - Edge case and decision details
     - Available MCP tools
     - **TDD workflow requirements** (Red-Green-Refactor)
     - **Pre-commit requirements** (lint, format, build, test)
     - Commit requirements with decision IDs
   - **Verify Completion**:
     - TDD workflow followed
     - Linting passed
     - Formatting applied
     - Build passes
     - All tests pass
     - Git commit made with decision IDs
   - **Update Status** → `completed` or `failed`

8. **Parallelization** - Features with satisfied dependencies run in parallel:
   ```
   Layer 1: F000 (init) - runs alone
   Layer 2: F001, F002, F003 depend on F000 - run in parallel
   Layer 3: F004 depends on F001, F005 depends on F002 - run in parallel
   Layer 4: F006 depends on F004 and F005 - runs alone
   ```

9. **Final Validation**:
   - Read `README.md` for validation steps
   - Run E2E validation prompt
   - Take screenshots (if Playwright available)
   - Compare against goals from `context.md`

10. **Suggest Documentation Updates**:
   - Analyze `CLAUDE.md` and `README.md` in project root
   - Generate suggested updates based on implemented features
   - Present diff-style suggestions for user approval
   - Apply approved updates and commit

11. **Merge Feature Branch**:
    - Switch to main branch
    - Merge `plan/<plan-name>` branch
    - Handle merge conflicts if needed

12. **Relocate Completed Plan**:
    - Move from `dev/active/<title>` to `dev/complete/<title>`
    - Commit relocation

### Error Handling

| Error | Handling |
|-------|----------|
| Sub-agent timeout | Retry once, then mark as failed |
| TDD violation | Must redo with proper TDD workflow |
| Missing test coverage | Must add tests before committing |
| Lint/format failure | Must fix before committing |
| Build/test failure | Must fix before committing; if unable, mark as failed |
| Verification failure | Do not commit, mark as failed |
| Git conflict | Pause and ask user for resolution |
| Missing files | Abort with clear error message |
| Dependency not met | Skip feature, continue with others |
| Missing code_refs | Warn but continue |
| Branch already exists | Switch to existing branch (resuming) |
| Merge conflict | Pause and notify user; wait for resolution |

---

## Identified Gaps

### Critical Gaps

#### 1. No Plan Status/Listing Command
There's no `/plan-list` or `/plan-status` to see:
- What plans exist in `dev/active/` and `dev/complete/`
- Quick status overview across all features
- Which features are pending/in_progress/completed/failed

#### 2. No Explicit Resumption Handling
If orchestration is interrupted, there's no documented workflow to resume. While `/plan-orchestrate` *could* resume by checking manifest status, this isn't explicit or documented.

#### 3. No Plan Cancellation/Cleanup Command
No `/plan-cancel` to:
- Cleanly abort a plan mid-execution
- Reset partial state
- Handle abandoned plans

#### 4. No Plan Validation Step
Between optimize and orchestrate, no `/plan-validate` to ensure:
- All prompt files exist
- All code refs resolve to actual sections
- Dependencies form a valid DAG (no cycles)
- Required fields are present in manifest

### Workflow Gaps

#### 5. Missing Plan Revision Workflow
After `/plan-optimize`, there's no way to:
- Add/remove features
- Modify decisions or edge cases
- Re-optimize without starting over

#### 6. No Dry-Run Mode
Can't preview what `/plan-orchestrate` would do without actually executing.

#### 7. One-Way Transformation
Changes to the optimized structure can't be synced back to `plan.md` - the source of truth diverges.

#### 8. No Cross-Plan Dependencies
If Plan B depends on Plan A being completed first, there's no way to express or enforce this.

### Observability Gaps

#### 9. No Dependency Visualization
Can't visualize the feature dependency graph before execution to verify structure is correct.

#### 10. No Progress Display During Execution
Users must manually run `jq` commands to check progress; no built-in real-time progress tracking.

### Recovery Gaps

#### 11. Limited Error Recovery
No way to:
- Retry a specific failed feature
- Roll back a feature's changes
- Skip a failed feature and mark dependencies as blocked

#### 12. Code Ref Resolution Fails Silently
If an anchor doesn't exist in a code file, it warns but continues - potentially missing critical patterns.

### Maintenance Gaps

#### 13. No Plan Templates
Each new plan starts from scratch; no way to create from a template for common patterns (e.g., "add API endpoint", "add UI component").

#### 14. No Plan Archival/Deletion
Plans accumulate in `dev/complete/` with no cleanup or archival strategy.

---

## Recommended Additions

### High Priority

1. **`/plan-list`** - Show all plans with status summary
2. **`/plan-status <dir>`** - Detailed status of a specific plan
3. **`/plan-validate <dir>`** - Validate plan structure before orchestration
4. **`/plan-resume <dir>`** - Explicitly resume interrupted orchestration

### Medium Priority

5. **`/plan-cancel <dir>`** - Cancel and cleanup a plan
6. **`/plan-retry <dir> <feature-id>`** - Retry a failed feature
7. **`/plan-graph <dir>`** - Visualize dependency graph
8. **Dry-run flag** for `/plan-orchestrate`

### Lower Priority

9. **`/plan-template <name>`** - Create plan from template
10. **`/plan-archive <dir>`** - Archive completed plans
11. **`/plan-edit <dir>`** - Modify optimized plan structure
