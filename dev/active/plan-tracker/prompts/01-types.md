# Feature: types - Plan Tracker Type Definitions

## Context

The viewer already has types for hooks, sessions, and dashboard data in `.claude/hooks/viewer/types.ts`. We need to add types for plan tracking.

## Objective

Add TypeScript interfaces for plan tracking data structures to `types.ts`.

## Constraints

- Reference: See constraints.md for global rules
- Add types at the end of the existing file
- Use consistent naming with existing types
- Export all new types

## Files to Create/Modify

- `.claude/hooks/viewer/types.ts` - Add plan tracking types

## Implementation Details

Add these interfaces:

```typescript
/**
 * Feature status in a plan
 */
export type FeatureStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * A single feature in a plan
 */
export interface PlanFeature {
  id: string;
  title: string;
  layer: number;
  status: FeatureStatus;
  description: string;
  acceptanceCriteria: string[];
  verification: string;
  dependencies: string[];
  files: string[];
}

/**
 * Complete plan data from features.json
 */
export interface PlanData {
  project: string;
  version: string;
  description: string;
  features: PlanFeature[];
  layers: Record<string, string>;
}

/**
 * Summary info for plan list
 */
export interface PlanInfo {
  name: string;
  path: string;
  project: string;
  description: string;
  featureCount: number;
  completedCount: number;
  inProgressCount: number;
  failedCount: number;
  status: "active" | "completed";
  lastModified: string;
}

/**
 * Response from /api/plans endpoint
 */
export interface PlanListResponse {
  plans: PlanInfo[];
  activePlans: number;
  completedPlans: number;
}

/**
 * SSE message for plan updates
 */
export interface PlanUpdateMessage {
  type: "plan_updated" | "plan_added" | "plan_removed";
  plan: PlanInfo;
  timestamp: string;
}
```

## Acceptance Criteria

- [ ] FeatureStatus type defined with all 4 statuses
- [ ] PlanFeature interface matches features.json structure
- [ ] PlanData interface matches full features.json structure
- [ ] PlanInfo interface for list view
- [ ] PlanListResponse for API response
- [ ] PlanUpdateMessage for SSE events
- [ ] Type check passes with no errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/types.ts
git commit -m "feat(plan-tracker): add type definitions for plan tracking"
```

## Next

Proceed to: `02-config.md`
