---
description: Execute an optimized plan by running each feature prompt sequentially with sub-agents
argument-hint: "<plan-directory>"
---

# Orchestrate Plan Execution

Execute an optimized implementation plan by spawning sub-agents for each feature in sequence.

## Input

- **Plan directory**: $ARGUMENTS - Path to directory containing the optimized plan (e.g., `dev/active/ui-updates`)

## Execution Flow

### 1. Create Feature Branch

Before any implementation work, create a dedicated branch for the plan:

1. **Extract plan name** from the directory path (e.g., `ui-updates` from `dev/active/ui-updates`)
2. **Create branch** named `plan/<plan-name>` (e.g., `plan/ui-updates`)
3. **Switch to the branch** to isolate all plan work

```bash
git checkout -b plan/<plan-name>
```

If the branch already exists (resuming an interrupted plan), switch to it instead:

```bash
git checkout plan/<plan-name>
```

### 2. Load Plan State

Read `manifest.jsonl` from the plan directory. Each line is a JSON object:

```jsonl
{"id":"F000","file":"init.md","description":"...","depends_on":[],"edge_cases":[],"decisions":[],"code_refs":[],"status":"pending","verification":"..."}
{"id":"F001","file":"prompts/01-types.md","description":"...","depends_on":["F000"],"edge_cases":[],"decisions":["D001"],"code_refs":["code/typescript.md#basic-types"],"status":"pending","verification":"..."}
```

Parse to understand:

- Total features and their IDs
- Current status of each feature
- Dependencies between features
- Related edge cases and decisions
- Code references for each feature (`code_refs` array)

### Manifest Fields Used

| Field | Usage |
|-------|-------|
| `id` | Feature identification and dependency resolution |
| `file` | Prompt file to read |
| `description` | Progress reporting |
| `depends_on` | Dependency checking before execution |
| `edge_cases` | Include in sub-agent context with descriptions |
| `decisions` | Include in sub-agent context, verify in commits |
| `code_refs` | Resolve and inline code patterns for sub-agent |
| `status` | Track progress |
| `verification` | Post-completion check |

### 3. Load Context Files

Read these files to provide full context to sub-agents:

- `context.md` - Project rationale and architecture vision
- `decisions.md` - Architectural decisions with rationale
- `edge-cases.md` - Edge cases mapped to features
- `testing-strategy.md` - Testing philosophy
- `constraints.md` - Global rules
- `code/` directory - List available code pattern files for reference
- `README.md` - Orchestration guide and validation steps

### 3.5 Discover Available MCP Tools

Check for optional MCP tools that can assist sub-agents:

- **Playwright**: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`
- **Context7**: `resolve-library-id`, `get-library-docs`
- **Documentation**: Microsoft/Azure docs search
- **Sequential Thinking**: `sequentialthinking` for complex problem decomposition

Document which tools are available to pass to sub-agents in their prompts.

### 4. Run Initialization (if needed)

If F000 status is `pending`:

1. Read `init.md` from the plan directory
2. Execute the initialization steps to verify environment
3. Confirm all pre-flight checks pass
4. Update F000 status to `completed` in `manifest.jsonl`

### 4.5 Resolve Code References

Before executing each feature, resolve its code references:

1. Read the `code_refs` array from the feature's manifest entry
2. For each reference (e.g., `code/typescript.md#basic-types`):
   - Parse the file path and anchor (section heading)
   - Read the code file from the plan directory
   - Extract the relevant section content (from heading to next same-level heading)
   - Store the resolved code snippet for inclusion in sub-agent prompt

Example resolution:
```
code_refs: ["code/typescript.md#basic-types", "code/css.md#layout"]

Resolves to:
- Content from `code/typescript.md` section "## Basic Types" or "### Basic Types"
- Content from `code/css.md` section "## Layout" or "### Layout"
```

### 5. Execute Features Sequentially

Execute features one at a time in dependency order:

1. **Check Dependencies**: Ensure all `depends_on` features are `completed`

2. **CRITICAL - Verify Dependencies Actually Complete**: Before proceeding, RUN the verification command for each dependency to confirm it actually completed. Do NOT trust manifest status alone.

