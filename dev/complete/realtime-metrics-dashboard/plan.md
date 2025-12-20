# Realtime Metrics Dashboard

## Summary

Build a plan-centric realtime dashboard using React + Vite + shadcn/ui. Plan orchestration is the hero feature - the dashboard is designed around monitoring multiple concurrent plan executions, with metrics and session history as supporting context.

**Depends on**: `dev/active/realtime-data-collection/plan.md` (API layer must be implemented first)

## Requirements

1. **Plan-Centric Design**: Active orchestrations front and center on Overview
2. **Multiple Concurrent Plans**: Support 3+ running plans simultaneously
3. **React + Vite Setup**: Modern React 19 app with Vite, Bun runtime
4. **shadcn/ui Integration**: Full component library with Tailwind CSS
5. **Realtime Updates**: SSE integration for live plan progress and metrics
6. **Historical Review**: Plans and Sessions pages for reviewing past activity
7. **Responsive Design**: Works on desktop and tablet viewports
8. **Dark/Light Theme**: Preserves existing warm color palette

## Navigation Structure

```
Sidebar:
  - Overview (active plans + metrics summary)
  - Plans (detailed plan management & history)
  - Sessions (historical session review)
  - Settings
```

## Page Designs

### Overview Page (Default Landing)

Active orchestrations prominently at top, metrics below for context.

```
+------+-------------------------------------------------------------------+
| [=]  |  Overview                                            [◐] [Theme] |
+------+-------------------------------------------------------------------+
|      |                                                                   |
| ━━━━ |  ACTIVE ORCHESTRATIONS                                           |
| 📊   |  ┌─────────────────────────────────────────────────────────────┐ |
|*Over*|  │ realtime-data-collection                        ● Running   │ |
|      |  │ ████████████████░░░░░░░░  Feature 7/10         ETA: ~15m   │ |
| 📋   |  │  ✓ types.ts  ✓ schema.sql  ✓ pricing.ts  ✓ database.ts     │ |
| Plans|  │  ◐ cost-calculator.ts ← in_progress                         │ |
|      |  │  ○ plan-events.ts  ○ aggregation.ts  ○ index.ts             │ |
| 👥   |  └─────────────────────────────────────────────────────────────┘ |
| Sess |                                                                   |
|      |  ┌─────────────────────────────────────────────────────────────┐ |
| ───  |  │ api-authentication-layer                        ● Running   │ |
| ⚙️   |  │ ██████░░░░░░░░░░░░░░░░░░  Feature 3/12         ETA: ~45m   │ |
| Sett |  │  ✓ auth-types.ts  ✓ jwt-utils.ts                            │ |
|      |  │  ◐ middleware.ts ← in_progress                              │ |
|      |  └─────────────────────────────────────────────────────────────┘ |
|      |                                                                   |
|      |  METRICS TODAY                                      [Last 24h ▼] |
|      |  +-------------+ +-------------+ +-------------+ +-------------+ |
|      |  | Cost        | | Tokens      | | Sessions    | | Plans Done  | |
|      |  | $24.57      | | 2.4M        | | 3 active    | | 5 today     | |
|      |  +-------------+ +-------------+ +-------------+ +-------------+ |
|      |                                                                   |
|      |  +---------------------------+  +-------------------------------+ |
|      |  | Cost Trend                |  | Tokens by Model               | |
|      |  | [Area Chart]              |  | [Horizontal Bar Chart]        | |
|      |  +---------------------------+  +-------------------------------+ |
+------+-------------------------------------------------------------------+
```

### Plans Page

Tabs for Active/Completed/Failed. Split view with list and detail panels.

```
+------+-------------------------------------------------------------------+
| 📋   |  [ Active (3) ]  [ Completed (12) ]  [ Failed (1) ]              |
|*Plan*|                                                                   |
|      |  ┌─────────────────────────────┐  ┌─────────────────────────────┐|
|      |  │ PLAN LIST                   │  │ PLAN DETAIL                 │|
|      |  │ ● realtime-data-collection  │  │ realtime-data-collection    │|
|      |  │   ████████░░ 70%  7/10      │  │ Status: Running             │|
|      |  │ ● api-authentication        │  │ Started: 14:15:00           │|
|      |  │   ██░░░░░░ 25%  3/12        │  │ Duration: 32m 15s           │|
|      |  │ ● database-migration        │  │                             │|
|      |  │   ██████████ 100%  5/5      │  │ FEATURES (by layer)         │|
|      |  └─────────────────────────────┘  │  ✓ types.ts         12s     │|
|      |                                   │  ◐ cost-calc.ts  ← running  │|
|      |  ┌────────────────────────────────┴─────────────────────────────┐|
|      |  │ ORCHESTRATION TIMELINE                                       │|
|      |  │ realtime-data...  ●━━━━━━━━●━━━━━━━●━━━━━━●━━━◐━━━○━━━○━━━○  │|
|      |  │ api-auth...       ●━━━━━●━━━━◐━━━━━○━━━━━○━━━━○━━━○━━━○━━━○  │|
|      |  │ database-mig...   ●━━●━━●━━●━━●━━●━━━━━[PR]                   │|
|      |  └──────────────────────────────────────────────────────────────┘|
+------+-------------------------------------------------------------------+
```

