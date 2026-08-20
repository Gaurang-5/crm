import {
  findPersonByPhone,
  upsertPerson,
  createLeadSource,
  getLeadSources,
  getPipelineStages,
  getLead,
  getAllLeads,
  upsertLead,
  updateLeadStage,
  getStageHistory,
  logActivity,
  getActivities,
  createTask,
  getTasks,
  updateTaskStatus,
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  normalizePhone,
  logAuditEvent,
} from '../../../db';
import { Lead, LeadSourceChannel } from '../shared/types';
import { evaluateAutomationsForTrigger } from '../automations/automations.service';

export interface IngestLeadInput {
  phone: string;
  name: string;
  email?: string;
  gender?: string;
  city?: string;
  channel: LeadSourceChannel;
  campaignName?: string;
  adId?: string;
  formId?: string;
  utmSource?: string;
  utmCampaign?: string;
  rawPayload?: Record<string, any>;
  consentGiven?: boolean;
  interestTopic?: string;
  coachId?: string;
}

export async function ingestLead(input: IngestLeadInput): Promise<{ lead: Lead; isNewLead: boolean }> {
  const norm = normalizePhone(input.phone);
  if (!norm || norm.length < 10) {
    throw new Error('Invalid phone number provided for lead ingestion');
  }

  const coachId = input.coachId || 'coach_deepa';
  const existingPerson = await findPersonByPhone(norm);
  const isNewPerson = !existingPerson;

  // 1. Upsert normalized Person identity
  const person = await upsertPerson({
    phone: norm,
    name: input.name,
    email: input.email,
    gender: input.gender,
    city: input.city,
  });

  // 2. Append Source Touchpoint (preserves complete multi-touch attribution without overwriting)
  await createLeadSource({
    phone_number: norm,
    person_id: person.id,
    channel: input.channel,
    campaign_name: input.campaignName,
    ad_id: input.adId,
    form_id: input.formId,
    utm_source: input.utmSource,
    utm_campaign: input.utmCampaign,
    raw_payload: input.rawPayload,
    consent_given: input.consentGiven ?? true,
    consent_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  // 3. Check existing lead
  const existingLead = await getLead(norm);
  const isNewLead = !existingLead;

  // 4. Create or update Lead record
  const lead = await upsertLead(norm, input.name, {
    coach_id: coachId,
    gender: input.gender,
    interest_topic: input.interestTopic || (existingLead?.interest_topic ?? 'Weight Loss & Wellness'),
    funnel_state: existingLead ? existingLead.funnel_state : 'NEW',
    next_action: existingLead ? existingLead.next_action : 'Send Welcome Message & Book Consultation',
    next_action_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    lead_score: isNewLead ? 60 : (existingLead?.lead_score || 50) + 10,
  });

  // 5. Log Activity
  await logActivity({
    coach_id: coachId,
    phone_number: norm,
    type: 'SYSTEM',
    summary: `Lead touchpoint captured via ${input.channel.toUpperCase()}${input.campaignName ? ` (${input.campaignName})` : ''}`,
    details: input.rawPayload ? JSON.stringify(input.rawPayload) : undefined,
  });

  // 6. Trigger Automations (e.g. Welcome message or Coach alert)
  if (isNewLead) {
    await evaluateAutomationsForTrigger('NEW_LEAD', {
      phone: norm,
      name: input.name,
      coachId,
      channel: input.channel,
    });
  }

  // 7. Audit log
  await logAuditEvent({
    coach_id: coachId,
    event_type: isNewLead ? 'LEAD_CREATED' : 'LEAD_TOUCHPOINT_ADDED',
    entity_type: 'LEAD',
    entity_id: norm,
    payload: { channel: input.channel, campaign: input.campaignName },
  });

  return { lead, isNewLead };
}
