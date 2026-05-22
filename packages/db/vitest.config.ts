import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/test/rls.test.ts'],
    testTimeout: 30_000,
  },
});