### Sessions Page

Historical session review with filters and detail view.

```
+------+-------------------------------------------------------------------+
| 👥   |  [Search...]  [All projects ▼]  [Last 7 days ▼]  [Export ↓]     |
|*Sess*|                                                                   |
|      |  ┌───────────────────────────┐  ┌───────────────────────────────┐|
|      |  │ SESSION LIST              │  │ SESSION DETAIL                │|
|      |  │ abc123def456...           │  │ Project: claude-hall-monitor  │|
|      |  │ Today 14:15 · 45m · $4.20 │  │ Duration: 45m 32s             │|
|      |  │                           │  │ Cost: $4.20 · Tokens: 245K    │|
|      |  │ def456789abc...           │  │                               │|
|      |  │ Today 12:30 · 1h · $8.50  │  │ TOOL USAGE                    │|
|      |  │                           │  │ Bash  ████████████  45        │|
|      |  │ ghi789012def...           │  │ Read  ██████████    38        │|
|      |  │ Yesterday · 2h · $12.30   │  │ Edit  ████████      28        │|
|      |  └───────────────────────────┘  └───────────────────────────────┘|
+------+-------------------------------------------------------------------+
```

## Architecture

```
hooks/viewer/                        # React dashboard
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Root with router
│   ├── index.css                    # Tailwind imports
│   ├── lib/
│   │   ├── utils.ts                 # shadcn/ui cn() utility
│   │   └── api.ts                   # API client functions
│   ├── hooks/
│   │   ├── use-sse.ts               # SSE connection hook
│   │   ├── use-plans.ts             # Plans data + realtime
│   │   ├── use-metrics.ts           # Metrics data fetching
│   │   └── use-sessions.ts          # Sessions data fetching
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx      # Main navigation
│   │   │   ├── header.tsx           # Page header
│   │   │   └── page-container.tsx   # Page wrapper
│   │   ├── plans/
│   │   │   ├── plan-card.tsx        # Expandable plan card
│   │   │   ├── plan-card-compact.tsx# Compact for many plans
│   │   │   ├── plan-list.tsx        # Plan list panel
│   │   │   ├── plan-detail.tsx      # Plan detail panel
│   │   │   ├── feature-list.tsx     # Features grouped by layer
│   │   │   ├── orchestration-timeline.tsx
│   │   │   └── active-orchestrations.tsx
│   │   ├── metrics/
│   │   │   ├── stat-card.tsx        # Single stat card
│   │   │   ├── metrics-grid.tsx     # Grid of stat cards
│   │   │   ├── cost-chart.tsx       # Cost trend area chart
│   │   │   └── tokens-chart.tsx     # Tokens by model bar chart
│   │   └── sessions/
│   │       ├── session-list.tsx     # Session list panel
│   │       ├── session-detail.tsx   # Session detail panel
│   │       └── tool-usage-chart.tsx # Tool usage breakdown
│   ├── pages/
│   │   ├── overview.tsx             # Overview page
│   │   ├── plans.tsx                # Plans page
│   │   ├── sessions.tsx             # Sessions page
│   │   └── settings.tsx             # Settings page
│   └── types/
│       ├── metrics.ts               # MetricEntry, TokenUsage, CostBreakdown
│       └── plans.ts                 # PlanEvent, Plan, Feature types
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind + shadcn theme
├── tsconfig.json                    # TypeScript config
├── components.json                  # shadcn/ui config
└── package.json                     # Dependencies
```

## Component Hierarchy

