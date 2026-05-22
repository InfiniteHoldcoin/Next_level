import { describe, it, expect } from 'vitest';
import { calcCostUsd } from '../pricing.js';

describe('calcCostUsd', () => {
  it('calculates cost with no cache hits', () => {
    // 1M input + 1M output for Sonnet 4.6 = $3 + $15 = $18
    const cost = calcCostUsd('claude-sonnet-4-6', 1_000_000, 0, 1_000_000);
    expect(cost).toBeCloseTo(18.0, 4);
  });

  it('applies cache read discount correctly', () => {
    // 500k normal input + 500k cached + 0 output
    // = (500k * $3 + 500k * $0.30) / 1M = $1.50 + $0.15 = $1.65
    const cost = calcCostUsd('claude-sonnet-4-6', 1_000_000, 500_000, 0);
    expect(cost).toBeCloseTo(1.65, 4);
  });

  it('falls back to Sonnet pricing for unknown model', () => {
    const knownCost = calcCostUsd('claude-sonnet-4-6', 1_000, 0, 1_000);
    const unknownCost = calcCostUsd('some-unknown-model', 1_000, 0, 1_000);
    expect(unknownCost).toBeCloseTo(knownCost, 6);
  });
});
