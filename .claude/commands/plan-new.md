---
description: Enter planning mode to discuss and create a new feature plan
---

# New Feature Plan

Enter planning mode to collaboratively design a new feature with the user.

## Constraints

- **No open questions**: All technical questions must be researched during planning. When multiple approaches exist, present options with pros/cons based on the project's existing patterns and let the user decide. Do not exit planning mode with unresolved questions.
- **Implementation-only scope**: Plans cover technical implementation only. Exclude project management tasks, approval workflows, time estimates, and effort sizing.

## Tools

- **Sequential Thinking** (optional): If the `sequentialthinking` MCP tool is available, use it for complex design decisions. It helps with breaking down problems, exploring approaches, considering trade-offs, and reaching well-reasoned conclusions. Particularly useful when evaluating multiple implementation options.
- **Context7** (optional): If the `resolve-library-id` and `get-library-docs` MCP tools are available, use them to fetch up-to-date documentation for libraries and frameworks. First resolve the library ID, then fetch relevant docs. Useful when planning features that involve external dependencies or unfamiliar APIs.
- **Filesystem** (optional): If filesystem MCP tools are available (`read_file`, `list_directory`, `directory_tree`, `search_files`), use them to explore the codebase structure and read files. Useful for understanding project layout and examining existing implementations.
- **Playwright** (optional): If browser MCP tools are available (`browser_navigate`, `browser_snapshot`, `browser_click`, etc.), use them to interact with web servers running in the project. Useful for understanding existing UI behavior and testing assumptions. Note: Use `host.docker.internal` instead of `localhost` when targeting local servers.
- **WebSearch** (optional): Use web search to research best practices, common implementation patterns, or solutions to technical challenges when codebase exploration isn't sufficient.

## Workflow

### 1. Enter Planning Mode

Use the EnterPlanMode tool to begin the planning session.

### 2. Gather Requirements

Discuss with the user to understand:

- What problem they want to solve
- Desired functionality and behavior
- Constraints or preferences
- Integration points with existing code

Research the codebase to answer technical questions yourself. When multiple valid approaches exist, present options with pros/cons based on existing project patterns. Only ask the user questions that require their decision or input.

### 3. Design the Approach

- Explore the codebase to understand relevant patterns
- Identify files that will need modification
- Consider edge cases and potential issues
- Draft an implementation approach

### 4. Generate Plan Title

Before exiting planning mode, generate a concise, kebab-case title for the plan based on the discussion. Examples:

- `user-authentication`
- `realtime-notifications`
- `api-rate-limiting`

### 5. Write the Plan

Create the plan directory and write the plan file:

- Directory: `dev/active/<generated-title>/`
- File: `dev/active/<generated-title>/plan.md`

The plan should include:

- Summary of the feature
- Requirements gathered from discussion
- Implementation approach
- Files to create/modify
- Edge cases and how to handle them
- Testing strategy (discover test patterns from the project)
- Resolved decisions and rationale

Do not include time estimates, effort sizing, approval checkpoints, or project management concerns.

Use this template structure:

```markdown
# <Feature Title>

## Summary
Brief description of what the feature does and why.

## Requirements
- Requirement 1
- Requirement 2

## Implementation Approach
Describe the technical approach and architecture.

## Files to Modify
- `path/to/file.ts` - Description of changes

## Edge Cases
| Case | Handling |
|------|----------|
| Edge case 1 | How it's handled |

## Testing Strategy
Describe testing approach based on project patterns (e.g., unit tests, integration tests).

## Decisions
| Decision | Rationale |
|----------|-----------|
| Choice made | Why this was chosen |
```

### 6. Pre-Exit Checklist

Before exiting, verify:

- [ ] All technical questions researched and resolved
- [ ] User has made decisions on all options presented
- [ ] Plan contains only implementation details
- [ ] No open questions remain

### 7. Exit Planning Mode

Use ExitPlanMode to complete the planning session.

## Output

After completion, the user will have:

- A new directory at `dev/active/<title>/`
- A `plan.md` file documenting the feature design
- Ready for `/plan-optimize` to generate feature prompts

## Next Steps

After this command completes, the user can run:

```
/plan-optimize dev/active/<title>/plan.md
```

To transform the plan into optimized feature prompts for sub-agent implementation.

## Begin

Enter planning mode now and start the discussion with the user about their new feature.
