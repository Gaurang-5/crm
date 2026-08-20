import { Router } from 'express';
import { getAuditEvents } from '../../../db';

export const auditRouter = Router();

auditRouter.get('/', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const events = await getAuditEvents(coachId);
    res.json(events);
  } catch (err) {
    next(err);
  }
});
