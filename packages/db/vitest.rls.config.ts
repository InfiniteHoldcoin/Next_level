import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/rls.test.ts'],
    testTimeout: 30_000,
    sequence: { concurrent: false },
  },
});
