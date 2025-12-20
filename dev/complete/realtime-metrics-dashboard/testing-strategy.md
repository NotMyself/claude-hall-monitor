# Testing Strategy

## Philosophy

Test behavior, not implementation. Focus on user interactions and data flow rather than internal component state. Use the existing Vitest configuration from the project root.

## Test Types

### Unit Tests
- **Components**: Test rendering, user interactions, prop handling
- **Hooks**: Test state management, side effects, error handling
- **Utilities**: Test pure functions (formatters, calculators, validators)
- **Tools**: Vitest + React Testing Library + happy-dom

### Integration Tests
- **Pages**: Test complete page composition with mocked API responses
- **Data Flow**: Test hooks + API client integration with mock fetch
- **SSE**: Test realtime updates with mock EventSource
- **Tools**: Vitest + React Testing Library with MSW (Mock Service Worker)

### End-to-End Tests
- **User Flows**: Test complete scenarios (viewing plans, filtering sessions)
- **Realtime**: Test SSE integration with actual server
- **Tools**: Playwright (if available via MCP)

## Patterns

### Component Testing Pattern
```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test('PlanCard displays plan name and progress', () => {
  const plan = { name: 'test-plan', completedCount: 7, featureCount: 10 };
  render(<PlanCard plan={plan} />);

  expect(screen.getByText('test-plan')).toBeInTheDocument();
  expect(screen.getByText('7/10')).toBeInTheDocument();
});
```

### Hook Testing Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

test('use-sse reconnects on disconnect', async () => {
  const mockEventSource = vi.fn();
  global.EventSource = mockEventSource;

  const { result } = renderHook(() => useSSE('/events/plans'));

  // Simulate disconnect
  mockEventSource.mock.instances[0].onerror();

  await waitFor(() => {
    expect(mockEventSource).toHaveBeenCalledTimes(2); // Initial + reconnect
  });
});
```

### Integration Testing Pattern
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { expect, test } from 'vitest';

const server = setupServer(
  rest.get('/api/plans', (req, res, ctx) => {
    return res(ctx.json([{ name: 'test-plan', status: 'active' }]));
  })
);

test('PlansPage loads and displays plans', async () => {
  render(<PlansPage />);

  await waitFor(() => {
    expect(screen.getByText('test-plan')).toBeInTheDocument();
  });
});
```

## Coverage Goals

- **Components**: 80%+ coverage for user-facing components
- **Hooks**: 90%+ coverage for data management hooks
- **Utilities**: 95%+ coverage for pure functions
- **Pages**: Integration tests for all major user flows

## Test Organization

```
src/
├── components/
│   ├── plans/
│   │   ├── plan-card.tsx
│   │   └── __tests__/
│   │       └── plan-card.test.tsx
│   └── metrics/
│       ├── stat-card.tsx
│       └── __tests__/
│           └── stat-card.test.tsx
├── hooks/
│   ├── use-sse.ts
│   └── __tests__/
│       └── use-sse.test.ts
└── pages/
    ├── overview.tsx
    └── __tests__/
        └── overview.test.tsx
```

## Mocking Strategy

- **API Calls**: Mock with MSW for integration tests, vi.fn() for unit tests
- **SSE**: Mock EventSource globally
- **Router**: Use MemoryRouter for isolated component tests
- **Time**: Mock Date.now() and setTimeout for animation tests
- **LocalStorage**: Mock window.localStorage for theme tests

## Verification Commands

- Run all tests: `bun test`
- Run with coverage: `bun test --coverage`
- Run specific file: `bun test plan-card.test.tsx`
- Watch mode: `bun test --watch`
- Type checking: `bun run tsc --noEmit`