```
App
├── Sidebar
│   ├── Logo
│   ├── NavItem: Overview (badge: active plan count)
│   ├── NavItem: Plans (badge: active count)
│   ├── NavItem: Sessions
│   ├── Separator
│   └── NavItem: Settings
│
├── Header
│   ├── PageTitle
│   ├── ConnectionStatus (● Connected)
│   └── ThemeToggle
│
└── MainContent
    ├── OverviewPage
    │   ├── ActiveOrchestrations (SSE realtime)
    │   │   └── PlanCard[] (expanded view)
    │   ├── MetricsGrid
    │   │   ├── StatCard: Cost
    │   │   ├── StatCard: Tokens
    │   │   ├── StatCard: Sessions
    │   │   └── StatCard: Plans Completed
    │   └── ChartsRow
    │       ├── CostTrendChart
    │       └── TokensByModelChart
    │
    ├── PlansPage
    │   ├── TabBar: [Active, Completed, Failed]
    │   ├── PlanList (left panel)
    │   ├── PlanDetail (right panel)
    │   │   ├── PlanHeader
    │   │   ├── ProgressBar
    │   │   └── FeatureList (grouped by layer)
    │   └── OrchestrationTimeline (bottom)
    │
    └── SessionsPage
        ├── FilterBar
        ├── SessionList (left panel)
        └── SessionDetail (right panel)
```

## Data Models

### From Data Collection Plan

```typescript
interface MetricEntry {
  id: string;
  timestamp: string;
  session_id: string;
  project_path: string;
  source: 'hook' | 'transcript' | 'telemetry' | 'custom';
  event_type: string;
  event_category: 'tool' | 'api' | 'session' | 'user' | 'custom';
  model?: string;
  tokens?: TokenUsage;
  cost?: CostBreakdown;
  tool_name?: string;
  tool_duration_ms?: number;
  tool_success?: boolean;
  data: Record<string, unknown>;
  tags: string[];
}

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

interface CostBreakdown {
  input_cost_usd: number;
  output_cost_usd: number;
  cache_read_cost_usd: number;
  cache_creation_cost_usd: number;
  total_cost_usd: number;
}

interface PlanEvent {
  id: string;
  timestamp: string;
  session_id: string;
  event_type: 'plan_created' | 'plan_optimized' | 'feature_created'
            | 'orchestration_started' | 'feature_started' | 'feature_completed'
            | 'feature_failed' | 'orchestration_completed' | 'pr_created';
  plan_name: string;
  plan_path: string;
  feature_id?: string;
  feature_description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  pr_url?: string;
  data: Record<string, unknown>;
}
```

### Dashboard-Specific Types

```typescript
interface Plan {
  name: string;
  path: string;
  status: 'active' | 'completed' | 'failed';
  features: Feature[];
  featureCount: number;
  completedCount: number;
  inProgressCount: number;
  failedCount: number;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  eta?: number;  // estimated minutes remaining
  prUrl?: string;
  sessionId: string;
}

interface Feature {
  id: string;
  title: string;
  layer: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration?: number;  // seconds
  error?: string;
}

interface DashboardStats {
  total_cost_usd: number;
  cost_change_percent: number;
  total_tokens: number;
  token_change_percent: number;
  active_sessions: number;
  plans_completed_today: number;
}

interface Session {
  session_id: string;
  project_path: string;
  project_name: string;
  started_at: string;
  ended_at?: string;
  duration: number;
  cost_usd: number;
  total_tokens: number;
  model: string;
  tool_usage: Record<string, number>;
  summary?: string;
}
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/metrics` | GET | Query metrics with filters |
| `/api/metrics/aggregations` | GET | Aggregated data by period |
| `/api/metrics/costs` | GET | Cost analysis and breakdown |
| `/api/dashboard/stats` | GET | Dashboard summary stats |
| `/api/plans` | GET | List all plans |
| `/api/plans/:name` | GET | Get plan detail with features |
| `/api/plans/events` | GET | Query plan orchestration events |
| `/api/sessions` | GET | List sessions with filters |
| `/api/sessions/:id` | GET | Get session detail |
| `/events/plans` | SSE | Realtime plan updates |
| `/events/metrics` | SSE | Realtime metrics stream |

## shadcn/ui Components Required

### Layout
- `sidebar` - Main navigation
- `sheet` - Mobile navigation drawer
- `separator` - Visual dividers
- `scroll-area` - Scrollable containers

### Data Display
- `card` - Stat cards, plan cards, session cards
- `badge` - Status indicators, counts
- `progress` - Plan progress bars
- `table` - Completed plans, sessions list
- `tabs` - Active/Completed/Failed tabs
- `chart` - Recharts wrapper (area, bar)

### Core UI
- `button` - Actions
- `input` - Search
- `select` - Dropdowns, filters
- `dropdown-menu` - Action menus
- `tooltip` - Hover info
- `skeleton` - Loading states

### Feedback
- `toast` - Notifications
- `alert` - Error messages

## Implementation Order

### Phase 1: Project Setup
1. Initialize Vite + React in `hooks/viewer/`
2. Configure Tailwind CSS with existing color palette
3. Install and configure shadcn/ui
4. Set up React Router
5. Create base layout (sidebar, header)

