export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tenantId?: string;
  agent?: string;
  operation?: string;
}

export interface LLMUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: LLMUsage;
  traceId?: string;
}

export interface LLMProvider {
  complete(req: LLMRequest): Promise<LLMResponse>;
}
