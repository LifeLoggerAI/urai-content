import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'server-only': resolve(__dirname, 'tests/server-only-stub.ts')
    }
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts']
  }
});