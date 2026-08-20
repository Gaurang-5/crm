import { Request, Response, NextFunction } from 'express';
import { hashSessionToken } from './auth.service';
import { getSessionByTokenHash, getSafeCoachById } from './auth.repository';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.coach_session;
  if (!token) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }

  const tokenHash = hashSessionToken(token);
  const session = await getSessionByTokenHash(tokenHash);
  if (!session) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired session' } });
  }

  const coach = await getSafeCoachById(session.coach_id);
  if (!coach) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Coach not found' } });
  }

  (req as any).coach = coach;
  next();
}
