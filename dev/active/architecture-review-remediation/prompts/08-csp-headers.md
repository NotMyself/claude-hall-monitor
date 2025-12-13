# Feature: F008 - Content Security Policy Headers

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F007**: All critical security fixes completed

## Objective

Add Content Security Policy (CSP) headers to HTML responses to mitigate XSS attacks, particularly addressing the v-html vulnerability identified in the review.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D010**: CSP with 'self' and 'unsafe-inline' for styles. Vue.js single-file component uses inline styles, so can't use strict CSP without major refactor. Focus on script restrictions.

## Edge Cases to Handle

From `edge-cases.md`:
- No specific edge cases for CSP headers.

## Code References

Read these sections before implementing:
- `code/typescript.md#csp-header` - CSP header definition

## Constraints

- See `constraints.md` for global rules
- Only add CSP to HTML responses
- Don't break Vue.js functionality

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Add CSP header to serveFile() for HTML files |

## Implementation Details

Define the CSP header value (add near top of server.ts with other constants):

```typescript
/**
 * Content Security Policy for HTML responses.
 * Restricts script sources to prevent XSS.
 */
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",  // Vue.js needs inline scripts
  "style-src 'self' 'unsafe-inline'",   // Vue.js needs inline styles
  "img-src 'self' data:",               // Allow data: URIs for images
  "connect-src 'self'",                 // Only same-origin connections
  "frame-ancestors 'none'",             // Prevent framing (clickjacking)
].join("; ");
```

Update the `serveFile()` function to add CSP header for HTML files:

```typescript
// Before
async function serveFile(path: string): Promise<Response> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(file, {
    headers: { "Content-Type": getMimeType(path) },
  });
}

// After
async function serveFile(path: string): Promise<Response> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }

  const mimeType = getMimeType(path);
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
  };

  // Add CSP header for HTML files
  if (mimeType === "text/html") {
    headers["Content-Security-Policy"] = CSP_HEADER;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
  }

  return new Response(file, { headers });
}
```

## Acceptance Criteria

- [ ] HTML responses include Content-Security-Policy header
- [ ] HTML responses include X-Content-Type-Options: nosniff
- [ ] HTML responses include X-Frame-Options: DENY
- [ ] CSS and other file types don't get CSP headers
- [ ] Vue.js viewer still works (no console errors about CSP)
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
feat(viewer): add Content Security Policy headers

Add CSP to HTML responses to mitigate XSS attacks.
Also add X-Content-Type-Options and X-Frame-Options.

Implements: F008
Decisions: D010

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/09-promise-handling.md` (F009)
