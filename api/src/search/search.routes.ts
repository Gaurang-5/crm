import { Router } from 'express';
import { getAllLeads, getAllCustomers } from '../../../db';

export const searchRouter = Router();

/**
 * GET /api/search/people?q=<query>
 * Returns matching leads + customers by name or phone prefix.
 * Used by the CustomerSearch autocomplete in forms.
 */
searchRouter.get('/search/people', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const q = ((req.query.q as string) || '').trim().toLowerCase();

    if (q.length < 2) {
      return res.json([]);
    }

    const [leads, customers] = await Promise.all([
      getAllLeads(coachId),
      getAllCustomers(coachId),
    ]);

    const results: Array<{
      id: string;
      name: string;
      phone: string;
      type: 'lead' | 'customer';
      address?: string;
    }> = [];

    const seen = new Set<string>();

    // Match customers first (they have more info)
    for (const c of customers) {
      const phone = c.phone_number || '';
      const name = (c.display_name || c.name || '').toLowerCase();
      if (name.startsWith(q) || phone.includes(q)) {
        if (!seen.has(phone)) {
          seen.add(phone);
          results.push({
            id: c.id,
            name: c.display_name || c.name || '',
            phone,
            type: 'customer',
          });
        }
      }
    }

    // Then match leads
    for (const l of leads) {
      const phone = l.phone_number || '';
      const name = (l.display_name || '').toLowerCase();
      if (name.startsWith(q) || phone.includes(q)) {
        if (!seen.has(phone)) {
          seen.add(phone);
          results.push({
            id: l.id || phone,
            name: l.display_name || '',
            phone,
            type: 'lead',
          });
        }
      }
    }

    res.json(results.slice(0, 10));
  } catch (err) {
    next(err);
  }
});
