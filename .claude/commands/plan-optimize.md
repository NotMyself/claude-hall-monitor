---
description: Optimize a project spec for sub-agent implementation using progressive disclosure and Anthropic's long-running agent techniques
argument-hint: "<plan-file-path>"
---

# Optimize Project Spec for Sub-Agent Implementation

Transform a project specification into an optimized implementation plan designed for Claude Code sub-agents.

## Input

- **Plan file**: $ARGUMENTS - Path to the plan markdown file (e.g., `dev/active/my-feature/plan.md`)
- **Output dir**: Derived from plan file's parent directory (e.g., `dev/active/my-feature/`)

## Techniques to Apply

### From Anthropic's Long-Running Agent Blog

Reference: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

1. **Feature-List Scaffolding**: Create `features.json` with testable features, each with:

   - Unique ID and clear description
   - Concrete acceptance criteria
   - Status tracking: `pending` | `in_progress` | `completed` | `failed`
   - Verification command

2. **One-Feature-Per-Session**: Each prompt tackles exactly ONE feature with explicit constraint:

   > "It is unacceptable to implement features beyond the scope of this task."

3. **Git-Based State Management**: Every prompt ends with commit instructions

4. **Testing-First Validation**: Verification commands in each prompt

### From Progressive Disclosure UX

Reference: https://www.nngroup.com/articles/progressive-disclosure/

1. **Ordered Complexity**: Structure from simple foundation → complex features
2. **Reduce Cognitive Load**: Small, focused prompts instead of monolithic spec
3. **Context Preservation**: Each prompt references prior completed work
4. **Layered Information**: Group features into dependency layers

## Output Structure

Create this structure in the output directory:

```
<output-directory>/
├── README.md           # Orchestration guide
├── features.json       # Feature tracking with status
├── constraints.md      # Global rules for all agents
├── init.md             # Initializer agent prompt
└── prompts/
    ├── 01-<feature>.md
    ├── 02-<feature>.md
    └── ...
```

## Prompt Template

Each prompt file should follow:

````markdown
# Feature: [ID] - [Title]

## Context

[What was completed in prior steps]

## Objective

[Single, clear goal - ONE feature only]

## Constraints

- Reference: See constraints.md for global rules
- [Feature-specific constraints]

## Files to Create/Modify

- [file path] - [purpose]

## Implementation Details

[Specific code patterns, interfaces to use]

## Acceptance Criteria

- [ ] [Testable requirement 1]
- [ ] [Testable requirement 2]

## Verification

```bash
[Command to verify success]
```
````

## Commit

```bash
git add [files]
git commit -m "feat([scope]): [description]"
```

## Next

Proceed to: [next prompt file]

```

## MCP Tools Available

Include in constraints.md:

- **Playwright MCP**: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_console_messages` for E2E testing
- **Context7 MCP**: `resolve-library-id`, `get-library-docs` for documentation lookup

## Workflow

1. **Read** the input spec file
2. **Analyze** to identify discrete features
3. **Group** features into dependency layers (foundation → infrastructure → features → testing → validation)
4. **Create** `features.json` with all features
5. **Write** `constraints.md` with global rules
6. **Write** `init.md` for project setup
7. **Write** individual prompt files in `prompts/`
8. **Write** `README.md` with orchestration guide

## Example Layering

- **Layer 1**: Types, configuration (no dependencies)
- **Layer 2**: Core infrastructure (depends on Layer 1)
- **Layer 3**: Main features (depends on Layer 2)
- **Layer 4**: UI/Styling (may be parallel)
- **Layer 5**: Integration (depends on features)
- **Layer 6**: Testing (depends on implementation)
- **Layer 7**: Final validation (E2E with Playwright)

Now read the spec file and create the optimized plan.
```
