---
description: Optimize a project spec for sub-agent implementation using progressive disclosure and Anthropic's long-running agent techniques
argument-hint: "<plan-file-path>"
---

# Optimize Project Spec for Sub-Agent Implementation

Transform a project specification into an optimized implementation plan designed for Claude Code sub-agents.

## Input

- **Plan file**: $ARGUMENTS - Path to the plan markdown file (e.g., `dev/active/my-feature/plan.md`)
- **Output dir**: Derived from plan file's parent directory (e.g., `dev/active/my-feature/`)

## Tools

These tools enhance the optimization process but are not required. The command works without them.

- **Sequential Thinking** (optional): If the `sequentialthinking` MCP tool is available, use it for:
  - Decomposing the plan into discrete features
  - Analyzing dependencies between features
  - Deciding on layer groupings
  - Mapping edge cases and decisions to features
  - Resolving ambiguity in feature boundaries

- **Context7** (optional): If `resolve-library-id` and `get-library-docs` MCP tools are available, use them to:
  - Fetch current documentation for libraries mentioned in the plan
  - Include relevant API details in feature prompts
  - First resolve the library ID, then fetch docs for specific topics

- **Filesystem** (optional): If filesystem MCP tools are available (`read_file`, `write_file`, `create_directory`, `directory_tree`, `search_files`), use them to:
  - Read the input plan file
  - Write all output files
  - Create the prompts directory
  - Explore project structure for additional context

- **Documentation** (optional): If the `documentation` MCP tool is available, use it to:
  - Search Microsoft/Azure docs for relevant guidance
  - Include official best practices in constraints

## Techniques to Apply

### From Anthropic's Long-Running Agent Blog

Reference: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

1. **Feature-List Scaffolding**: Create `manifest.jsonl` with testable features, each with:

   - Unique ID and clear description
   - Concrete acceptance criteria
   - Status tracking: `pending` | `in_progress` | `completed` | `failed`
   - Verification command
   - Edge case and decision references

2. **One-Feature-Per-Session**: Each prompt tackles exactly ONE feature with explicit constraint:

   > "It is unacceptable to implement features beyond the scope of this task."

3. **Git-Based State Management**: Every prompt ends with commit instructions

4. **Testing-First Validation**: Verification commands in each prompt

### From Progressive Disclosure UX

Reference: https://www.nngroup.com/articles/progressive-disclosure/

1. **Ordered Complexity**: Structure from simple foundation → complex features
2. **Reduce Cognitive Load**: Small, focused prompts instead of monolithic spec
3. **Context Preservation**: Each prompt references prior completed work and relevant decisions
4. **Layered Information**: Group features into dependency layers

## Output Structure

Create this structure in the output directory:

```
<output-directory>/
├── README.md              # Orchestration guide
├── manifest.jsonl         # Feature metadata for orchestration
├── context.md             # Summary, rationale, architecture vision
├── decisions.md           # Decision log with rationale
├── edge-cases.md          # Global edge cases reference
├── testing-strategy.md    # Holistic testing approach
├── constraints.md         # Global rules for all agents
├── init.md                # Initializer agent prompt
├── code/                  # Code samples by language
│   ├── typescript.md      # TypeScript patterns and examples
│   ├── css.md             # CSS/styling patterns
│   ├── html.md            # HTML templates
│   ├── bash.md            # Shell commands and scripts
│   └── ...                # Other languages as needed
└── prompts/
    ├── 01-<feature>.md
    ├── 02-<feature>.md
    └── ...
```

## Workflow

1. **Read** the input spec file
2. **Extract Summary** → Write to `context.md` with the "why" and architecture vision
3. **Extract Decisions** → Write to `decisions.md` preserving rationale with IDs (D001, D002, ...)
4. **Extract Edge Cases** → Write to `edge-cases.md` with IDs (EC001, EC002, ...), note which features each applies to
5. **Extract Testing Strategy** → Write to `testing-strategy.md`
6. **Extract Code Samples** → Organize into `code/` directory by language with progressive disclosure structure
7. **Analyze** to identify discrete features, assign IDs (F001, F002, ...)
8. **Map relationships** - Link edge cases, decisions, and code references to relevant features
9. **Group** features into dependency layers
10. **Write** `constraints.md` referencing context docs and code directory
11. **Write** `init.md` for project setup (F000)
12. **Write** individual prompt files in `prompts/` with code references
13. **Write** `manifest.jsonl` with metadata for each feature
14. **Write** `README.md` with orchestration guide

