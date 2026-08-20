import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env';

const valid = {
  NODE_ENV: 'test', APP_RUNTIME_MODE: 'test', PORT: '3000',
  SESSION_SECRET: '12345678901234567890123456789012',
  META_APP_SECRET: 'meta-secret', META_VERIFY_TOKEN: 'verify-secret',
  APP_BASE_URL: 'http://localhost:3000'
};

it('accepts test mode without database services', () => {
  expect(loadEnv(valid).APP_RUNTIME_MODE).toBe('test');
});

it('rejects production without PostgreSQL', () => {
  expect(() => loadEnv({ ...valid, NODE_ENV: 'production', APP_RUNTIME_MODE: 'production' }))
    .toThrow(/DATABASE_URL/);
});

it('rejects the old default Meta token', () => {
  expect(() => loadEnv({ ...valid, META_VERIFY_TOKEN: 'herbalife_crm_verify_token' }))
    .toThrow(/META_VERIFY_TOKEN/);
});
