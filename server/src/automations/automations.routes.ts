import { Router } from 'express';
import {
  getAutomationRules,
  getMessageTemplates,
  updateAutomationRule,
  getAutomationRuns,
  getMessageDeliveries,
  createAutomationRun,
} from '../../../db';
import { evaluateAutomationsForTrigger, interpolateTemplate } from './automations.service';

export const automationsRouter = Router();

// Templates
automationsRouter.get('/templates', async (req, res, next) => {
  try {
    const templates = await getMessageTemplates();
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

// Rules
automationsRouter.get('/rules', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const rules = await getAutomationRules(coachId);
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

automationsRouter.put('/rules/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const updated = await updateAutomationRule(id, req.body);
    if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Automation rule not found' } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Runs & Approval Queue
automationsRouter.get('/runs', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const runs = await getAutomationRuns(coachId);
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

// Outbound Message Deliveries Log
automationsRouter.get('/deliveries', async (req, res, next) => {
  try {
    const deliveries = await getMessageDeliveries();
    res.json(deliveries);
  } catch (err) {
    next(err);
  }
});

// Test / Trigger Automation Run
automationsRouter.post('/trigger', async (req, res, next) => {
  try {
    const { trigger_event, context } = req.body;
    if (!trigger_event) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Trigger event is required' } });
    }
    const coachId = (req as any).coach?.id || 'coach_deepa';
    await evaluateAutomationsForTrigger(trigger_event, { ...context, coachId });
    res.json({ success: true, message: `Automations for ${trigger_event} evaluated.` });
  } catch (err) {
    next(err);
  }
});
