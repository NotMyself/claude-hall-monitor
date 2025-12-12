# Feature: F08 - Add Debug Logging for Caught Errors

## Context
F01-F07 completed: UI fixes, constants, logger, and type safety done.

## Objective
Replace empty catch blocks with `console.debug()` logging to aid troubleshooting while keeping errors non-fatal.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify catch blocks in `dashboard.ts`
- Use `console.debug()` (not `console.log` or `console.error`)
- Keep the existing return behavior (empty arrays, defaults, etc.)
- Include meaningful context in debug messages

## Files to Modify
- `.claude/hooks/viewer/dashboard.ts` - Add debug logging to empty catch blocks

## Implementation Details

Find all empty or silent catch blocks and add debug logging:

### Pattern to find:
```typescript
} catch {
  return [];
}
```
or
```typescript
} catch (err) {
  // silent
}
```

### Replace with:
```typescript
} catch (err) {
  console.debug('[DashboardService] Failed to <operation>:', err);
  return [];
}
```

### Examples of what to change:

```typescript
// Before
} catch {
  return [];
}

// After
} catch (err) {
  console.debug('[DashboardService] Failed to parse hooks config:', err);
  return [];
}
```

```typescript
// Before
} catch {
  return { hooks: [], commands: [], skills: [] };
}

// After
} catch (err) {
  console.debug('[DashboardService] Failed to load configuration:', err);
  return { hooks: [], commands: [], skills: [] };
}
```

## Acceptance Criteria
- [ ] All empty catch blocks in `dashboard.ts` have debug logging
- [ ] Debug messages include `[DashboardService]` prefix for filtering
- [ ] Debug messages describe what operation failed
- [ ] Error objects are passed to `console.debug`
- [ ] Return behavior remains unchanged
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/dashboard.ts
git commit -m "refactor(dashboard): add debug logging for caught errors"
```

## Next
Proceed to: `prompts/09-standardize-handler-async.md`
