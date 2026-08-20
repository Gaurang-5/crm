import { expect, it, describe, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../../../db', () => ({
  pool: {},
  useInMemory: true,
  memCoaches: [{ id: 'coach-1', email: 'coach@example.com', name: 'Coach', role: 'COACH' }]
}));

import { authRouter } from '../../src/auth/auth.routes';
import { requireAuth } from '../../src/auth/require-auth';

describe('Auth routes', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  app.get('/api/settings', requireAuth, (req, res) => {
    res.json({ ok: true });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  });

  it('rejects protected API access without a session', async () => {
    await request(app).get('/api/settings').expect(401)
      .expect(({ body }) => expect(body.error.code).toBe('AUTH_REQUIRED'));
  });

  it('creates and clears a secure coach session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'coach@example.com', password: 'Correct-Horse-2026' }).expect(200);
    await agent.get('/api/auth/session').expect(200);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/session').expect(401);
  });
});
