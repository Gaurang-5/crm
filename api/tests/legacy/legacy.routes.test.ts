import { expect, it, describe, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
vi.mock('../../../db', () => ({})); // mock db for app creation
import { createApp } from '../../src/app';

describe('Legacy compatibility routes', () => {
  const app = createApp({} as any);
  
  it('rejects unauthenticated access to legacy settings', async () => {
    await request(app).get('/api/settings').expect(401);
  });
  
  it('rejects unauthenticated access to dashboard stats', async () => {
    await request(app).get('/api/dashboard/stats?coachId=coach_deepa').expect(401);
  });

  // Using a mock auth middleware would let us test the authenticated path,
  // but just confirming the routes are mounted and protected is enough for now.
});
