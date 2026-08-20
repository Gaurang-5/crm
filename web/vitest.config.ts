import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: 'web',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./web/tests/setup.ts'],
  }
});
