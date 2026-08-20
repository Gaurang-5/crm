import { Router } from 'express';
import {
  getPlans,
  getProducts,
  getOrders,
  createOrder,
  updateOrderStatus,
  getPayments,
  createPayment,
  getRefunds,
  createRefund,
  getExpenses,
  createExpense,
  getCustomerBalances,
  getProfitSheets,
  ensureProfitSheet,
  getProfitEntries,
  createProfitEntry,
  updateProfitEntry,
  deleteProfitEntry,
  getLifetimeProfitStats,
  getCustomer,
} from '../../../db';
import { getCurrentSheetId } from '../../../workflows';
import { evaluateAutomationsForTrigger } from '../automations/automations.service';

export const commerceRouter = Router();

// Plans & Products Catalog
commerceRouter.get('/plans', async (req, res, next) => {
  try {
    const plans = await getPlans();
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

commerceRouter.get('/products', async (req, res, next) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Orders
commerceRouter.get('/orders', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const orders = await getOrders(req.query.phone as string, req.query.customerId as string, coachId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

commerceRouter.post('/orders', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { phone_number, customer_id, membership_type, transaction_type, items, delivery_address, notes } = req.body;

    const products = await getProducts();
    let totalAmount = 0;
    let totalCost = 0;
    const snapItems = (items || []).map((item: any) => {
      const prod = products.find((p) => p.id === item.product_id || p.code === item.product_code);
      const unitPrice = prod ? prod.sales_price : Number(item.unit_price || 0);
      const unitCost = prod ? prod.unit_cost : Number(item.unit_cost || 0);
      const qty = Number(item.quantity || 1);
      const subtotalPrice = unitPrice * qty;
      const subtotalCost = unitCost * qty;
      totalAmount += subtotalPrice;
      totalCost += subtotalCost;
      return {
        product_id: prod?.id || item.product_id,
        product_name_snapshot: prod?.name || item.name || 'Custom Product',
        unit_price_snapshot: unitPrice,
        unit_cost_snapshot: unitCost,
        quantity: qty,
        subtotal_price: subtotalPrice,
        subtotal_cost: subtotalCost,
      };
    });

    const order = await createOrder({
      coach_id: coachId,
      phone_number,
      customer_id,
      membership_type: membership_type || 'Custom Order',
      transaction_type: transaction_type || 'New',
      amount_received: totalAmount,
      coach_amount: totalAmount,
      cost_of_kit: totalCost,
      cash_profit: totalAmount - totalCost,
      total_cost: totalCost,
      order_status: 'PLACED',
      delivery_address,
      notes,
      items: snapItems,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

commerceRouter.put('/orders/:id/status', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const order = await updateOrderStatus(id, status);
    if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Payments
commerceRouter.get('/payments', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const list = await getPayments(req.query.customerId as string, coachId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

commerceRouter.post('/payments', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { customer_id, order_id, amount, payment_date, payment_method, reference_no, notes } = req.body;
    if (!customer_id || !amount) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Customer ID and amount are required' } });
    }
    const payment = await createPayment({
      coach_id: coachId,
      customer_id,
      order_id: order_id ? Number(order_id) : undefined,
      amount: Number(amount),
      payment_date,
      payment_method: payment_method || 'UPI',
      reference_no,
      notes,
      author_id: coachId,
    });

    // Check if customer still has balance or if payment reminder should be sent
    const customer = await getCustomer(customer_id);
    const sheetId = getCurrentSheetId();
    await ensureProfitSheet(sheetId, coachId);
    await createProfitEntry({
      sheet_id: sheetId,
      coach_id: coachId,
      payment_date: payment_date || new Date(),
      phone_number: customer?.phone_number,
      member_name: customer?.name || 'Customer',
      membership_type: customer?.current_plan || 'Basic',
      transaction_type: 'Payment',
      amount_received: Number(amount),
      coach_amount: Number(amount),
      cost_of_kit: 0,
      cash_profit: Number(amount),
      payment_status: 'Received',
    });

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

// Refunds
commerceRouter.get('/refunds', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const list = await getRefunds(req.query.customerId as string, coachId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

commerceRouter.post('/refunds', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { customer_id, order_id, amount, refund_date, reason } = req.body;
    if (!customer_id || !amount) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Customer ID and amount are required' } });
    }
    const refund = await createRefund({
      coach_id: coachId,
      customer_id,
      order_id: order_id ? Number(order_id) : undefined,
      amount: Number(amount),
      refund_date,
      reason,
    });
    res.status(201).json(refund);
  } catch (err) {
    next(err);
  }
});

// Expenses
commerceRouter.get('/expenses', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const list = await getExpenses(coachId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

commerceRouter.post('/expenses', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const { title, category, amount, expense_date, notes } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Title and amount are required' } });
    }
    const exp = await createExpense({
      coach_id: coachId,
      title,
      category: category || 'MARKETING',
      amount: Number(amount),
      expense_date,
      notes,
    });
    res.status(201).json(exp);
  } catch (err) {
    next(err);
  }
});

// Customer Balances Ledger
commerceRouter.get('/balances', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const balances = await getCustomerBalances(coachId);
    res.json(balances);
  } catch (err) {
    next(err);
  }
});

// Profit Sheets & Entries
commerceRouter.get('/profit-sheets', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const sheets = await getProfitSheets(coachId);
    const currentSheet = getCurrentSheetId();
    await ensureProfitSheet(currentSheet, coachId);
    res.json({ currentSheet, sheets });
  } catch (err) {
    next(err);
  }
});

commerceRouter.get('/profit-sheets/:sheetId', async (req, res, next) => {
  try {
    const sheetId = req.params.sheetId;
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const entries = await getProfitEntries(sheetId, coachId);
    const expenses = await getExpenses(coachId);

    let totalReceived = 0;
    let totalCoach = 0;
    let totalKit = 0;
    let totalProfit = 0;
    entries.forEach((e: any) => {
      totalReceived += Number(e.amount_received || 0);
      totalCoach += Number(e.coach_amount || 0);
      totalKit += Number(e.cost_of_kit || 0);
      totalProfit += Number(e.cash_profit || 0);
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalProfit - totalExpenses;
    const lifetime = await getLifetimeProfitStats(coachId);

    res.json({
      sheetId,
      entries,
      totals: {
        totalReceived,
        totalCoach,
        totalKit,
        totalGrossProfit: totalProfit,
        totalExpenses,
        netCashProfit: netProfit,
      },
      lifetime,
    });
  } catch (err) {
    next(err);
  }
});

commerceRouter.post('/profit-entries', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const entry = await createProfitEntry({ ...req.body, coach_id: coachId });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

commerceRouter.put('/profit-entries/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateProfitEntry(id, req.body);
    if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entry not found' } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

commerceRouter.delete('/profit-entries/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteProfitEntry(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
