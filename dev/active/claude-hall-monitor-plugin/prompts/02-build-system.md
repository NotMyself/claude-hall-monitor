# Feature: F002 - Build System Foundation

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project restructured - source files at `hooks/`
- **F001**: Plugin manifest created

## Objective

Create the build system that bundles TypeScript handlers and viewer to standalone JavaScript files.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D002**: Bundle to JavaScript — Eliminates `bun install` for users; inline all dependencies

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: Cross-platform paths → Use `node:path` join() for all paths
- **EC003**: Build failures → Handle errors gracefully, report which file failed
- **EC007**: Missing dependencies → Bun bundler inlines everything

## Code References

Read these sections before implementing:
- `code/typescript.md#build-script-core` - Build configuration and path utilities
- `code/typescript.md#bundle-building` - Bundling functions
- `code/json.md#package-json-updates` - package.json scripts

## Constraints

- See `constraints.md` for global rules
- Target: `bun` (not `node` or `browser`)
- Minify output for smaller bundle size
- No sourcemaps needed for production

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `build.ts` | Main build script |
| `hooks/package.json` | Add build scripts |

## Implementation Details

### build.ts Structure

```typescript
import { join } from "node:path";

const HANDLERS = [
  "session-start",
  "session-end",
  "user-prompt-submit",
  "pre-tool-use",
  "post-tool-use",
  "post-tool-use-failure",
  "notification",
  "stop",
  "subagent-start",
  "subagent-stop",
  "pre-compact",
  "permission-request",
];

async function build() {
  const rootDir = import.meta.dir;
  const handlersDir = join(rootDir, "hooks", "handlers");
  const viewerDir = join(rootDir, "hooks", "viewer");
  const distHandlers = join(rootDir, "dist", "handlers");
  const distViewer = join(rootDir, "dist", "viewer");

  // Clean dist
  await Bun.$`rm -rf dist`;
  await Bun.$`mkdir -p ${distHandlers} ${distViewer}`;

  // Build handlers
  console.log("Building handlers...");
  for (const handler of HANDLERS) {
    const entry = join(handlersDir, `${handler}.ts`);
    const result = await Bun.build({
      entrypoints: [entry],
      outdir: distHandlers,
      target: "bun",
      minify: true,
    });

    if (!result.success) {
      console.error(`Failed to build ${handler}:`);
      for (const log of result.logs) {
        console.error(log);
      }
      process.exit(1);
    }
    console.log(`  ✓ ${handler}.js`);
  }

  // Build viewer
  console.log("\nBuilding viewer...");
  const viewerResult = await Bun.build({
    entrypoints: [join(viewerDir, "server.ts")],
    outdir: distViewer,
    target: "bun",
    minify: true,
  });

  if (!viewerResult.success) {
    console.error("Failed to build viewer:");
    for (const log of viewerResult.logs) {
      console.error(log);
    }
    process.exit(1);
  }
  console.log("  ✓ server.js");

  console.log("\n✓ Build complete!");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### package.json Updates

Add to `hooks/package.json` scripts:

```json
{
  "scripts": {
    "build": "bun run ../build.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

Or add to root `package.json` (create if needed):

```json
{
  "name": "claude-hall-monitor",
  "version": "1.0.0",
  "scripts": {
    "build": "bun run build.ts",
    "typecheck": "cd hooks && tsc --noEmit",
    "test": "cd hooks && bun run test",
    "test:run": "cd hooks && bun run test:run"
  }
}
```

## Acceptance Criteria

- [ ] `build.ts` exists at project root
- [ ] Running `bun run build.ts` completes without errors
- [ ] `dist/handlers/` contains 12 `.js` files
- [ ] `dist/viewer/server.js` exists
- [ ] All bundles are minified
- [ ] No external imports in bundles (dependencies inlined)

## Verification

```bash
# Run the build
bun run build.ts

# Verify handler count
ls dist/handlers/*.js | wc -l
# Expected: 12

# Verify viewer
test -f dist/viewer/server.js && echo "✓ viewer built"

# Test a handler runs
echo '{"session_id":"test"}' | bun run dist/handlers/session-start.js
```

## Commit

```bash
git add build.ts
git add package.json  # if created at root
git commit -m "feat(build): add TypeScript bundling with Bun

Create build.ts that:
- Bundles all 12 handlers to dist/handlers/
- Bundles viewer to dist/viewer/
- Minifies output, inlines dependencies

Implements: F002
Decisions: D002"
```

## Next

Proceed to: `prompts/03-update-imports.md` (F003)
