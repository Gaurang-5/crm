import { expect, it, describe, vi } from 'vitest';
import request from 'supertest';
vi.mock('../../../db', () => ({}));
import { createApp } from '../../src/app';

describe('Webhook signature verification', () => {
  const app = createApp({} as any);
  
  it('validates GET webhook challenge when verify_token matches', async () => {
    process.env.META_VERIFY_TOKEN = 'test_token_123';
    const res = await request(app)
      .get('/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=test_token_123&hub.challenge=challenge_12345')
      .expect(200);
    expect(res.text).toBe('challenge_12345');
  });

  it('rejects GET webhook challenge when verify_token is incorrect', async () => {
    process.env.META_VERIFY_TOKEN = 'test_token_123';
    await request(app)
      .get('/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge_12345')
      .expect(403);
  });

  it('rejects missing signatures on POST', async () => {
    await request(app).post('/api/webhooks/meta').send({}).expect(401);
  });

  it('rejects invalid signatures on POST', async () => {
    await request(app).post('/api/webhooks/meta')
      .set('x-hub-signature-256', 'sha256=invalid')
      .send({}).expect(401);
  });
});
