import { Router } from 'express';
import {
  getAllLeads,
  getLead,
  upsertLead,
  updateLeadStage,
  getPipelineStages,
  getStageHistory,
  getLeadSources,
  getActivities,
  logActivity,
  getTasks,
  createTask,
  updateTaskStatus,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  getBodyAnalyses,
  getOrders,
  getHomeVisits,
} from '../../../db';
import { ingestLead } from './leads.service';

export const leadsRouter = Router();

// Public / Internal Ingestion Endpoint
leadsRouter.post('/ingest', async (req, res, next) => {
  try {
    const { phone, name, email, gender, city, channel, campaignName, adId, formId, utmSource, utmCampaign, rawPayload, consentGiven, interestTopic } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Phone and Name are required' } });
    }
    const result = await ingestLead({
      phone,
      name,
      email,
      gender,
      city,
      channel: channel || 'web_form',
      campaignName,
      adId,
      formId,
      utmSource,
      utmCampaign,
      rawPayload,
      consentGiven: consentGiven ?? true,
      interestTopic,
      coachId: (req as any).coach?.id || 'coach_deepa',
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Get Pipeline Stages
leadsRouter.get('/pipeline/stages', async (req, res, next) => {
  try {
    const stages = await getPipelineStages();
    res.json(stages);
  } catch (err) {
    next(err);
  }
});

// List all Leads
leadsRouter.get('/leads', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const leads = await getAllLeads(coachId);
    res.json(leads);
  } catch (err) {
    next(err);
  }
});

// Create Lead Manually
leadsRouter.post('/leads', async (req, res, next) => {
  try {
    const { phone, name, email, gender, age, height_cm, weight_kg, interest_topic, next_action, next_action_due, channel, campaign_name } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Phone and name are required' } });
    }
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const result = await ingestLead({
      phone,
      name,
      email,
      gender,
      channel: channel || 'manual',
      campaignName: campaign_name || 'Direct Manual Entry',
      interestTopic: interest_topic,
      coachId,
    });
    // Update any extra fields
    await upsertLead(phone, name, {
      age: age ? Number(age) : undefined,
      height_cm: height_cm ? Number(height_cm) : undefined,
      weight_kg: weight_kg ? Number(weight_kg) : undefined,
      next_action,
      next_action_due,
    });
    const updated = await getLead(phone);
    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
});

// Get Single Lead details
leadsRouter.get('/leads/:phone', async (req, res, next) => {
  try {
    const phone = req.params.phone;
    const lead = await getLead(phone);
    if (!lead) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }
    const stageHistory = await getStageHistory(phone);
    const sources = lead.person_id ? await getLeadSources(lead.person_id) : [];
    const activities = await getActivities(phone);
    const analyses = await getBodyAnalyses(phone);
    const orders = await getOrders(phone);
    const visits = await getHomeVisits(phone);

    res.json({
      lead,
      stageHistory,
      sources,
      activities,
      analyses,
      orders,
      visits,
    });
  } catch (err) {
    next(err);
  }
});

// Update Lead Details
leadsRouter.put('/leads/:phone', async (req, res, next) => {
  try {
    const phone = req.params.phone;
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const existing = await getLead(phone);
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }
    const updated = await upsertLead(phone, req.body.display_name, {
      ...req.body,
      coach_id: coachId,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Move Lead Stage
leadsRouter.post('/leads/:phone/stage', async (req, res, next) => {
  try {
    const phone = req.params.phone;
    const { stage, reason, metadata } = req.body;
    if (!stage) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Target stage is required' } });
    }
    if (stage === 'LOST' && !reason) {
      return res.status(400).json({ error: { code: 'REASON_REQUIRED', message: 'A reason is required when marking a lead as Lost' } });
    }
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const lead = await updateLeadStage(phone, stage, reason, metadata, coachId);
    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

// Activities
leadsRouter.get('/activities', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const activities = await getActivities(req.query.phone as string, req.query.customerId as string, coachId);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

leadsRouter.post('/activities', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { phone_number, customer_id, type, summary, details } = req.body;
    if (!summary) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Activity summary is required' } });
    }
    const act = await logActivity({ coach_id: coachId, phone_number, customer_id, type: type || 'NOTE', summary, details });
    res.status(201).json(act);
  } catch (err) {
    next(err);
  }
});

// Tasks
leadsRouter.get('/tasks', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const tasks = await getTasks(coachId, req.query.status as string);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

leadsRouter.post('/tasks', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { phone_number, customer_id, title, due_date, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Task title is required' } });
    }
    const task = await createTask({ coach_id: coachId, phone_number, customer_id, title, due_date, priority: priority || 'MEDIUM' });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

leadsRouter.put('/tasks/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const task = await updateTaskStatus(id, status);
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// Appointments
leadsRouter.get('/appointments', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const list = await getAppointments(coachId, req.query.status as string);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

leadsRouter.post('/appointments', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { phone_number, customer_id, title, scheduled_at, duration_mins, zoom_link, notes } = req.body;
    if (!title || !scheduled_at) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Title and scheduled time are required' } });
    }
    const app = await createAppointment({ coach_id: coachId, phone_number, customer_id, title, scheduled_at, duration_mins, zoom_link, notes });
    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
});

leadsRouter.put('/appointments/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const app = await updateAppointmentStatus(id, status);
    if (!app) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
    res.json(app);
  } catch (err) {
    next(err);
  }
});
