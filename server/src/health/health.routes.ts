import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/live', (req, res) => {
  res.json({ status: 'UP' });
});

healthRouter.get('/ready', (req, res) => {
  // In a real app we would ping DB and Redis here.
  // For now, assume UP if not failing.
  if (process.env.APP_RUNTIME_MODE === 'production' && (!process.env.DATABASE_URL || !process.env.REDIS_URL)) {
    return res.status(503).json({ status: 'DOWN', components: { db: false, redis: false } });
  }
  res.json({ status: 'READY' });
});
