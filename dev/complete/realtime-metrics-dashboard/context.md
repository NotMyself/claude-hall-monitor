# Project Context

## Summary

Build a plan-centric realtime dashboard using React + Vite + shadcn/ui. Plan orchestration is the hero feature - the dashboard is designed around monitoring multiple concurrent plan executions, with metrics and session history as supporting context.

**Why**: Users need visibility into multiple concurrent plan orchestrations running simultaneously. The current viewer shows session metrics but lacks plan-specific monitoring. This dashboard makes plan execution the primary focus, with the ability to track 3+ running plans at once, see real-time progress updates, and review historical plan outcomes.

**Depends on**: `dev/active/realtime-data-collection/plan.md` - The API layer must be implemented first to provide the data endpoints and SSE streams this dashboard consumes.

## Architecture Vision

A modern React 19 application built with Vite and styled with shadcn/ui components. The architecture follows a clean separation of concerns:

- **Presentation Layer**: React components organized by feature (plans, metrics, sessions)
- **Data Layer**: Custom hooks that wrap API clients and SSE connections for reactive data flow
- **Styling**: Tailwind CSS with shadcn/ui components, preserving the warm terracotta color palette from the existing viewer
- **Realtime**: Server-Sent Events (SSE) for live updates to plan progress and metrics without polling

The component hierarchy uses a sidebar navigation pattern with split-panel views for master-detail layouts (plan list → plan detail, session list → session detail). The Overview page prominently displays active orchestrations at the top, with supporting metrics below - reinforcing that plans are the primary focus.

Key architectural patterns:
- Progressive enhancement: Components load with skeletons, then populate with data
- Error boundaries: Graceful degradation when API calls fail
- SSE resilience: Auto-reconnect with exponential backoff on connection loss
- Responsive design: Sidebar collapses to sheet drawer on mobile

## Goals

- **Plan Visibility**: Make active orchestrations immediately visible on landing
- **Concurrent Monitoring**: Support tracking 3+ plans running simultaneously
- **Realtime Updates**: Live progress updates via SSE without page refresh
- **Historical Review**: Browse completed plans and sessions with filtering
- **Performance**: Smooth animations, virtual scrolling for large lists
- **Developer Experience**: Type-safe TypeScript, well-tested components, clear separation of concerns
- **Visual Consistency**: Maintain warm color palette and aesthetic from existing viewer
