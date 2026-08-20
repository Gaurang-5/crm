import { expect, it, vi } from 'vitest';
import { runMigrations } from '../../src/db/migrate';

it('applies each migration once inside a transaction', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  await runMigrations({ query } as never, [{ version: '001', sql: 'select 1' }]);
  const calls = query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0]);
  expect(calls).toEqual([
    'SELECT', 'CREATE', 'SELECT', 'BEGIN', 'select', 'INSERT', 'COMMIT', 'SELECT'
  ]);
});
