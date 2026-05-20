import type { ToolCache } from "./types";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class MemoryToolCache implements ToolCache {
  private readonly entries = new Map<string, CacheEntry>();

  async get(key: string): Promise<unknown | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: unknown, ttlMs = 60_000): Promise<void> {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  size(): number {
    return this.entries.size;
  }
}

export function buildToolCacheKey(toolName: string, args: Record<string, unknown>): string {
  return `${toolName}:${JSON.stringify(Object.entries(args).sort(([a], [b]) => a.localeCompare(b)))}`;
}

