import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/workspot_test',
      JWT_SECRET: 'test-secret-for-vitest-that-is-at-least-32-chars',
      JWT_EXPIRES_IN: '15m',
      REFRESH_TOKEN_EXPIRES_IN_DAYS: '7',
      PORT: '3000',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