### Phase 2: Core Infrastructure
6. Implement API client (`lib/api.ts`)
7. Create SSE hook (`hooks/use-sse.ts`)
8. Define TypeScript types
9. Create data fetching hooks

### Phase 3: Overview Page (Priority)
10. Build ActiveOrchestrations component
11. Build PlanCard (expanded view)
12. Implement realtime SSE updates
13. Build MetricsGrid with stat cards
14. Implement cost/token charts
15. Assemble Overview page

### Phase 4: Plans Page
16. Build PlanList component
17. Build PlanDetail with FeatureList
18. Implement OrchestrationTimeline
19. Add tabs for Active/Completed/Failed
20. Assemble Plans page

### Phase 5: Sessions Page
21. Build SessionList component
22. Build SessionDetail with ToolUsageChart
23. Add filters and search
24. Assemble Sessions page

### Phase 6: Polish
25. Settings page (theme, preferences)
26. Keyboard shortcuts
27. Loading states and error handling
28. Responsive design adjustments

### Phase 7: Integration
29. Update `server.ts` to serve React build
30. Configure Vite build output to `dist/`
31. Update `hooks/build.ts`
32. Integration testing

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/viewer/index.html` | HTML entry (replaces existing) |
| `hooks/viewer/vite.config.ts` | Vite configuration |
| `hooks/viewer/tailwind.config.ts` | Tailwind + theme |
| `hooks/viewer/tsconfig.json` | TypeScript for React |
| `hooks/viewer/components.json` | shadcn/ui config |
| `hooks/viewer/package.json` | Update with React deps |
| `hooks/viewer/src/**/*.tsx` | All React components |
| `hooks/viewer/src/**/*.ts` | Hooks, utils, types |

## Files to Delete

| File | Reason |
|------|--------|
| `hooks/viewer/index.html` | Replaced by React app |
| `hooks/viewer/styles/theme.css` | Replaced by Tailwind |
| `hooks/viewer/dashboard.ts` | Logic moves to React |
| `hooks/viewer/__tests__/dashboard.test.ts` | Vue tests |
| `hooks/viewer/__tests__/components.test.ts` | Vue tests |

## Dependencies

### Production
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.0.0",
  "recharts": "^2.15.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.6.0",
  "lucide-react": "^0.468.0"
}
```

### Development
```json
{
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0",
  "@vitejs/plugin-react": "^4.3.0",
  "vite": "^6.0.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0"
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+1` | Go to Overview |
| `Cmd+2` | Go to Plans |
| `Cmd+3` | Go to Sessions |
| `Cmd+,` | Open Settings |
| `Cmd+B` | Toggle Sidebar |
| `Esc` | Close dialogs |

## Real-time Updates

SSE connections for live updates:
- `/events/plans` - Plan status changes, feature progress
- `/events/metrics` - New metrics as they arrive

Plan cards update in real-time:
- Progress bar animates smoothly
- Feature status transitions (○ → ◐ → ✓)
- ETA recalculates
- New plans appear at top
- Completed plans animate to Completed tab

## Color & Theme

Preserves existing warm palette:
- Primary: #D4A27F (terracotta)
- Background Light: #FDFDF7
- Background Dark: #09090B
- Success: #10B981 (green)
- Running: #3B82F6 (blue)
- Failed: #EF4444 (red)
- Pending: #9CA3AF (gray)

Status indicators:
- ● Running (blue, pulsing animation)
- ✓ Complete (green)
- ✗ Failed (red)
- ◐ In Progress (blue, animated)
- ○ Pending (gray)

## Testing Strategy

- **Component Tests**: Vitest + React Testing Library
- **Hook Tests**: `@testing-library/react-hooks`
- **Integration Tests**: Page components with mocked API
- Use existing vitest configuration

## Edge Cases

| Case | Handling |
|------|----------|
| SSE disconnection | Auto-reconnect with exponential backoff |
| No active plans | Show empty state with helpful message |
| Many concurrent plans (5+) | Switch to compact card view |
| API errors | Toast notifications + error boundaries |
| Large session list | Virtual scrolling |
| Theme persistence | localStorage with system fallback |
| Mobile viewport | Collapse sidebar to sheet |

## Decisions

| Decision | Rationale |
|----------|-----------|
| Plan-centric design | User requirement - orchestration is primary use case |
| React + Vite | Native shadcn/ui support, modern tooling |
| Sidebar layout | More room for plan cards and charts |
| Split panel views | Master-detail pattern for plans/sessions |
| Orchestration timeline | Visual representation of parallel plan execution |
| Preserve color palette | Consistency with existing viewer aesthetic |
| SSE for realtime | Already implemented in data collection plan |
