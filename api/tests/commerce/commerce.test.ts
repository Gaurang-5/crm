import { describe, expect, it, beforeEach } from 'vitest';
import {
  createOrder,
  createPayment,
  createRefund,
  createExpense,
  getCustomerBalances,
  memCustomers,
  memOrders,
  memPayments,
  memRefunds,
  memExpenses,
} from '../../../db';

describe('Commerce, Historical Pricing, and Profit Derivation Engine', () => {
  beforeEach(() => {
    memCustomers.length = 0;
    memOrders.length = 0;
    memPayments.length = 0;
    memRefunds.length = 0;
    memExpenses.length = 0;
  });

  it('accurately derives outstanding balances from partial payments and refunds', async () => {
    memCustomers.push({
      id: 'cust_1',
      phone_number: '919876543210',
      name: 'Vikas Kumar',
      status: 'ACTIVE',
      start_date: '2026-08-20',
      current_plan: 'Basic',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 1. Order of ₹8,400 with kit cost ₹3,006
    await createOrder({
      customer_id: 'cust_1',
      phone_number: '919876543210',
      amount_received: 8400,
      cost_of_kit: 3006,
      order_status: 'PLACED',
    });

    // 2. Initial partial payment of ₹5,000
    await createPayment({
      customer_id: 'cust_1',
      amount: 5000,
      payment_method: 'UPI',
    });

    let balances = await getCustomerBalances('coach_deepa');
    let custBal = balances.find((b) => b.customerId === 'cust_1');
    expect(custBal?.totalOrdersAmount).toBe(8400);
    expect(custBal?.totalPaymentsReceived).toBe(5000);
    expect(custBal?.outstandingBalance).toBe(3400); // 8400 - 5000
    expect(custBal?.cashProfit).toBe(1994); // 5000 received - 3006 cost

    // 3. Second partial payment of ₹3,400 clearing the balance
    await createPayment({
      customer_id: 'cust_1',
      amount: 3400,
      payment_method: 'CASH',
    });

    balances = await getCustomerBalances('coach_deepa');
    custBal = balances.find((b) => b.customerId === 'cust_1');
    expect(custBal?.outstandingBalance).toBe(0);
    expect(custBal?.totalPaymentsReceived).toBe(8400);
    expect(custBal?.cashProfit).toBe(5394); // 8400 - 3006
  });

  it('freezes product price and cost snapshots in order items', async () => {
    const order = await createOrder({
      customer_id: 'cust_1',
      membership_type: 'Custom Nutrition Package',
      items: [
        {
          product_id: 'prod_f1_shake',
          product_name_snapshot: 'Formula 1 Shake (500g)',
          unit_price_snapshot: 2150,
          unit_cost_snapshot: 1450,
          quantity: 2,
          subtotal_price: 4300,
          subtotal_cost: 2900,
        },
      ],
      amount_received: 4300,
      cost_of_kit: 2900,
    });

    expect(order.items?.[0].unit_price_snapshot).toBe(2150);
    expect(order.items?.[0].unit_cost_snapshot).toBe(1450);
    expect(order.items?.[0].subtotal_price).toBe(4300);
  });
});
