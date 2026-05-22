import Anthropic from '@anthropic-ai/sdk';
import type { PromptCachingBetaTextBlockParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages.js';
import { calcCostUsd, DEFAULT_MODEL } from './pricing.js';
import type { LLMProvider, LLMRequest, LLMResponse } from './types.js';

// Base delays in ms; actual delay = base + random(0..base) for jitter
const RETRY_BASE_DELAYS = [1000, 2000, 4000];

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model ?? DEFAULT_MODEL;
    const maxTokens = req.maxTokens ?? 2048;

    for (let attempt = 0; attempt <= RETRY_BASE_DELAYS.length; attempt++) {
      try {
        const systemBlocks: PromptCachingBetaTextBlockParam[] | undefined = req.system
          ? [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }]
          : undefined;

        const response = await this.client.beta.promptCaching.messages.create({
          model,
          max_tokens: maxTokens,
          ...(req.temperature !== undefined && { temperature: req.temperature }),
          ...(systemBlocks && { system: systemBlocks }),
          messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
        });

        const content = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');

        const u = response.usage;
        const inputTokens = u.input_tokens;
        const cachedInputTokens = u.cache_read_input_tokens ?? 0;
        const outputTokens = u.output_tokens;

        return {
          content,
          model,
          usage: {
            inputTokens,
            cachedInputTokens,
            outputTokens,
            costUsd: calcCostUsd(model, inputTokens, cachedInputTokens, outputTokens),
          },
        };
      } catch (err) {
        const e = err as { status?: number; headers?: Record<string, string> };
        const retriable = e.status === 429 || e.status === 529 || e.status === 503;
        if (!retriable || attempt === RETRY_BASE_DELAYS.length) throw err;

        // Respect Retry-After header when present, otherwise use jittered backoff
        const retryAfterMs = e.headers?.['retry-after']
          ? Number(e.headers['retry-after']) * 1000
          : undefined;
        const base = RETRY_BASE_DELAYS[attempt] ?? 1000;
        const delay = retryAfterMs ?? (base + Math.random() * base);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw new Error('unreachable');
  }
}