3. **Update Status**: Mark feature as `in_progress` in `manifest.jsonl`

4. **Read Prompt**: Load the corresponding prompt file

5. **Resolve Feature Context**: Gather all context for this feature:
   - **Code patterns**: Resolve each `code_refs` entry (see Step 4.5)
   - **Edge cases**: Look up each `edge_cases` ID in `edge-cases.md` to get full descriptions
   - **Decisions**: Look up each `decisions` ID in `decisions.md` to get rationale

6. **Spawn Sub-Agent**: Use the Task tool with `subagent_type: "general-purpose"` to:

   - Execute the feature implementation using TDD workflow
   - The prompt should include:
     - The full content of the feature prompt file
     - **Resolved code snippets** from `code_refs` (actual code, not just references)
     - **Edge case details**: For each edge case ID, include the case description and handling from `edge-cases.md`
     - **Decision details**: For each decision ID, include the decision and rationale from `decisions.md`
     - Reminder to read `constraints.md` for global rules
     - **Available MCP tools** discovered in Step 3.5
     - **TDD workflow requirements**: Must follow Red-Green-Refactor cycle
     - **Build and test requirements**: Must verify build passes and all tests pass before committing
     - Instruction to commit when complete
     - **Decision IDs to include in commit message** (from manifest `decisions` array)

   Example sub-agent prompt structure:
   ```
   # Feature Implementation: [ID] - [Title]

   ## Prompt
   [Full content of the feature prompt file]

   ## Code Patterns to Follow
   [Resolved code snippets from code_refs]

   ## Edge Cases to Handle
   - EC001: [Description] → [Handling]
   - EC002: [Description] → [Handling]

   ## Relevant Decisions
   - D001: [Decision] — [Rationale]
   - D002: [Decision] — [Rationale]

   ## Available Tools
   [List of MCP tools available for use]

   ## TDD Workflow (MANDATORY)
   You MUST follow Test-Driven Development. For each piece of functionality:

   ### 1. RED - Write Failing Tests First
   - Write test(s) that define the expected behavior
   - Run tests to confirm they FAIL (this validates the test is meaningful)
   - Do NOT write implementation code yet

   ### 2. GREEN - Write Minimal Implementation
   - Write the simplest code that makes the tests pass
   - Run tests to confirm they PASS
   - Do NOT add functionality beyond what tests require

   ### 3. REFACTOR - Improve Code Quality
   - Clean up code while keeping tests green
   - Remove duplication, improve naming, simplify logic
   - Run tests after each refactor to ensure they still pass

   ### TDD Rules
   - NEVER write implementation code before its corresponding test
   - Each test should test ONE specific behavior
   - Tests must be deterministic and independent
   - Include tests for edge cases listed above
   - If you find yourself writing code without a test, STOP and write the test first

   ## Pre-Commit Requirements
   Before committing, you MUST verify:
   1. **All tests written first**: Confirm TDD workflow was followed
   2. **Lint all modified files**: Run linter on all modified files and fix any issues
      - TypeScript/JavaScript: eslint, tsc --noEmit
      - Python: ruff, mypy, black --check
      - Go: golint, go vet, gofmt -d
      - Rust: cargo clippy, cargo fmt --check
      - CSS/SCSS: stylelint
      - Markdown: markdownlint
      - JSON/YAML: prettier --check
      - Use project-specific linter config if available
   3. **Format all modified files**: Run formatter on all modified files
      - TypeScript/JavaScript: prettier
      - Python: black, isort
      - Go: gofmt
      - Rust: cargo fmt
      - CSS/SCSS: prettier
      - Markdown: prettier
      - JSON/YAML: prettier
      - Use project-specific formatter config if available
   4. **Build passes**: Run the project build command and confirm no errors
   5. **All tests pass**: Run the test suite and confirm all tests pass
   6. **Feature verification**: Run the feature-specific verification command

   Do NOT commit if linting fails, formatting is incorrect, build fails, or any tests fail. Fix issues first.

   ## Commit Requirements
   After build and tests pass, commit with these decision IDs: D001, D002
   ```

