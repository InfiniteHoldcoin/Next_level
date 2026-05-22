import { z } from 'zod';

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  APP_NAME: z.string().default('nextlevel'),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

export function loadEnv<T extends z.ZodTypeAny>(extra?: T): BaseEnv & z.infer<T> {
  const schema = extra ? baseEnvSchema.merge(extra as unknown as z.AnyZodObject) : baseEnvSchema;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment — see logs');
  }
  return parsed.data as BaseEnv & z.infer<T>;
}