## File Formats

### manifest.jsonl

One JSON object per line for streaming/orchestration:

```jsonl
{"id":"F000","file":"init.md","description":"Project initialization","depends_on":[],"edge_cases":[],"decisions":[],"code_refs":[],"status":"pending","verification":"bun run tsc --noEmit"}
{"id":"F001","file":"prompts/01-types.md","description":"Core type definitions","depends_on":["F000"],"edge_cases":[],"decisions":["D001"],"code_refs":["code/typescript.md#basic-types"],"status":"pending","verification":"bun run tsc --noEmit"}
{"id":"F002","file":"prompts/02-auth.md","description":"User authentication","depends_on":["F001"],"edge_cases":["EC001","EC002"],"decisions":["D002"],"code_refs":["code/typescript.md#core-logic","code/typescript.md#hooks"],"status":"pending","verification":"bun test --grep auth"}
```

### context.md

```markdown
# Project Context

## Summary

[What the feature does and WHY - preserve the rationale from the plan]

## Architecture Vision

[Implementation approach narrative - the cohesive vision for how components fit together]

## Goals

- [High-level goal 1]
- [High-level goal 2]
```

### decisions.md

```markdown
# Architectural Decisions

| ID | Decision | Rationale | Affected Features |
|----|----------|-----------|-------------------|
| D001 | [Choice made] | [Why this was chosen] | F001, F003 |
| D002 | [Choice made] | [Why this was chosen] | F002 |
```

### edge-cases.md

```markdown
# Edge Cases

| ID | Case | Handling | Affected Features |
|----|------|----------|-------------------|
| EC001 | [Edge case description] | [How it's handled] | F002, F005 |
| EC002 | [Edge case description] | [How it's handled] | F002 |
```

### testing-strategy.md

```markdown
# Testing Strategy

## Philosophy

[Overall testing approach from the plan]

## Test Types

- **Unit Tests**: [approach]
- **Integration Tests**: [approach]
- **E2E Tests**: [approach with Playwright]

## Patterns

[Testing patterns discovered from the project]
```

### code/{language}.md

Hierarchical markdown files organized for progressive disclosure. Each file:
- Groups code by concept/topic using headings
- Orders from simple → complex (foundational patterns first)
- Uses anchor-friendly heading IDs for direct linking
- Includes brief context before each code block

Structure each language file like this:

```markdown
# TypeScript Patterns

## Types

### Basic Types
[Foundation types that other code depends on]

```typescript
// Simple, foundational type
interface User {
  id: string;
  name: string;
}
```

### Extended Types
[More complex types building on basics]

```typescript
// Builds on User type
interface UserWithAuth extends User {
  token: string;
  permissions: Permission[];
}
```

## Functions

### Utilities
[Helper functions with no dependencies]

```typescript
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

### Core Logic
[Main business logic functions]

```typescript
export async function authenticateUser(
  credentials: Credentials
): Promise<UserWithAuth> {
  // Implementation
}
```

## Components

### Base Components
[Foundational UI components]

### Feature Components
[Components that compose base components]

## Hooks

### State Hooks
[Simple state management]

### Effect Hooks
[Side effects and data fetching]
```

**Referencing code in prompts:**

Use relative paths with anchors:
- `code/typescript.md#basic-types` - Link to Types > Basic Types section
- `code/typescript.md#utilities` - Link to Functions > Utilities section
- `code/css.md#layout` - Link to CSS layout patterns

**Progressive disclosure principles for code files:**

1. **Layer 1 - Foundation**: Types, interfaces, constants (no imports from project)
2. **Layer 2 - Utilities**: Pure functions, helpers (import only from Layer 1)
3. **Layer 3 - Core Logic**: Business logic (import from Layers 1-2)
4. **Layer 4 - Components/UI**: UI elements (import from Layers 1-3)
5. **Layer 5 - Integration**: Composition, wiring (import from all layers)

### constraints.md