7. **CRITICAL - Verify Completion Before Marking Complete**: After sub-agent completes:

   **WARNING: Do NOT mark as completed unless ALL verification passes. Do NOT trust sub-agent claims alone.**

   - **Verify TDD workflow followed**: Confirm tests were written before implementation
   - **Verify linting passed**: Confirm all modified files pass linting with no errors
   - **Verify formatting applied**: Confirm all modified files are properly formatted
   - **Verify build passes**: Run the build command yourself and confirm it succeeded
   - **Verify all tests pass**: Run the test suite yourself and confirm all passed
   - **Verify test coverage**: Confirm new functionality has corresponding tests
   - **RUN the feature-specific verification command yourself** - Do NOT skip this step
   - **Verify git commit was made**: Check git log for the expected commit
   - **Verify commit message includes relevant decision IDs** from the manifest `decisions` array
   - **Only if ALL above checks pass**: Update `manifest.jsonl` status to `completed`
   - **If ANY check fails**: Do NOT mark as completed. Mark as `failed` and handle below.

8. **Handle Failures**: If a feature fails:
   - Mark status as `failed` in `manifest.jsonl`
   - Log the failure reason
   - Ask user whether to retry, skip, or abort
   - Do NOT proceed to next feature until user responds

### 6. Resume Safeguards

When resuming an interrupted plan (branch already exists):

1. **Re-verify ALL "completed" features**: Run the verification command for each feature marked as "completed"
2. **If any verification fails**: Reset that feature's status to `pending`
3. **Log which features were reset**: Inform user which features need to be re-done
4. **Continue from first pending feature**: Do not skip features based solely on manifest status

**CRITICAL: Never trust manifest status on resume. Always verify actual state.**

### 7. Final Validation

After all implementation features complete:

1. **Read `README.md`** for any orchestration-specific validation steps or acceptance criteria
2. Run the E2E validation prompt (typically the last prompt)
3. If Playwright MCP is available:
   - Take screenshots to document the final state
   - Capture console messages for any errors
4. Generate a summary report comparing results against:
   - Goals from `context.md`
   - Acceptance criteria from `README.md`
   - All edge cases from `edge-cases.md` were addressed

### 8. Suggest Documentation Updates

After validation, analyze project documentation and suggest updates based on new features:

1. **Read project documentation**:
   - `CLAUDE.md` in project root (if exists)
   - `README.md` in project root (if exists)
   - Any other relevant documentation files

2. **Analyze implemented features**:
   - Review all completed features from `manifest.jsonl`
   - Identify new functionality, APIs, commands, or components
   - Note architectural changes from `decisions.md`
   - Consider edge cases that users should know about

3. **Generate suggested updates for CLAUDE.md**:
   - New commands or features to document
   - Updated architecture descriptions
   - New dependencies or tools introduced
   - Changed workflows or conventions
   - New rules or constraints to follow

4. **Generate suggested updates for README.md**:
   - New features for users
   - Updated installation or setup steps
   - New usage examples
   - Changed configuration options
   - Updated API documentation

5. **Present suggestions to user**:
   - Show diff-style suggestions for each file
   - Explain why each update is recommended
   - Ask user to approve, modify, or skip each suggestion

6. **Apply approved updates**:
   - Edit documentation files with approved changes
   - Commit documentation updates separately:
     ```
     docs: update documentation for <plan-name> features

     - Updated CLAUDE.md with [summary]
     - Updated README.md with [summary]
     ```

### 9. Create Pull Request (NEVER Merge to Main)

**CRITICAL: NEVER merge to main. NEVER push to main. Create a PR instead.**

After all features are complete and validated:

1. **Push feature branch**: `git push -u origin plan/<plan-name>`
2. **Create pull request**: Use `gh pr create` to create a PR from the plan branch to main
3. **Include in PR description**:
   - Summary of features implemented
   - Link to the plan directory
   - Any notes for reviewers
4. **Return PR URL to user**: Let user review and merge manually

```bash
# Push feature branch (OK to push to feature branch)
git push -u origin plan/<plan-name>

# Create PR (NEVER merge directly)
gh pr create --title "feat: <plan-name>" --body "..."
```

**WARNING**: Do NOT run `git checkout main`, `git merge`, or `git push origin main`. All code stays on the feature branch until user manually merges the PR.

