import { expect, it, describe, vi } from 'vitest';
import request from 'supertest';
vi.mock('../../../db', () => ({})); // mock db for app creation
import { createApp } from '../../src/app';

describe('App security and error handling', () => {
  const app = createApp({} as any);

  it('sets security headers and rejects oversized JSON', async () => {
    const response = await request(app).get('/health/live').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    await request(app).post('/api/auth/login')
      .set('content-type', 'application/json')
      .send({ email: 'a'.repeat(40_000), password: 'x' })
      .expect(413);
  });

  it('returns a traceable safe error shape', async () => {
    const response = await request(app).get('/missing').expect(404);
    expect(response.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Resource not found' });
    expect(response.body.error.traceId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
