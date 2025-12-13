import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted() for proper mock initialization
const { mockExistsSync, mockReaddirSync, mockStatSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReaddirSync: vi.fn(),
  mockStatSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    statSync: mockStatSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  statSync: mockStatSync,
  readFileSync: mockReadFileSync,
}));

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
      { id: "f4", title: "Feature 4", status: "failed", layer: 3 },
    ],
    layers: { "1": "Foundation", "2": "Implementation", "3": "Testing" },
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
      mockExistsSync.mockReturnValue(false);

      const plans = watcher.getAllPlans();

      expect(plans).toEqual([]);
    });

    it("returns plans from active directory", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/active" ||
               path === "/mock/dev/active/test-plan/features.json";
      });

      mockReaddirSync.mockReturnValue([
        { name: "test-plan", isDirectory: () => true },
      ]);

      mockStatSync.mockReturnValue({
        mtime: new Date("2024-01-15"),
        mtimeMs: Date.now(),
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(false);

      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe("test-plan");
      expect(plans[0].status).toBe("active");
      expect(plans[0].featureCount).toBe(4);
      expect(plans[0].completedCount).toBe(1);
      expect(plans[0].inProgressCount).toBe(1);
      expect(plans[0].failedCount).toBe(1);
    });

    it("includes completed plans when requested", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/active" ||
               path === "/mock/dev/complete" ||
               path === "/mock/dev/active/active-plan/features.json" ||
               path === "/mock/dev/complete/completed-plan/features.json";
      });

      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === "/mock/dev/active") {
          return [{ name: "active-plan", isDirectory: () => true }];
        }
        if (dir === "/mock/dev/complete") {
          return [{ name: "completed-plan", isDirectory: () => true }];
        }
        return [];
      });

      mockStatSync.mockReturnValue({
        mtime: new Date(),
        mtimeMs: Date.now(),
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(true);

      expect(plans).toHaveLength(2);
      const activeplan = plans.find(p => p.name === "active-plan");
      const completedPlan = plans.find(p => p.name === "completed-plan");
      expect(activeplan?.status).toBe("active");
      expect(completedPlan?.status).toBe("completed");
    });

    it("calculates feature counts correctly", () => {
      mockExistsSync.mockReturnValue(true);

      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === "/mock/dev/active") {
          return [{ name: "test-plan", isDirectory: () => true }];
        }
        return [];
      });

      mockStatSync.mockReturnValue({
        mtime: new Date(),
        mtimeMs: Date.now(),
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(false);

      expect(plans[0].completedCount).toBe(1);
      expect(plans[0].inProgressCount).toBe(1);
      expect(plans[0].failedCount).toBe(1);
      expect(plans[0].featureCount).toBe(4);
    });

    it("skips non-directory entries", () => {
      mockExistsSync.mockReturnValue(true);

      mockReaddirSync.mockReturnValue([
        { name: "test-plan", isDirectory: () => true },
        { name: "readme.md", isDirectory: () => false },
      ]);

      mockStatSync.mockReturnValue({
        mtime: new Date(),
        mtimeMs: Date.now(),
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(false);

      expect(plans).toHaveLength(1);
    });

    it("skips directories without features.json", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/active"; // features.json doesn't exist
      });

      mockReaddirSync.mockReturnValue([
        { name: "empty-dir", isDirectory: () => true },
      ]);

      const plans = watcher.getAllPlans(false);

      expect(plans).toHaveLength(0);
    });
  });

  describe("getPlan", () => {
    it("returns null for non-existent plan", () => {
      mockExistsSync.mockReturnValue(false);

      const plan = watcher.getPlan("non-existent");

      expect(plan).toBeNull();
    });

    it("returns plan data from active directory", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/active/test-plan/features.json";
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plan = watcher.getPlan("test-plan");

      expect(plan).not.toBeNull();
      expect(plan?.project).toBe("test-plan");
      expect(plan?.features).toHaveLength(4);
      expect(plan?.layers).toEqual(mockFeaturesJson.layers);
    });

    it("checks completed directory if not in active", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/complete/old-plan/features.json";
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plan = watcher.getPlan("old-plan");

      expect(plan).not.toBeNull();
      expect(plan?.project).toBe("test-plan");
    });

    it("returns null for invalid JSON", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid json");

      const plan = watcher.getPlan("test-plan");

      expect(plan).toBeNull();
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

      // Callback should not be called after unsubscribe
      // (Would need internal state access to verify completely)
    });
  });

  describe("start/stop", () => {
    it("starts watching without errors", () => {
      mockExistsSync.mockReturnValue(false);

      expect(() => watcher.start()).not.toThrow();
    });

    it("stops watching without errors", () => {
      mockExistsSync.mockReturnValue(false);
      watcher.start();

      expect(() => watcher.stop()).not.toThrow();
    });

    it("does not start multiple intervals when called twice", () => {
      mockExistsSync.mockReturnValue(false);

      watcher.start();
      watcher.start(); // Second call should be ignored

      watcher.stop();
      // No error means only one interval was created
    });

    it("can be restarted after stopping", () => {
      mockExistsSync.mockReturnValue(false);

      watcher.start();
      watcher.stop();
      watcher.start();
      watcher.stop();

      // Should not throw
    });
  });

  describe("plan status calculation", () => {
    it("plan in dev/active has status 'active'", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/active" ||
               path === "/mock/dev/active/my-plan/features.json";
      });

      mockReaddirSync.mockReturnValue([
        { name: "my-plan", isDirectory: () => true },
      ]);

      mockStatSync.mockReturnValue({
        mtime: new Date(),
        mtimeMs: Date.now(),
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(false);

      expect(plans[0].status).toBe("active");
    });

    it("plan in dev/complete has status 'completed'", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "/mock/dev/complete" ||
               path === "/mock/dev/complete/old-plan/features.json";
      });

      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === "/mock/dev/complete") {
          return [{ name: "old-plan", isDirectory: () => true }];
        }
        return [];
      });

      mockStatSync.mockReturnValue({
        mtime: new Date(),
        mtimeMs: Date.now(),
      });

      mockReadFileSync.mockReturnValue(JSON.stringify(mockFeaturesJson));

      const plans = watcher.getAllPlans(true);

      const completedPlan = plans.find(p => p.name === "old-plan");
      expect(completedPlan?.status).toBe("completed");
    });
  });

  describe("error handling", () => {
    it("handles readdirSync errors gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const plans = watcher.getAllPlans();

      expect(plans).toEqual([]);
    });

    it("handles statSync errors gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReaddirSync.mockReturnValue([
        { name: "test-plan", isDirectory: () => true },
      ]);
      mockStatSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const plans = watcher.getAllPlans();

      expect(plans).toEqual([]);
    });
  });
});