```markdown
# Global Constraints

## Project Context

See `context.md` for the feature summary and architectural vision.

## Architectural Decisions

See `decisions.md` before making implementation choices. Reference decision IDs in commit messages when relevant.

## Edge Cases

See `edge-cases.md` for cases that may span multiple features. Each prompt lists its relevant edge cases.

## Code Patterns

See `code/` directory for reusable code samples organized by language. Each prompt references specific sections:
- Read the referenced code sections before implementing
- Follow the established patterns for consistency
- Code is organized by progressive disclosure (simple → complex)

## Testing Philosophy

See `testing-strategy.md` for the holistic testing approach.

## MCP Tools (if available)

These tools may be available to assist implementation. Check availability before use.

- **Playwright MCP** (optional): `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_console_messages` for E2E testing. Use `host.docker.internal` instead of `localhost` for local servers.
- **Context7 MCP** (optional): `resolve-library-id`, `get-library-docs` for fetching up-to-date library documentation.
- **Documentation MCP** (optional): Search Microsoft/Azure docs for official guidance.

## Rules

- One feature per session - do not implement beyond scope
- Commit after each feature
- Run verification before marking complete
- Reference decision IDs when implementing related code
- Follow code patterns from the `code/` directory
```

## Prompt Template

Each prompt file should follow:

````markdown
# Feature: [ID] - [Title]

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

[What was completed in prior steps - reference feature IDs]

## Objective

[Single, clear goal - ONE feature only]

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **[ID]**: [Decision summary] — [Why it matters for this feature]

## Edge Cases to Handle

From `edge-cases.md`:
- **[ID]**: [Case] → [Handling]

## Code References

Read these sections before implementing:
- `code/[language].md#[section]` - [What pattern to follow]
- `code/[language].md#[section]` - [What pattern to follow]

## Constraints

- See `constraints.md` for global rules
- [Feature-specific constraints]

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `path/to/file.ts` | [What changes and why] |

## Implementation Details

[Specific code patterns, interfaces to use, implementation guidance]

## Acceptance Criteria

- [ ] [Testable requirement 1]
- [ ] [Testable requirement 2]
- [ ] Edge case [ID] handled correctly

## Verification

Reference `testing-strategy.md` for approach.

```bash
[Command to verify success]
```

## Commit

```bash
git add [files]
git commit -m "feat([scope]): [description]

Implements: [ID]
Decisions: [relevant decision IDs]"
```

## Next

Proceed to: `[next prompt file]` ([next feature ID])
````

## Example Layering

- **Layer 1**: Types, configuration (no dependencies)
- **Layer 2**: Core infrastructure (depends on Layer 1)
- **Layer 3**: Main features (depends on Layer 2)
- **Layer 4**: UI/Styling (may be parallel)
- **Layer 5**: Integration (depends on features)
- **Layer 6**: Testing (depends on implementation)
- **Layer 7**: Final validation (E2E with Playwright)

## README.md Template

```markdown
# [Feature Name] - Implementation Plan

## Overview

[Brief description from context.md]

## Quick Start

1. Run features in order using manifest.jsonl
2. Each prompt is self-contained with context
3. Verify after each feature before proceeding

## Files

| File | Purpose |
|------|---------|
| `manifest.jsonl` | Feature metadata for orchestration |
| `context.md` | Project rationale and architecture |
| `decisions.md` | Architectural decisions with rationale |
| `edge-cases.md` | Edge cases mapped to features |
| `testing-strategy.md` | Testing philosophy and patterns |
| `constraints.md` | Global rules for all prompts |
| `code/*.md` | Code samples by language (progressive disclosure) |
| `init.md` | Project initialization (F000) |
| `prompts/*.md` | Individual feature prompts |

## Code Samples

The `code/` directory contains reusable code patterns organized by language:
- Each file uses hierarchical headings for progressive disclosure
- Reference specific sections via anchors: `code/typescript.md#basic-types`
- Patterns are ordered from simple → complex within each file

## Orchestration

Process manifest.jsonl line by line:

```bash
# Example: Read manifest and execute prompts
while read -r line; do
  file=$(echo "$line" | jq -r '.file')
  # Execute prompt file with sub-agent
done < manifest.jsonl
```

## Feature Status

Track progress by updating status in manifest.jsonl:
- `pending` - Not started
- `in_progress` - Currently being implemented
- `completed` - Done and verified
- `failed` - Needs attention

## Decision Log

See `decisions.md` for architectural choices and rationale.
```

Now read the spec file and create the optimized plan.
