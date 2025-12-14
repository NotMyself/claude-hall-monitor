import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, PLAN_CONFIG } from "./config";
import type { PlanData, PlanInfo } from "./types";

type PlanUpdateCallback = (plan: PlanInfo) => void;

/**
 * Watches plan directories for changes to features.json files
 * and notifies subscribers when plans are updated.
 */
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
      const completedPlans = this.scanDirectory(PATHS.DEV_COMPLETE_DIR, "completed");
      // Limit completed plans to MAX_COMPLETED_PLANS
      plans.push(...completedPlans.slice(0, PLAN_CONFIG.MAX_COMPLETED_PLANS));
    }

    // Sort by last modified (most recent first)
    return plans.sort(
      (a, b) =>
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

  /**
   * Scan a directory for plan folders containing features.json
   */
  private scanDirectory(
    dir: string,
    status: "active" | "completed"
  ): PlanInfo[] {
    if (!existsSync(dir)) return [];

    const plans: PlanInfo[] = [];

    try {
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
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }

    return plans;
  }

  /**
   * Read and parse a features.json file
   */
  private readPlanData(path: string): PlanData | null {
    try {
      const content = readFileSync(path, "utf-8");
      return JSON.parse(content) as PlanData;
    } catch (error) {
      console.error("Failed to read plan data:", error);
      return null;
    }
  }

  /**
   * Read plan info for the list view
   */
  private readPlanInfo(
    path: string,
    name: string,
    status: "active" | "completed"
  ): PlanInfo | null {
    try {
      const stats = statSync(path);
      const data = this.readPlanData(path);
      if (!data) return null;

      const features = data.features || [];
      const completedCount = features.filter(
        (f) => f.status === "completed"
      ).length;
      const inProgressCount = features.filter(
        (f) => f.status === "in_progress"
      ).length;
      const failedCount = features.filter((f) => f.status === "failed").length;

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
    } catch (error) {
      console.error("Failed to read plan info:", error);
      return null;
    }
  }

  /**
   * Initial scan to populate the cache
   */
  private scanPlans(): void {
    const plans = this.getAllPlans();
    for (const plan of plans) {
      try {
        const stats = statSync(plan.path);
        this.planCache.set(plan.path, { mtime: stats.mtimeMs, data: plan });
      } catch (error) {
        console.error("Failed to stat plan file during initial scan:", error);
      }
    }
  }

  /**
   * Check for changes and notify subscribers
   */
  private checkForChanges(): void {
    const currentPlans = this.getAllPlans();
    const currentPaths = new Set<string>();

    for (const plan of currentPlans) {
      currentPaths.add(plan.path);

      try {
        const stats = statSync(plan.path);
        const cached = this.planCache.get(plan.path);

        if (!cached || cached.mtime !== stats.mtimeMs) {
          // Plan was added or modified
          this.planCache.set(plan.path, { mtime: stats.mtimeMs, data: plan });
          this.emit(plan);
        }
      } catch (error) {
        console.error("Failed to check plan for changes:", error);
      }
    }

    // Check for removed plans
    for (const [path] of this.planCache) {
      if (!currentPaths.has(path)) {
        this.planCache.delete(path);
        // Could emit a removal event here if needed
      }
    }
  }

  /**
   * Notify all subscribers of a plan update
   */
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
