import { describe, expect, it, beforeEach } from 'vitest';
import { ingestLead } from '../../src/leads/leads.service';
import {
  convertLeadToCustomerTransaction,
  getCustomer,
  getOnboardingItems,
  getProgressCheckins,
  getOrders,
  getTasks,
  createProgressCheckin,
  memCustomers,
  memEnrollments,
  memOnboardingItems,
  memOrders,
  memTasks,
  memProgressCheckins,
  memMilestones,
} from '../../../db';

describe('Customer Conversion and Journey Engine', () => {
  beforeEach(() => {
    memCustomers.length = 0;
    memEnrollments.length = 0;
    memOnboardingItems.length = 0;
    memOrders.length = 0;
    memTasks.length = 0;
    memProgressCheckins.length = 0;
    memMilestones.length = 0;
  });

  it('converts a won lead into a customer in one atomic transaction', async () => {
    const { lead } = await ingestLead({
      phone: '919876543210',
      name: 'Pooja Kapoor',
      channel: 'whatsapp',
    });

    const result = await convertLeadToCustomerTransaction({
      leadPhone: lead.phone_number,
      planCode: 'Elite',
      startDate: '2026-08-20',
      goals: 'Lose 8 kg and boost stamina',
      initialWeightKg: 74,
      f1Flavors: ['Kulfi', 'Rose Kheer', 'Mango'],
      afreshFlavors: ['Lemon', 'Peach'],
    });

    expect(result.customer.id).toBe('cust_919876543210');
    expect(result.customer.status).toBe('ACTIVE');
    expect(result.customer.current_plan).toBe('Elite');
    expect(result.customer.renewal_date).toBe('2026-09-19');

    // Verify 10 Onboarding Checklist Items generated
    const onboarding = await getOnboardingItems(result.customer.id);
    expect(onboarding).toHaveLength(10);
    expect(onboarding[0].title).toContain('Welcome Call');

    // Verify Baseline Check-in created
    const checkins = await getProgressCheckins(result.customer.id);
    expect(checkins).toHaveLength(1);
    expect(checkins[0].weight_kg).toBe(74);

    // Verify Initial Kit Order generated with frozen pricing snapshot
    const orders = await getOrders(undefined, result.customer.id);
    expect(orders).toHaveLength(1);
    expect(orders[0].amount_received).toBe(12070);
    expect(orders[0].cost_of_kit).toBe(5660);
    expect(orders[0].cash_profit).toBe(8990 - 5660); // 3330 (Coach amount - Cost of Kit)

    // Verify Scheduled Follow-up Tasks created
    const tasks = await getTasks('coach_deepa');
    const customerTasks = tasks.filter((t) => t.customer_id === result.customer.id);
    expect(customerTasks.length).toBeGreaterThanOrEqual(2);
  });
});
