import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import {
  upsertLead,
  convertLeadToCustomerTransaction,
  createTask,
  memLeads,
  memCustomers,
  memTasks,
  memOrders,
  memPayments,
  memPeople,
  memEnrollments,
  memOnboardingItems,
  memProgressCheckins,
  memMilestones,
  memStageHistory,
} from '../../../db';

describe('Reports and Today Dashboard Intelligence', () => {
  const app = createApp({});

  beforeEach(() => {
    memLeads.length = 0;
    memCustomers.length = 0;
    memTasks.length = 0;
    memOrders.length = 0;
    memPayments.length = 0;
    memPeople.length = 0;
    memEnrollments.length = 0;
    memOnboardingItems.length = 0;
    memProgressCheckins.length = 0;
    memMilestones.length = 0;
    memStageHistory.length = 0;
  });

  it('aggregates overdue tasks, new leads, pending payments, and upcoming renewals for Today', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'deepa@wellnessclub.com', password: 'Correct-Horse-2026' }).expect(200);

    // 1. Create a lead and convert it to customer with pending balance
    await upsertLead('919876543210', 'Deepak Joshi', { funnel_state: 'NEW' });
    await convertLeadToCustomerTransaction({
      leadPhone: '919876543210',
      planCode: 'Basic',
      startDate: new Date().toISOString().split('T')[0],
    });

    // 2. Create another inbound lead that remains in NEW stage
    await upsertLead('919111222333', 'Pooja Sharma', { funnel_state: 'NEW' });

    // 3. Create an overdue task
    await createTask({
      coach_id: 'coach_deepa',
      title: 'Call Pooja Sharma for Consultation',
      due_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      priority: 'HIGH',
    });

    const todayRes = await agent.get('/api/reports/today').expect(200);

    expect(todayRes.body.summary.overdueTasksCount).toBeGreaterThanOrEqual(1);
    expect(todayRes.body.summary.newLeadsCount).toBeGreaterThanOrEqual(1);
    expect(todayRes.body.summary.pendingPaymentsCount).toBeGreaterThanOrEqual(1);
    expect(todayRes.body.systemHealth.status).toBe('HEALTHY');
  });

  it('exports customer and lead data in CSV format', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'deepa@wellnessclub.com', password: 'Correct-Horse-2026' }).expect(200);

    await upsertLead('919999888777', 'Kavita Sen', { funnel_state: 'QUALIFIED' });

    const exportRes = await agent.get('/api/reports/export?type=leads&format=csv').expect(200);

    expect(exportRes.headers['content-type']).toContain('text/csv');
    expect(exportRes.text).toContain('919999888777');
    expect(exportRes.text).toContain('Kavita Sen');
  });
});