### 10. Relocate Completed Plan

After all features are complete and validated:

1. **Extract plan name**: Get the plan directory name (e.g., `ui-updates` from `dev/active/ui-updates`)
2. **Move to complete**: Relocate the entire plan directory from `dev/active/<plan-name>` to `dev/complete/<plan-name>`
3. **Commit relocation**: Create a git commit documenting the plan completion:
   ```
   chore: relocate <plan-name> plan to dev/complete

   All features implemented and validated.
   ```
4. **Confirm success**: Verify the plan exists in `dev/complete/` and is removed from `dev/active/`

## Updating manifest.jsonl

To update status in JSONL format:

1. Read all lines from `manifest.jsonl`
2. Parse each line as JSON
3. Find the feature by ID
4. Update the status field
5. Write all lines back to `manifest.jsonl`

Example status update:
```
{"id":"F001",...,"status":"pending",...}
```
becomes:
```
{"id":"F001",...,"status":"completed",...}
```

## Output

After execution completes, provide:

1. Summary of features implemented with their IDs
2. Code patterns used (from `code/` directory)
3. Edge cases addressed (with IDs and descriptions)
4. Decisions applied (with IDs and how they influenced implementation)
5. **TDD compliance**: Confirmation that Red-Green-Refactor workflow was followed for each feature
6. **Code quality**: Confirmation that linting passed and formatting applied for all modified files
7. **Build and test results**: Confirmation that build passed and all tests passed for each feature
8. **Test coverage**: Summary of tests added for new functionality
9. Any failures encountered and resolution attempts
10. Links to commits made (verify decision IDs in commit messages)
11. Screenshots from E2E validation (if Playwright available)
12. Validation results compared against `README.md` acceptance criteria
13. **Documentation updates**: Summary of changes made to CLAUDE.md and README.md
14. **Pull request URL**: Link to the PR created for user to review and merge
15. Confirmation that plan was relocated to `dev/complete/`

## Example Usage

```
/orchestrate-plan dev/active/ui-updates
```

This will:

1. **Create branch** `plan/ui-updates` (or switch to it if resuming)
2. **If resuming**: Re-verify all "completed" features, reset any that fail verification
3. Read `dev/active/ui-updates/manifest.jsonl` with all field data
4. Load context from `context.md`, `decisions.md`, `edge-cases.md`, `testing-strategy.md`, `README.md`
5. List available code patterns in `code/` directory
6. Discover available MCP tools
7. Run `init.md` verification (F000)
8. **Execute features sequentially**:
   - For each pending feature in dependency order
   - Verify dependencies actually completed (run verification commands)
   - Spawn sub-agent for the feature
   - Verify all checks pass before marking complete
   - Continue to next feature
9. Track progress in `manifest.jsonl`
10. Run final E2E validation against `README.md` criteria
11. **Suggest documentation updates**:
    - Analyze CLAUDE.md and README.md in project root
    - Generate suggestions based on implemented features
    - Present diff-style suggestions for user approval
    - Apply approved updates and commit
12. **Push branch and create PR** (NEVER merge to main)
13. Move `dev/active/ui-updates` to `dev/complete/ui-updates` and commit

## Error Handling

- **Sub-agent timeout**: Retry once, then mark as failed
- **TDD violation**: Sub-agent wrote implementation before tests; must redo with proper TDD workflow
- **Missing test coverage**: Sub-agent must add tests for uncovered functionality before committing
- **Lint failure**: Sub-agent must fix all linting errors before committing
- **Format failure**: Sub-agent must apply formatting to all modified files before committing
- **Build failure**: Sub-agent must fix before committing; if unable, mark as failed
- **Test failure**: Sub-agent must fix before committing; if unable, mark as failed
- **Verification failure**: Do NOT mark as completed, mark as `failed` and ask user how to proceed
- **Dependency verification failure**: Reset dependency to `pending`, re-run it before continuing
- **Git conflict**: Pause and ask user for resolution
- **Missing files**: Abort with clear error message
- **Dependency not met**: Wait for dependency to complete (sequential execution)
- **Missing code_refs**: Warn but continue (code patterns are helpful but not blocking)
- **Decision IDs missing from commit**: Warn user, optionally amend commit
- **MCP tool unavailable**: Continue without that tool, note in output
- **Missing linter/formatter**: Use available tools; warn if project-specific config not found
- **Missing CLAUDE.md or README.md**: Skip documentation suggestions for missing files
- **Documentation update rejected**: Continue without updating; note in output
- **Branch already exists**: Switch to existing branch, re-verify all "completed" features
- **PR creation failure**: Retry once, then ask user for help

