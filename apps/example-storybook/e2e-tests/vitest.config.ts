import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    testTimeout: 120000, // 2 minutes for e2e tests
    hookTimeout: 60000, // 1 minute for setup/teardown
    teardownTimeout: 30000, // 30 seconds for cleanup
    setupFiles: ['./e2e-tests/setup.ts'],
    env: {
      NODE_ENV: 'test'
    },
    // Run tests sequentially to maintain state between tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  }
});
