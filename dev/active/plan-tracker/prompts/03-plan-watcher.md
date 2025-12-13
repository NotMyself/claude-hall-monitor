# Feature: plan-watcher - Plan File Watcher

## Context

The viewer uses `LogFileWatcher` to watch log files for changes. We need a similar watcher for plan `features.json` files.

## Objective

Create a `PlanWatcher` class that watches `features.json` files in plan directories and emits events when they change.

## Constraints

- Reference: See constraints.md for global rules
- Follow the pattern of `LogFileWatcher`
- Use polling-based watching for consistency
- Support both active and completed plan directories

## Files to Create/Modify

- `.claude/hooks/viewer/plan-watcher.ts` - NEW file

## Implementation Details

```typescript
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, PLAN_CONFIG } from "./config";
import type { PlanData, PlanInfo, FeatureStatus } from "./types";

type PlanUpdateCallback = (plan: PlanInfo) => void;

export class PlanWatcher {
  private interval: Timer | null = null;
  private subscribers: Set<PlanUpdateCallback> = new Set();
  private planCache: Map<string, { mtime: number; data: PlanInfo }> = new Map();

  /**
   * Start watching plan directories for changes
   */
  start(): void {
    if (this.interval) return;

    // Initial scan
    this.scanPlans();

    this.interval = setInterval(() => {
      this.checkForChanges();
    }, PLAN_CONFIG.POLL_INTERVAL_MS);
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Subscribe to plan updates
   */
  subscribe(callback: PlanUpdateCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get all plans (active and optionally completed)
   */
  getAllPlans(includeCompleted: boolean = true): PlanInfo[] {
    const plans: PlanInfo[] = [];

    // Scan active plans
    plans.push(...this.scanDirectory(PATHS.DEV_ACTIVE_DIR, "active"));

    // Scan completed plans if requested
    if (includeCompleted) {
      plans.push(...this.scanDirectory(PATHS.DEV_COMPLETE_DIR, "completed"));
    }

    // Sort by last modified (most recent first)
    return plans.sort((a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  /**
   * Get a specific plan by name
   */
  getPlan(name: string): PlanData | null {
    // Try active first
    let planPath = join(PATHS.DEV_ACTIVE_DIR, name, "features.json");
    if (existsSync(planPath)) {
      return this.readPlanData(planPath);
    }

    // Try completed
    planPath = join(PATHS.DEV_COMPLETE_DIR, name, "features.json");
    if (existsSync(planPath)) {
      return this.readPlanData(planPath);
    }

    return null;
  }

  private scanDirectory(dir: string, status: "active" | "completed"): PlanInfo[] {
    if (!existsSync(dir)) return [];

    const plans: PlanInfo[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const featuresPath = join(dir, entry.name, "features.json");
      if (!existsSync(featuresPath)) continue;

      const planInfo = this.readPlanInfo(featuresPath, entry.name, status);
      if (planInfo) {
        plans.push(planInfo);
      }
    }

    return plans;
  }

  private readPlanData(path: string): PlanData | null {
    try {
      const content = readFileSync(path, "utf-8");
      return JSON.parse(content) as PlanData;
    } catch {
      return null;
    }
  }

  private readPlanInfo(path: string, name: string, status: "active" | "completed"): PlanInfo | null {
    try {
      const stats = statSync(path);
      const data = this.readPlanData(path);
      if (!data) return null;

      const features = data.features || [];
      const completedCount = features.filter(f => f.status === "completed").length;
      const inProgressCount = features.filter(f => f.status === "in_progress").length;
      const failedCount = features.filter(f => f.status === "failed").length;

      return {
        name,
        path,
        project: data.project || name,
        description: data.description || "",
        featureCount: features.length,
        completedCount,
        inProgressCount,
        failedCount,
        status,
        lastModified: stats.mtime.toISOString(),
      };
    } catch {
      return null;
    }
  }

  private scanPlans(): void {
    const plans = this.getAllPlans();
    for (const plan of plans) {
      const stats = statSync(plan.path);
      this.planCache.set(plan.path, { mtime: stats.mtimeMs, data: plan });
    }
  }

  private checkForChanges(): void {
    const currentPlans = this.getAllPlans();

    for (const plan of currentPlans) {
      const stats = statSync(plan.path);
      const cached = this.planCache.get(plan.path);

      if (!cached || cached.mtime !== stats.mtimeMs) {
        // Plan was added or modified
        this.planCache.set(plan.path, { mtime: stats.mtimeMs, data: plan });
        this.emit(plan);
      }
    }

    // Check for removed plans
    for (const [path, cached] of this.planCache) {
      if (!currentPlans.find(p => p.path === path)) {
        this.planCache.delete(path);
        // Could emit a removal event here if needed
      }
    }
  }

  private emit(plan: PlanInfo): void {
    for (const callback of this.subscribers) {
      try {
        callback(plan);
      } catch (error) {
        console.error("Plan subscriber error:", error);
      }
    }
  }
}
```

## Acceptance Criteria

- [ ] PlanWatcher class created
- [ ] start() begins polling for changes
- [ ] stop() stops polling
- [ ] subscribe() allows registering callbacks
- [ ] getAllPlans() returns plans from both directories
- [ ] getPlan() returns full plan data by name
- [ ] Changes trigger subscriber callbacks
- [ ] Type check passes

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/plan-watcher.ts
git commit -m "feat(plan-tracker): add plan file watcher"
```

## Next

Proceed to: `04-api-endpoints.md`
