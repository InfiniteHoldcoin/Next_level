export const DEFAULT_MODEL = 'claude-sonnet-4-6';

// USD per 1M tokens
const PRICING: Record<string, { input: number; cacheRead: number; output: number }> = {
  'claude-sonnet-4-6':         { input: 3.00,  cacheRead: 0.30, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80,  cacheRead: 0.08, output: 4.00  },
  'claude-opus-4-7':           { input: 15.00, cacheRead: 1.50, output: 75.00 },
};

export function calcCostUsd(
  model: string,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? PRICING[DEFAULT_MODEL] ?? { input: 3.00, cacheRead: 0.30, output: 15.00 };
  const normalInput = inputTokens - cachedInputTokens;
  return (normalInput * p.input + cachedInputTokens * p.cacheRead + outputTokens * p.output) / 1_000_000;
}
