# Architectural Decisions

| ID | Decision | Rationale | Affected Features |
|----|----------|-----------|-------------------|
| D001 | Plan-centric design with orchestrations at top of Overview | User requirement - orchestration monitoring is the primary use case, metrics are supporting context | F013, F026 |
| D002 | React 19 + Vite instead of Vue | Native shadcn/ui support, modern tooling, faster builds, better TypeScript integration | F001 |
| D003 | Sidebar navigation layout | Provides more horizontal space for plan cards and charts compared to top navigation | F008 |
| D004 | Split panel views for Plans and Sessions pages | Master-detail pattern allows browsing lists while viewing details without navigation | F014, F015, F022, F023, F027, F028 |
| D005 | Orchestration timeline visualization | Visual representation shows parallel plan execution and helps identify bottlenecks | F017 |
| D006 | Preserve warm terracotta color palette | Maintains consistency with existing viewer aesthetic, avoids jarring visual change for users | F002 |
| D007 | SSE for realtime updates instead of polling | Already implemented in data collection API, more efficient than polling, provides instant updates | F006, F013 |
