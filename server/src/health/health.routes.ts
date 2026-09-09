import { Router } from 'express';
import { pool, useInMemory } from '../../../db';

export const healthRouter = Router();

healthRouter.get('/live', (req, res) => {
  res.json({ status: 'UP' });
});

healthRouter.get('/ready', async (_req, res) => {
  try {
    if (pool && !useInMemory) await pool.query('SELECT 1');
    else if (process.env.APP_RUNTIME_MODE === 'production') throw new Error('Database unavailable');
    res.json({ status: 'READY' });
  } catch {
    res.status(503).json({ status: 'DOWN', components: { db: false } });
  }
});
