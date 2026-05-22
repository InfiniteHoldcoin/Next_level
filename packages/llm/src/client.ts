import type { Db } from '@nextlevel/db';
import { AnthropicProvider } from './anthropic.js';
import { checkAndReserveCost, confirmCostReservation, cancelCostReservation } from './cost-cap.js';
import { traced } from './trace.js';
import { calcCostUsd, DEFAULT_MODEL } from './pricing.js';
import type { LLMRequest, LLMResponse } from './types.js';

export type TrackedRequest = LLMRequest & {
  tenantId: string;
  agent: string;
  operation: string;
};

export function createLLMClient(db: Db, apiKey?: string) {
  const provider = new AnthropicProvider(apiKey);

  return {
    async complete(req: TrackedRequest): Promise<LLMResponse> {
      const model = req.model ?? DEFAULT_MODEL;
      // Conservative overestimate: maxTokens output at full input rate
      const estimatedUsd = calcCostUsd(model, req.maxTokens ?? 2048, 0, req.maxTokens ?? 2048);

      const reservationId = await checkAndReserveCost(db, {
        tenantId: req.tenantId,
        agent: req.agent,
        estimatedUsd,
      });

      try {
        const result = await traced(`${req.agent}:${req.operation}`, async (traceId) => {
          const r = await provider.complete(req);
          return { ...r, traceId };
        });

        await confirmCostReservation(db, reservationId, {
          model: result.model,
          operation: req.operation,
          inputTokens: result.usage.inputTokens,
          cachedInputTokens: result.usage.cachedInputTokens,
          outputTokens: result.usage.outputTokens,
          costUsd: result.usage.costUsd,
          traceId: result.traceId,
        });

        return result;
      } catch (err) {
        await cancelCostReservation(db, reservationId).catch(() => {});
        throw err;
      }
    },
  };
}
