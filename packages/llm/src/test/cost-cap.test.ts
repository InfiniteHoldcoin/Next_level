import { describe, it, expect } from 'vitest';
import {
  checkAndReserveCost,
  confirmCostReservation,
  cancelCostReservation,
} from '../cost-cap.js';
import { CostCapExceededError } from '@nextlevel/shared';
import type { Db } from '@nextlevel/db';

function makeSelectChain(
  results: unknown[][],
  idx: { v: number },
): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    from: () => chain,
    limit: () => chain,
    for: () => Promise.resolve(results[idx.v++]),
  };
  // .where() returns a thenable (direct await) but also supports .limit().for() chaining
  chain.where = () => {
    const thenable: Record<string, unknown> = {
      ...chain,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(results[idx.v++]).then(resolve, reject),
    };
    return thenable;
  };
  return chain;
}

function makeDb(
  opts: { hardKill?: boolean; dailyUsed?: number; monthlyUsed?: number; noCap?: boolean } = {},
): Db {
  const { hardKill = true, dailyUsed = 0, monthlyUsed = 0, noCap = false } = opts;

  const capRows = noCap
    ? []
    : [
        {
          tenantId: 't1',
          dailyCapUsd: '5.00',
          monthlyCapUsd: '100.00',
          hardKill,
          alertThresholdPct: 80,
          perAgentCaps: {},
          updatedAt: new Date(),
        },
      ];

  const idx = { v: 0 };
  const selectResults = [capRows, [{ total: String(dailyUsed) }], [{ total: String(monthlyUsed) }]];

  const tx: Record<string, unknown> = {
    select: () => makeSelectChain(selectResults, idx),
    insert: () => ({
      values: () => ({ returning: () => Promise.resolve([{ id: 'res-id-test' }]) }),
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  };

  const db: Record<string, unknown> = {
    transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  };

  return db as unknown as Db;
}

describe('checkAndReserveCost', () => {
  it('returns reservation id when under both caps', async () => {
    const db = makeDb({ dailyUsed: 1, monthlyUsed: 10 });
    await expect(
      checkAndReserveCost(db, { tenantId: 't1', agent: 'chatbot', estimatedUsd: 0.01 }),
    ).resolves.toBe('res-id-test');
  });

  it('throws CostCapExceededError when at daily cap', async () => {
    const db = makeDb({ dailyUsed: 5, monthlyUsed: 10 });
    await expect(
      checkAndReserveCost(db, { tenantId: 't1', agent: 'chatbot', estimatedUsd: 0.01 }),
    ).rejects.toBeInstanceOf(CostCapExceededError);
  });

  it('throws CostCapExceededError when at monthly cap', async () => {
    const db = makeDb({ dailyUsed: 1, monthlyUsed: 100 });
    await expect(
      checkAndReserveCost(db, { tenantId: 't1', agent: 'chatbot', estimatedUsd: 0.01 }),
    ).rejects.toBeInstanceOf(CostCapExceededError);
  });

  it('allows when hardKill is false even over cap', async () => {
    const db = makeDb({ hardKill: false, dailyUsed: 999, monthlyUsed: 999 });
    await expect(
      checkAndReserveCost(db, { tenantId: 't1', agent: 'chatbot', estimatedUsd: 0.01 }),
    ).resolves.toBe('res-id-test');
  });

  it('allows when no cap row exists', async () => {
    const db = makeDb({ noCap: true });
    await expect(
      checkAndReserveCost(db, { tenantId: 't1', agent: 'chatbot', estimatedUsd: 0.01 }),
    ).resolves.toBe('res-id-test');
  });
});

describe('confirmCostReservation', () => {
  it('resolves without error', async () => {
    const db = makeDb();
    await expect(
      confirmCostReservation(db, 'res-id-test', {
        model: 'claude-haiku-4-5',
        operation: 'chat',
        inputTokens: 100,
        cachedInputTokens: 0,
        outputTokens: 50,
        costUsd: 0.001,
      }),
    ).resolves.toBeUndefined();
  });
});

describe('cancelCostReservation', () => {
  it('resolves without error', async () => {
    const db = makeDb();
    await expect(cancelCostReservation(db, 'res-id-test')).resolves.toBeUndefined();
  });
});

describe('CostCapExceededError', () => {
  it('has the right code and status', () => {
    const err = new CostCapExceededError('daily cap reached');
    expect(err.code).toBe('COST_CAP_EXCEEDED');
    expect(err.status).toBe(429);
  });
});
