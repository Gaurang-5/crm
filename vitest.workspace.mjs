import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'api',
      environment: 'node',
      include: ['api/tests/**/*.test.ts'],
      globals: true,
    }
  },
  {
    test: {
      name: 'web',
      environment: 'jsdom',
      include: ['web/tests/**/*.test.ts', 'web/tests/**/*.test.tsx'],
      globals: true,
      setupFiles: ['web/tests/setup.ts'],
    }
  }
]);
