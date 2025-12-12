# Feature: F07 - Add Type Safety to Settings Parsing

## Context
F01-F06 completed: UI fixes, constants, and logger race condition fixed.

## Objective
Replace `any[]` type cast with proper TypeScript interfaces for hook configuration parsing.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the dashboard.ts file
- Add interface definitions near the top of the file with other types
- Update the parsing code to use the new interface

## Files to Modify
- `.claude/hooks/viewer/dashboard.ts` - Add interfaces and update type cast (~line 252)

## Implementation Details

### 1. Add interface definitions (near other type definitions):
```typescript
/**
 * Hook configuration entry from settings.json
 */
interface HookConfigEntry {
  command: string;
  timeout?: number;
  matcher?: Record<string, unknown>;
}

/**
 * Structure of hooks in settings.json
 */
interface HooksConfig {
  hooks?: Record<string, HookConfigEntry[]>;
}
```

### 2. Update the parsing code (~line 252):

Current code:
```typescript
for (const config of configs as any[]) {
```

Updated code:
```typescript
for (const config of configs as HooksConfig[]) {
```

Or if iterating over hook entries:
```typescript
for (const config of configs as HookConfigEntry[]) {
```

(Review the actual context to determine correct usage)

## Acceptance Criteria
- [ ] `HookConfigEntry` interface is defined
- [ ] `HooksConfig` interface is defined (if needed)
- [ ] `any[]` cast is replaced with typed cast
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/dashboard.ts
git commit -m "refactor(dashboard): add type safety to settings parsing"
```

## Next
Proceed to: `prompts/08-add-debug-logging.md`
