import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    globals: true,
    include: ['api/tests/**/*.test.ts'],
    exclude: ['dist/**/*', 'node_modules/**/*'],
  }
});