## Progress Tracking

The orchestrator updates `manifest.jsonl` in real-time. User can check progress anytime by reading the file:

```bash
# View status of all features
cat manifest.jsonl | jq -r '[.id, .status, .description] | @tsv'

# Count by status
cat manifest.jsonl | jq -r '.status' | sort | uniq -c
```

## Now Execute

1. **Create or switch to plan branch**:
   - Extract plan name from `$ARGUMENTS` (e.g., `ui-updates` from `dev/active/ui-updates`)
   - Create branch `plan/<plan-name>` or switch to it if it exists

2. **If resuming (branch exists)**: Re-verify all "completed" features
   - For each feature with status "completed", run its verification command
   - If verification fails, reset status to "pending"
   - Log which features were reset

3. Read `$ARGUMENTS/manifest.jsonl` to get the feature list and all field data

4. Read context files:
   - `$ARGUMENTS/context.md` for project context
   - `$ARGUMENTS/constraints.md` for global rules
   - `$ARGUMENTS/decisions.md` for architectural decisions
   - `$ARGUMENTS/edge-cases.md` for edge case definitions
   - `$ARGUMENTS/testing-strategy.md` for testing approach
   - `$ARGUMENTS/README.md` for orchestration guidance

5. List files in `$ARGUMENTS/code/` directory to know available code patterns

6. Discover available MCP tools (Playwright, Context7, Documentation, Sequential Thinking)

7. **Execute features SEQUENTIALLY** (one at a time, in dependency order):

   For each pending feature:

   a. **Verify dependencies actually complete**: Run verification command for each dependency
   b. If any dependency fails verification, reset it to pending and process it first
   c. Prepare enriched context:
      - Read its prompt file
      - Resolve `code_refs` by reading sections from `code/*.md` files
      - Look up `edge_cases` IDs in `edge-cases.md`
      - Look up `decisions` IDs in `decisions.md`
   d. **Spawn ONE sub-agent** with:
      - Full prompt content
      - Resolved code snippets
      - Edge case details
      - Decision details
      - Available MCP tools
      - **TDD workflow requirements**: Red-Green-Refactor cycle mandatory
      - **Pre-commit requirements**: Lint, format, build, and all tests must pass
      - Commit requirements (include decision IDs)
   e. **Wait for sub-agent to complete**
   f. **VERIFY COMPLETION YOURSELF** (do NOT trust sub-agent claims):
      - Run build command and confirm success
      - Run test suite and confirm all pass
      - Run the feature-specific verification command
      - Check git log for expected commit with decision IDs
   g. **Only if ALL verification passes**: Mark as `completed`
   h. **If ANY verification fails**: Mark as `failed`, ask user how to proceed
   i. Continue to next feature

8. Run final validation using `README.md` guidance and E2E prompt

9. **Suggest documentation updates**:
    - Read `CLAUDE.md` and `README.md` from project root (if they exist)
    - Analyze all completed features from manifest
    - Generate suggested updates for each documentation file
    - Present diff-style suggestions to user
    - Ask user to approve, modify, or skip each suggestion
    - Apply approved updates and commit separately

10. **Push branch and create PR (NEVER merge to main)**:
    - `git push -u origin plan/<plan-name>`
    - `gh pr create --title "feat: <plan-name>" --body "..."`
    - Return PR URL to user

11. Relocate the plan directory to `dev/complete/` and commit

**CRITICAL REMINDERS:**
- Execute features ONE AT A TIME (no parallel execution)
- VERIFY completion yourself (do not trust manifest or sub-agent claims)
- NEVER merge to main
- NEVER push to main
- Always create a PR for user review

Begin orchestration now.
