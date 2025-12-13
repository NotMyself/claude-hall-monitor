---
description: Enter planning mode to discuss and create a new feature plan
---

# New Feature Plan

Enter planning mode to collaboratively design a new feature with the user.

## Workflow

### 1. Enter Planning Mode

Use the EnterPlanMode tool to begin the planning session.

### 2. Gather Requirements

Discuss with the user to understand:

- What problem they want to solve
- Desired functionality and behavior
- Constraints or preferences
- Integration points with existing code

Ask clarifying questions as needed.

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
- Any open questions or decisions

### 6. Exit Planning Mode

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
