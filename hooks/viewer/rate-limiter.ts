export interface RateLimitConfig {
  maxConnections: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private connections: Map<string, RateLimitEntry> = new Map();
  private maxConnections: number;
  private windowMs: number;
  private cleanupInterval: Timer | null = null;

  constructor(config: RateLimitConfig) {
    this.maxConnections = config.maxConnections;
    this.windowMs = config.windowMs;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const entry = this.connections.get(ip);

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.connections.set(ip, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= this.maxConnections) {
      return false;
    }

    entry.count++;
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    this.connections.forEach((entry, ip) => {
      if (now - entry.windowStart > this.windowMs) {
        this.connections.delete(ip);
      }
    });
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxConnections: 5,
  windowMs: 60_000,
};
