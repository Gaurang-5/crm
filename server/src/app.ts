import express from 'express';
import { meetingPublic, meetingAdmin, maintenance, publicLead } from './meetings/routes';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { authRouter } from './auth/auth.routes';
import { healthRouter } from './health/health.routes';
import { legacyRouter } from './legacy/legacy.routes';
import { webhookRouter } from './workflows/webhook.routes';
import { leadsRouter } from './leads/leads.routes';
import { customersRouter } from './customers/customers.routes';
import { commerceRouter } from './commerce/commerce.routes';
import { automationsRouter } from './automations/automations.routes';
import { campaignsRouter } from './campaigns/campaigns.routes';
import { reportsRouter } from './reports/reports.routes';
import { auditRouter } from './audit/audit.routes';
import { requireAuth } from './auth/require-auth';
import { searchRouter } from './search/search.routes';
import { errorHandler, notFoundHandler } from './shared/errors';

export function createApp(deps: any) {
  const app = express();
  if (deps.trustProxy) app.set('trust proxy', deps.trustProxy);

  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
  });

  // Health and Public Webhooks
  app.use('/health', healthRouter);
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/webhooks', webhookRouter);
  app.use('/api/public/meetings', meetingPublic);
  app.use('/api/meetings', requireAuth, meetingAdmin);
  app.use('/api/maintenance', maintenance);

  app.use('/api/public/lead', publicLead);

  // Public customer-facing report endpoint (no auth — for shareable report links)
  app.get('/api/body-analyses', async (req, res, next) => {
    try {
      const phone = req.query.phone as string | undefined;
      const { getAllBodyAnalyses } = await import('../../db');
      const list = await getAllBodyAnalyses('coach_deepa');
      
      if (!phone) {
        return res.json(list);
      }

      const qDigits = phone.replace(/\D/g, '');
      const qLast10 = qDigits.slice(-10);

      const filtered = list.filter((a: any) => {
        const itemDigits = (a.phone_number || a.mobile || '').replace(/\D/g, '');
        const itemLast10 = itemDigits.slice(-10);
        return itemDigits === qDigits || (qLast10 && itemLast10 === qLast10);
      });

      res.json(filtered);
    } catch (err) {
      next(err);
    }
  });

  // Protected Operating System API Routes
  app.use('/api', requireAuth, leadsRouter);
  app.use('/api/customers', requireAuth, customersRouter);
  app.use('/api/commerce', requireAuth, commerceRouter);
  app.use('/api/automations', requireAuth, automationsRouter);
  app.use('/api/campaigns', requireAuth, campaignsRouter);
  app.use('/api/reports', requireAuth, reportsRouter);
  app.use('/api/audit', requireAuth, auditRouter);
  app.use('/api', requireAuth, searchRouter);
  app.use('/api', requireAuth, legacyRouter);

  // Serve static web build only in production mode when html is requested
  const webDist = path.resolve(process.cwd(), 'dist/web');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || !req.accepts('html')) {
        return next();
      }
      res.sendFile(path.join(webDist, req.path === '/' ? 'index.html' : 'app.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
