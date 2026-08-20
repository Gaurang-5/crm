import express from 'express';
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

  // Public lead ingestion from website forms
  app.post('/api/public/lead', async (req, res, next) => {
    try {
      const { phone, name, email, city, interest } = req.body;
      if (!phone || !name) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Phone and Name are required' } });
      }
      const { ingestLead } = await import('./leads/leads.service');
      const result = await ingestLead({
        phone,
        name,
        email,
        city,
        channel: 'web_form',
        campaignName: 'Public Website Consultation Form',
        interestTopic: interest || 'Wellness & Fitness',
      });
      res.status(201).json({ success: true, lead: result.lead });
    } catch (err) {
      next(err);
    }
  });

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
  const webDist = path.join(__dirname, '..', '..', 'dist', 'web');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || !req.accepts('html')) {
        return next();
      }
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
