import { describe, expect, it, beforeEach } from 'vitest';
import { ingestLead } from '../../src/leads/leads.service';
import {
  getLead,
  getAllLeads,
  getLeadSources,
  getStageHistory,
  updateLeadStage,
  memLeads,
  memPeople,
  memLeadSources,
  memStageHistory,
} from '../../../db';

describe('Lead Ingestion and Deduplication Engine', () => {
  beforeEach(() => {
    memLeads.length = 0;
    memPeople.length = 0;
    memLeadSources.length = 0;
    memStageHistory.length = 0;
  });

  it('ingests a new lead from Website Form with phone normalization', async () => {
    const { lead, isNewLead } = await ingestLead({
      phone: '9876543210',
      name: 'Rohan Sharma',
      channel: 'web_form',
      campaignName: 'Summer Weight Loss Camp',
      interestTopic: 'Weight Loss',
    });

    expect(isNewLead).toBe(true);
    expect(lead.phone_number).toBe('919876543210');
    expect(lead.funnel_state).toBe('NEW');
    expect(lead.display_name).toBe('Rohan Sharma');

    const sources = await getLeadSources(lead.person_id!);
    expect(sources).toHaveLength(1);
    expect(sources[0].channel).toBe('web_form');
    expect(sources[0].campaign_name).toBe('Summer Weight Loss Camp');
  });

  it('deduplicates existing lead on repeated submission from Meta Lead Ads without overwriting history', async () => {
    // 1st touchpoint: WhatsApp
    await ingestLead({
      phone: '919876543210',
      name: 'Rohan Sharma',
      channel: 'whatsapp',
    });

    // Advance stage to QUALIFIED
    await updateLeadStage('919876543210', 'QUALIFIED', 'Interested in Elite Plan');

    // 2nd touchpoint: Meta Lead Ad submission
    const { lead, isNewLead } = await ingestLead({
      phone: '+91 98765 43210',
      name: 'Rohan Sharma',
      channel: 'meta_lead_ad',
      campaignName: 'Instagram Reels Ad 5',
      adId: 'ad_9981',
    });

    expect(isNewLead).toBe(false);
    expect(lead.funnel_state).toBe('QUALIFIED'); // Preserves sales pipeline state

    const sources = await getLeadSources(lead.person_id!);
    expect(sources).toHaveLength(2);
    expect(sources.map((s) => s.channel)).toContain('whatsapp');
    expect(sources.map((s) => s.channel)).toContain('meta_lead_ad');
  });

  it('records immutable stage movement history and enforces reason when moving to LOST', async () => {
    await ingestLead({
      phone: '919111222333',
      name: 'Anjali Verma',
      channel: 'manual',
    });

    await updateLeadStage('919111222333', 'CONTACTED');
    await updateLeadStage('919111222333', 'CONSULTATION_BOOKED');
    await updateLeadStage('919111222333', 'LOST', 'Pricing out of budget currently');

    const history = await getStageHistory('919111222333');
    expect(history.length).toBeGreaterThanOrEqual(3);
    const lostEntry = history.find((h) => h.to_stage === 'LOST');
    expect(lostEntry?.reason).toBe('Pricing out of budget currently');
  });
});
