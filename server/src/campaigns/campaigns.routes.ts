import { Router } from 'express';
import { getAllLeads, getAllCustomers, getOrders, memCampaigns, memLeadSources } from '../../../db';

export const campaignsRouter = Router();

campaignsRouter.get('/', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const leads = await getAllLeads(coachId);
    const customers = await getAllCustomers(coachId);
    const orders = await getOrders(undefined, undefined, coachId);

    // Group leads and conversions by source and campaign
    const channelStats: Record<string, { channel: string; totalLeads: number; wonCustomers: number; totalRevenue: number }> = {
      whatsapp: { channel: 'WhatsApp Inbound', totalLeads: 0, wonCustomers: 0, totalRevenue: 0 },
      web_form: { channel: 'Website Form', totalLeads: 0, wonCustomers: 0, totalRevenue: 0 },
      meta_lead_ad: { channel: 'Meta / Instagram Ads', totalLeads: 0, wonCustomers: 0, totalRevenue: 0 },
      manual: { channel: 'Direct Manual Entry', totalLeads: 0, wonCustomers: 0, totalRevenue: 0 },
    };

    leads.forEach((l) => {
      const channel = l.sources && l.sources.length > 0 ? l.sources[0].channel : 'whatsapp';
      if (!channelStats[channel]) {
        channelStats[channel] = { channel, totalLeads: 0, wonCustomers: 0, totalRevenue: 0 };
      }
      channelStats[channel].totalLeads += 1;
      if (l.funnel_state === 'WON') {
        channelStats[channel].wonCustomers += 1;
      }
    });

    orders.forEach((o) => {
      const lead = leads.find((l) => l.phone_number === o.phone_number);
      const channel = lead?.sources && lead.sources.length > 0 ? lead.sources[0].channel : 'whatsapp';
      if (channelStats[channel]) {
        channelStats[channel].totalRevenue += Number(o.amount_received || 0);
      }
    });

    const campaigns = memCampaigns.map((c) => {
      const matchedLeads = leads.filter((l) =>
        l.sources?.some((s: any) => s.campaign_name?.toLowerCase().includes(c.name.toLowerCase()) || s.channel.toLowerCase().includes(c.source.toLowerCase()))
      );
      const won = matchedLeads.filter((l) => l.funnel_state === 'WON').length;
      const cLeadsCount = matchedLeads.length;
      const conversionRate = cLeadsCount > 0 ? Number(((won / cLeadsCount) * 100).toFixed(1)) : 0;
      const cpa = won > 0 ? Number((c.ad_spend / won).toFixed(0)) : 0;

      return {
        ...c,
        leadsCount: cLeadsCount,
        wonCustomers: won,
        conversionRate,
        costPerAcquisition: cpa,
      };
    });

    res.json({
      channels: Object.values(channelStats),
      campaigns,
      summary: {
        totalLeads: leads.length,
        totalCustomers: customers.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.amount_received || 0), 0),
        overallConversionRate: leads.length > 0 ? Number(((customers.length / leads.length) * 100).toFixed(1)) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
