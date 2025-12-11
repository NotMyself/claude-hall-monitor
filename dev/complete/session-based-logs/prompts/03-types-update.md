# Feature: F03 - Session Types

## Context
Config now supports per-session log paths.

## Objective
Add TypeScript interfaces for session metadata.

## Constraints
- Reference: See constraints.md
- Keep existing types unchanged

## Files to Modify
- `.claude/hooks/viewer/types.ts`

## Implementation Details

Add after existing types:
```typescript
export interface SessionInfo {
  session_id: string;
  file_path: string;
  first_entry: string;   // ISO timestamp
  last_entry: string;    // ISO timestamp
  entry_count: number;
  size_bytes: number;
}

export interface SessionListResponse {
  sessions: SessionInfo[];
  current_session: string | null;
}
```

## Acceptance Criteria
- [ ] SessionInfo interface exported with all 6 fields
- [ ] SessionListResponse interface exported
- [ ] Existing types unchanged

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit
```bash
git add .claude/hooks/viewer/types.ts
git commit -m "feat(hooks): add session metadata types"
```

## Next
Proceed to: prompts/04-watcher-refactor.md
