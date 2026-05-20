import type { BudgetStore } from "./types";

export class InMemoryBudgetStore implements BudgetStore {
  private readonly balances = new Map<string, number>();

  constructor(initialBalances: Record<string, number> = {}) {
    for (const [userId, balance] of Object.entries(initialBalances)) {
      this.balances.set(userId, balance);
    }
  }

  async remaining(userId: string): Promise<number> {
    return this.balances.get(userId) ?? 1_000;
  }

  async consume(userId: string, tokens: number): Promise<void> {
    const current = await this.remaining(userId);
    this.balances.set(userId, current - tokens);
  }
}

export function estimateTokens(message: string): number {
  return Math.max(1, Math.ceil(message.trim().split(/\s+/).filter(Boolean).length * 1.4));
}

