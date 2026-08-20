import { describe, expect, it, beforeEach } from 'vitest';
import {
  interpolateTemplate,
  isQuietHours,
  evaluateAutomationsForTrigger,
} from '../../src/automations/automations.service';
import {
  memAutomationRuns,
  memMessageDeliveries,
  memTasks,
} from '../../../db';

describe('Automation Engine and Templates', () => {
  beforeEach(() => {
    memAutomationRuns.length = 0;
    memMessageDeliveries.length = 0;
    memTasks.length = 0;
  });

  it('interpolates all template variables dynamically', () => {
    const tpl = 'नमस्ते {{name}} जी! आपकी {{plan}} मेंबरशिप का शेष ₹{{balance}} नियत है।';
    const rendered = interpolateTemplate(tpl, {
      name: 'सुनीता',
      plan: 'Basic',
      balance: 3400,
    });
    expect(rendered).toBe('नमस्ते सुनीता जी! आपकी Basic मेंबरशिप का शेष ₹3400 नियत है।');
  });

  it('detects quiet hours appropriately', () => {
    const lateNight = new Date('2026-08-20T22:30:00');
    expect(isQuietHours(lateNight)).toBe(true);

    const earlyMorning = new Date('2026-08-20T06:00:00');
    expect(isQuietHours(earlyMorning)).toBe(true);

    const midDay = new Date('2026-08-20T14:00:00');
    expect(isQuietHours(midDay)).toBe(false);
  });

  it('places manual approval required rules into PENDING_APPROVAL and creates coach task', async () => {
    await evaluateAutomationsForTrigger('PAYMENT_REMINDER', {
      phone: '919876543210',
      name: 'Vikas',
      balance: 3400,
      coachId: 'coach_deepa',
    });

    expect(memAutomationRuns).toHaveLength(1);
    expect(memAutomationRuns[0].status).toBe('PENDING_APPROVAL');
    expect(memTasks).toHaveLength(1);
    expect(memTasks[0].title).toContain('Approve Outbound Automation');
  });
});
