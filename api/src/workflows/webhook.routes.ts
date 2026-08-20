import { Router } from 'express';
import crypto from 'crypto';

export const webhookRouter = Router();

// 1. Meta Webhook Handshake (GET /api/webhooks/meta)
webhookRouter.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_VERIFY_TOKEN || 'wellness_crm_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Meta Webhook successfully verified by Facebook servers!');
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Verification token mismatch or invalid mode' });
});

// 2. Incoming Messages & Delivery Receipts (POST /api/webhooks/meta)
webhookRouter.post('/meta', (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', process.env.META_APP_SECRET || 'secret')
    .update(JSON.stringify(req.body))
    .digest('hex')}`;

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  res.json({ ok: true });
});
