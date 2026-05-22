import { Langfuse } from 'langfuse';

let _lf: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  if (_lf !== null) return _lf;
  const pub = process.env.LANGFUSE_PUBLIC_KEY;
  const sec = process.env.LANGFUSE_SECRET_KEY;
  if (!pub || !sec) return (_lf = null);
  _lf = new Langfuse({
    publicKey: pub,
    secretKey: sec,
    baseUrl: process.env.LANGFUSE_HOST ?? 'http://localhost:3100',
    flushAt: 1,
  });
  return _lf;
}

export async function traced<T>(
  name: string,
  fn: (traceId: string) => Promise<T>,
): Promise<T & { traceId?: string }> {
  const lf = getLangfuse();
  if (!lf) {
    const result = await fn('');
    return result as T & { traceId?: string };
  }
  const trace = lf.trace({ name });
  try {
    const result = await fn(trace.id);
    return { ...result, traceId: trace.id };
  } finally {
    lf.flushAsync().catch((e: unknown) => console.warn('[langfuse] flush error', e));
  }
}
