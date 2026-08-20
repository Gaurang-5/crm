import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/auth.service';

it('hashes and verifies without returning plaintext', async () => {
  const hash = await hashPassword('Correct-Horse-2026');
  expect(hash).not.toContain('Correct-Horse-2026');
  expect(await verifyPassword('Correct-Horse-2026', hash)).toBe(true);
  expect(await verifyPassword('wrong', hash)).toBe(false);
});
