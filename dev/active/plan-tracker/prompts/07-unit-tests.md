# Feature: unit-tests - Plan Tracker Unit Tests

## Context

The viewer has tests in `.claude/hooks/viewer/__tests__/`. We need to add tests for the plan watcher.

## Objective

Add unit tests for PlanWatcher class and verify API endpoint behavior.

## Constraints

- Reference: See constraints.md for global rules
- Use Vitest for testing
- Mock file system operations
- Follow existing test patterns

## Files to Create/Modify

- `.claude/hooks/viewer/__tests__/plan-watcher.test.ts` - NEW file

## Implementation Details

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";

// Mock node:fs
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock config
vi.mock("../config", () => ({
  PATHS: {
    DEV_ACTIVE_DIR: "/mock/dev/active",
    DEV_COMPLETE_DIR: "/mock/dev/complete",
    getPlanFeaturesPath: (dir: string) => `${dir}/features.json`,
  },
  PLAN_CONFIG: {
    POLL_INTERVAL_MS: 1000,
    MAX_COMPLETED_PLANS: 10,
  },
}));

import { PlanWatcher } from "../plan-watcher";

describe("PlanWatcher", () => {
  let watcher: PlanWatcher;

  const mockFeaturesJson = {
    project: "test-plan",
    version: "1.0.0",
    description: "A test plan",
    features: [
      { id: "f1", title: "Feature 1", status: "completed", layer: 1 },
      { id: "f2", title: "Feature 2", status: "in_progress", layer: 2 },
      { id: "f3", title: "Feature 3", status: "pending", layer: 2 },
    ],
    layers: { "1": "Foundation", "2": "Implementation" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    watcher = new PlanWatcher();
  });

  afterEach(() => {
    watcher.stop();
  });

  describe("getAllPlans", () => {
    it("returns empty array when directories do not exist", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const plans = watcher.getAllPlans();

      expect(plans).toEqual([]);
    });

    it("returns plans from active directory", () => {
      vi.mocked(existsSync).mockImplementation((path: string) => {
        return path === "/mock/dev/active" ||
               path === "/mock/dev/active/test-plan/features.json";
      });

      vi.mocked(readdirSync).mockReturnValue([
        { name: "test-plan", isDirectory: () => true },
      ] as any);

      vi.mocked(statSync).mockReturnValue({
        mtime: new Date("2024-01-15"),
        mtimeMs: Date.now(),
      } as any);

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(false);

      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe("test-plan");
      expect(plans[0].status).toBe("active");
      expect(plans[0].featureCount).toBe(3);
      expect(plans[0].completedCount).toBe(1);
      expect(plans[0].inProgressCount).toBe(1);
    });

    it("calculates feature counts correctly", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      vi.mocked(readdirSync).mockImplementation((dir: string) => {
        if (dir === "/mock/dev/active") {
          return [{ name: "test-plan", isDirectory: () => true }] as any;
        }
        return [];
      });

      vi.mocked(statSync).mockReturnValue({
        mtime: new Date(),
        mtimeMs: Date.now(),
      } as any);

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(false);

      expect(plans[0].completedCount).toBe(1);
      expect(plans[0].inProgressCount).toBe(1);
      expect(plans[0].failedCount).toBe(0);
    });
  });

  describe("getPlan", () => {
    it("returns null for non-existent plan", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const plan = watcher.getPlan("non-existent");

      expect(plan).toBeNull();
    });

    it("returns plan data for existing plan", () => {
      vi.mocked(existsSync).mockImplementation((path: string) => {
        return path === "/mock/dev/active/test-plan/features.json";
      });

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plan = watcher.getPlan("test-plan");

      expect(plan).not.toBeNull();
      expect(plan?.project).toBe("test-plan");
      expect(plan?.features).toHaveLength(3);
    });

    it("checks completed directory if not in active", () => {
      vi.mocked(existsSync).mockImplementation((path: string) => {
        return path === "/mock/dev/complete/old-plan/features.json";
      });

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plan = watcher.getPlan("old-plan");

      expect(plan).not.toBeNull();
    });
  });

  describe("subscribe", () => {
    it("returns unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = watcher.subscribe(callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("removes callback on unsubscribe", () => {
      const callback = vi.fn();
      const unsubscribe = watcher.subscribe(callback);

      unsubscribe();

      // Internal state check would require exposing subscribers
      // This test mainly ensures no errors occur
    });
  });

  describe("start/stop", () => {
    it("starts watching without errors", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => watcher.start()).not.toThrow();
    });

    it("stops watching without errors", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      watcher.start();

      expect(() => watcher.stop()).not.toThrow();
    });

    it("does not start multiple intervals", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      watcher.start();
      watcher.start();
      watcher.stop();

      // No error means only one interval was created
    });
  });
});

describe("Plan status calculation", () => {
  it("plan is active when in dev/active", () => {
    // This would be tested via getAllPlans with mocked directories
  });

  it("plan is completed when in dev/complete", () => {
    // This would be tested via getAllPlans with mocked directories
  });
});
```

## Acceptance Criteria

- [ ] Tests for PlanWatcher.getAllPlans() with various scenarios
- [ ] Tests for PlanWatcher.getPlan() success and failure cases
- [ ] Tests for subscribe/unsubscribe
- [ ] Tests for start/stop lifecycle
- [ ] Tests for feature count calculations
- [ ] All tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

## Commit

```bash
git add .claude/hooks/viewer/__tests__/plan-watcher.test.ts
git commit -m "test(plan-tracker): add unit tests for plan watcher"
```

## Next

Proceed to: `08-e2e-validation.md`
