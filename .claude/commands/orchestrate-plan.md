---
description: Execute an optimized plan by running each feature prompt sequentially with sub-agents
argument-hint: "<plan-directory>"
---

# Orchestrate Plan Execution

Execute an optimized implementation plan by spawning sub-agents for each feature in sequence.

## Input
- **Plan directory**: $ARGUMENTS - Path to directory containing the optimized plan (e.g., `dev/active/ui-updates`)

## Execution Flow

### 1. Load Plan State

Read `features.json` from the plan directory to understand:
- Total features and their IDs
- Current status of each feature
- Dependency layers

### 2. Run Initialization (if needed)

If no features are `completed` yet:
1. Read `init.md` from the plan directory
2. Execute the initialization steps to verify environment
3. Confirm all pre-flight checks pass

### 3. Execute Features Sequentially

For each feature in `features.json` where `status === "pending"`:

1. **Update Status**: Mark feature as `in_progress` in `features.json`

2. **Read Prompt**: Load the corresponding prompt file from `prompts/` directory

3. **Spawn Sub-Agent**: Use the Task tool with `subagent_type: "general-purpose"` to:
   - Execute the feature implementation
   - The prompt should include:
     - The full content of the feature prompt file
     - Reference to `constraints.md` for global rules
     - Instruction to commit when complete

4. **Verify Completion**: After sub-agent completes:
   - Check that verification command passes
   - Check that git commit was made
   - Update `features.json` status to `completed`

5. **Handle Failures**: If a feature fails:
   - Mark status as `failed` in `features.json`
   - Log the failure reason
   - Ask user whether to retry, skip, or abort

### 4. Parallelization (Optional)

Features in the same layer with no inter-dependencies can run in parallel:
- Spawn multiple sub-agents simultaneously using parallel Task tool calls
- Wait for all to complete before moving to next layer
- Only parallelize if user confirms with `--parallel` flag

### 5. Final Validation

After all implementation features complete:
- Run the E2E validation prompt (typically the last prompt)
- Take screenshots to document the final state
- Generate a summary report

## Output

After execution completes, provide:
1. Summary of features implemented
2. Any failures encountered
3. Links to commits made
4. Screenshots from E2E validation (if applicable)

## Example Usage

```
/orchestrate-plan dev/active/ui-updates
```

This will:
1. Read `dev/active/ui-updates/features.json`
2. Run `init.md` verification
3. Execute each pending feature prompt via sub-agents
4. Track progress in `features.json`
5. Run final E2E validation

## Error Handling

- **Sub-agent timeout**: Retry once, then mark as failed
- **Verification failure**: Do not proceed to commit, mark as failed
- **Git conflict**: Pause and ask user for resolution
- **Missing files**: Abort with clear error message

## Progress Tracking

The orchestrator updates `features.json` in real-time:
```json
{
  "id": "F01",
  "status": "completed"  // Updated from "pending" → "in_progress" → "completed"
}
```

User can check progress anytime by reading `features.json`.

## Now Execute

1. Read `$ARGUMENTS/features.json` to get the feature list
2. Read `$ARGUMENTS/constraints.md` for global rules
3. Check which features are pending
4. For the first pending feature, read its prompt from `$ARGUMENTS/prompts/`
5. Spawn a sub-agent with the Task tool to implement that feature
6. After completion, update features.json and proceed to next feature
7. Continue until all features are complete or a failure occurs

Begin orchestration now.
