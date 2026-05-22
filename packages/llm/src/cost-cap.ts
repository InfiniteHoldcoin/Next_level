import { and, eq, gte, ne, sql } from 'drizzle-orm';
import { CostCapExceededError } from '@nextlevel/shared';
import { schema, type Db } from '@nextlevel/db';

function startOfDayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

function startOfMonthUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
}

/**
 * Atomically checks the cost cap and inserts a 'pending' reservation.
 * Uses SELECT … FOR UPDATE on cost_caps to serialize concurrent callers per tenant —
 * a second caller waits for the first to commit, then reads its reservation in the totals.
 * Returns the reservation ID; must be confirmed or cancelled after the LLM call.
 */
export async function checkAndReserveCost(
  db: Db,
  params: {
    tenantId: string;
    agent: string;
    estimatedUsd: number;
  },
): Promise<string> {
  return db.transaction(async (tx) => {
    // Lock the cap row — serializes concurrent checks for this tenant
    const caps = await tx
      .select()
      .from(schema.costCaps)
      .where(eq(schema.costCaps.tenantId, params.tenantId))
      .limit(1)
      .for('update');

    const cap = caps[0];

    if (cap?.hardKill) {
      const dayStart = startOfDayUTC();
      const monthStart = startOfMonthUTC();

      const [daily] = await tx
        .select({ total: sql<string>`coalesce(sum(${schema.costEvents.costUsd}), '0')` })
        .from(schema.costEvents)
        .where(
          and(
            eq(schema.costEvents.tenantId, params.tenantId),
            ne(schema.costEvents.status, 'cancelled'),
            gte(schema.costEvents.createdAt, dayStart),
          ),
        );

      if (Number(daily?.total ?? 0) + params.estimatedUsd >= Number(cap.dailyCapUsd)) {
        throw new CostCapExceededError(
          `daily cap ${cap.dailyCapUsd}$ reached for tenant ${params.tenantId}`,
        );
      }

      const [monthly] = await tx
        .select({ total: sql<string>`coalesce(sum(${schema.costEvents.costUsd}), '0')` })
        .from(schema.costEvents)
        .where(
          and(
            eq(schema.costEvents.tenantId, params.tenantId),
            ne(schema.costEvents.status, 'cancelled'),
            gte(schema.costEvents.createdAt, monthStart),
          ),
        );

      if (Number(monthly?.total ?? 0) + params.estimatedUsd >= Number(cap.monthlyCapUsd)) {
        throw new CostCapExceededError(
          `monthly cap ${cap.monthlyCapUsd}$ reached for tenant ${params.tenantId}`,
        );
      }
    }

    // Insert reservation — visible to concurrent checkers immediately after commit
    const [row] = await tx
      .insert(schema.costEvents)
      .values({
        tenantId: params.tenantId,
        agent: params.agent,
        provider: 'anthropic',
        model: 'pending',
        operation: 'pending',
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        costUsd: params.estimatedUsd.toFixed(6),
        status: 'pending',
      })
      .returning({ id: schema.costEvents.id });

    if (!row?.id) throw new Error('reservation insert failed');
    return row.id;
  });
}

export async function confirmCostReservation(
  db: Db,
  reservationId: string,
  params: {
    model: string;
    operation: string;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    costUsd: number;
    traceId?: string;
  },
): Promise<void> {
  await db
    .update(schema.costEvents)
    .set({
      model: params.model,
      operation: params.operation,
      inputTokens: params.inputTokens,
      cachedInputTokens: params.cachedInputTokens,
      outputTokens: params.outputTokens,
      costUsd: params.costUsd.toFixed(6),
      traceId: params.traceId ?? null,
      status: 'completed',
    })
    .where(eq(schema.costEvents.id, reservationId));
}

export async function cancelCostReservation(db: Db, reservationId: string): Promise<void> {
  await db
    .update(schema.costEvents)
    .set({ status: 'cancelled' })
    .where(eq(schema.costEvents.id, reservationId));
}
