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

Available code references:
- `code/typescript.md` - Types, utilities, API functions, hooks, components
- `code/css.md` - Theme config, animations, layouts, component styles
- `code/bash.md` - Setup, development, testing, build commands
- `code/html.md` - Templates, configs, entry points

## Testing Philosophy

See `testing-strategy.md` for the holistic testing approach.

Use Vitest + React Testing Library for all component and hook tests. Every feature with components or hooks must include tests.

## MCP Tools

These tools may be available to assist implementation. Check availability before use.

- **Playwright MCP** (optional): `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_console_messages` for E2E testing. Use `host.docker.internal` instead of `localhost` for local servers when running in Docker.
- **Context7 MCP** (optional): `resolve-library-id`, `get-library-docs` for fetching up-to-date library documentation.
- **Documentation MCP** (optional): Search Microsoft/Azure docs for official guidance.

## Rules

### Scope
- **One feature per session** - Do not implement features beyond the current prompt's scope
- It is unacceptable to implement features outside your assigned scope
- If you discover additional work needed, note it in your commit message but do not implement it

### Quality
- **Type safety**: All TypeScript must pass `bun run tsc --noEmit` with no errors
- **Test coverage**: Components and hooks must have tests. Aim for 80%+ coverage
- **Error handling**: All API calls must handle errors gracefully with try-catch
- **Accessibility**: Use semantic HTML, ARIA labels where needed, keyboard navigation support

### Code Organization
- **File naming**: Use kebab-case for files (e.g., `plan-card.tsx`, `use-sse.ts`)
- **Component naming**: Use PascalCase for components (e.g., `PlanCard`, `ActiveOrchestrations`)
- **Hook naming**: Prefix custom hooks with `use` (e.g., `useSSE`, `usePlans`)
- **Type naming**: Use PascalCase for types/interfaces (e.g., `Plan`, `Feature`, `DashboardStats`)

### Imports
- Use path aliases: `@/components/*`, `@/hooks/*`, `@/lib/*`, `@/types/*`, `@/pages/*`
- Group imports: React first, then third-party, then local
- Example:
  ```typescript
  import { useEffect, useState } from 'react';
  import { Card, CardContent } from '@/components/ui/card';
  import { usePlans } from '@/hooks/use-plans';
  import { type Plan } from '@/types/plans';
  ```

### Styling
- Use Tailwind CSS utility classes - avoid writing custom CSS unless necessary
- Use shadcn/ui components for consistency
- Follow the warm terracotta color palette from `code/css.md#theme-configuration`
- Ensure dark mode support using `dark:` variants

### Git Workflow
- **Commit after each feature** - Do not batch multiple features into one commit
- **Run verification** before committing - Ensure tests pass and types check
- **Use conventional commits**: `feat(scope): description` or `fix(scope): description`
- **Reference feature ID**: Include `Implements: F0XX` in commit body
- **Reference decisions**: Include `Decisions: D0XX` if applicable

### Dependencies
- Use Bun as package manager (`bun add`, not `npm install`)
- Only add dependencies explicitly mentioned in prompts or code references
- Prefer existing dependencies over adding new ones
- Document why new dependencies are needed if you must add them

### shadcn/ui Components
- Install components using `bun x shadcn@latest add <component>`
- Do not manually create shadcn/ui components - always use the CLI
- Component configurations are in `components.json`
- Custom shadcn/ui components go in `src/components/ui/`

### API Integration
- API base URL: `http://localhost:3456` (dev), proxied through Vite
- SSE endpoints: `/events/plans`, `/events/metrics`
- REST endpoints: `/api/*` (see `code/typescript.md#api-functions` for full list)
- Handle API errors with `APIError` class and toast notifications

### Performance
- Use React.memo() for expensive components
- Implement virtual scrolling for lists with 100+ items
- Lazy load heavy dependencies where possible
- Optimize bundle size - check with `bun run build`

### Browser Support
- Target modern browsers (Chrome/Edge/Firefox/Safari latest 2 versions)
- No IE11 support required
- Use modern ES features (ES2020+)

### File Locations
All work happens in `hooks/viewer/`:
- Components: `src/components/{ui,layout,plans,metrics,sessions}/`
- Hooks: `src/hooks/`
- Pages: `src/pages/`
- Types: `src/types/`
- Utils: `src/lib/`
- Config files: Root of `hooks/viewer/`

### Verification
Every feature must include a verification command to confirm success:
- Type checking: `bun run tsc --noEmit`
- Tests: `bun test <file>.test.tsx`
- Build: `bun run build`
- Dev server: `bun run dev` (manual check)

### Documentation
- Add JSDoc comments for complex functions
- Document props with TypeScript interfaces
- Include usage examples in component test files
- Update this README if you discover new patterns

## Prohibited Actions
- ❌ Do not modify files outside `hooks/viewer/` directory
- ❌ Do not implement multiple features in one prompt
- ❌ Do not skip tests - every component/hook needs tests
- ❌ Do not commit without running verification commands
- ❌ Do not add dependencies without justification
- ❌ Do not write custom CSS for things Tailwind can handle
- ❌ Do not use `npm` or `yarn` - use `bun` exclusively
