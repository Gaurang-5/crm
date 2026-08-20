import { Router } from 'express';
import {
  getAllCustomers,
  getCustomer,
  convertLeadToCustomerTransaction,
  getOnboardingItems,
  toggleOnboardingItem,
  getProgressCheckins,
  createProgressCheckin,
  getMeasurements,
  createMeasurement,
  getProgressPhotos,
  createProgressPhoto,
  getMilestones,
  createMilestone,
  getOrders,
  getPayments,
  getActivities,
  getCustomerBalances,
} from '../../../db';
import { evaluateAutomationsForTrigger } from '../automations/automations.service';

export const customersRouter = Router();

// Convert Won Lead to Customer (Transactional)
customersRouter.post('/convert', async (req, res, next) => {
  try {
    const { leadPhone, planCode, startDate, goals, initialWeightKg, f1Flavors, afreshFlavors, deliveryAddress } = req.body;
    if (!leadPhone || !planCode) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Lead phone and Plan code are required for conversion' } });
    }
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const result = await convertLeadToCustomerTransaction({
      leadPhone,
      coachId,
      planCode,
      startDate,
      goals,
      initialWeightKg: initialWeightKg ? Number(initialWeightKg) : undefined,
      f1Flavors,
      afreshFlavors,
      deliveryAddress,
    });

    // Trigger Won Onboarding Automation Sequence
    await evaluateAutomationsForTrigger('WON_ONBOARDING', {
      phone: result.customer.phone_number,
      customerId: result.customer.id,
      name: result.customer.name,
      plan: planCode,
      coachId,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// List all Customers
customersRouter.get('/', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const status = req.query.status as string | undefined;
    const customers = await getAllCustomers(coachId, status);
    const balances = await getCustomerBalances(coachId);

    const enriched = customers.map((c) => {
      const bal = balances.find((b) => b.customerId === c.id);
      return {
        ...c,
        totalOrdersAmount: bal?.totalOrdersAmount || 0,
        totalPaymentsReceived: bal?.totalPaymentsReceived || 0,
        outstandingBalance: bal?.outstandingBalance || 0,
        cashProfit: bal?.cashProfit || 0,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// Get Single Customer Hub
customersRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const customer = await getCustomer(id);
    if (!customer) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }

    const onboarding = await getOnboardingItems(id);
    const checkins = await getProgressCheckins(id);
    const measurements = await getMeasurements(id);
    const photos = await getProgressPhotos(id);
    const milestones = await getMilestones(id);
    const orders = await getOrders(undefined, id);
    const payments = await getPayments(id);
    const activities = await getActivities(undefined, id);

    // Compute progress comparison
    const baseline = checkins.length > 0 ? checkins[0] : null;
    const latest = checkins.length > 0 ? checkins[checkins.length - 1] : null;
    const weightLossKg = baseline && latest && baseline.weight_kg && latest.weight_kg
      ? Math.max(0, baseline.weight_kg - latest.weight_kg)
      : 0;

    res.json({
      customer,
      onboarding,
      checkins,
      measurements,
      photos,
      milestones,
      orders,
      payments,
      activities,
      progressSummary: {
        baselineWeight: baseline?.weight_kg,
        currentWeight: latest?.weight_kg,
        totalWeightLossKg: weightLossKg,
        checkinCount: checkins.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Onboarding Items toggle
customersRouter.get('/:id/onboarding', async (req, res, next) => {
  try {
    const items = await getOnboardingItems(req.params.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

customersRouter.put('/onboarding/:id/toggle', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { is_completed } = req.body;
    const updated = await toggleOnboardingItem(id, Boolean(is_completed));
    if (!updated) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Onboarding item not found' } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Progress Check-ins
customersRouter.get('/:id/checkins', async (req, res, next) => {
  try {
    const checkins = await getProgressCheckins(req.params.id);
    res.json(checkins);
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/:id/checkins', async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const checkin = await createProgressCheckin({
      customer_id: customerId,
      ...req.body,
    });

    const customer = await getCustomer(customerId);
    if (customer && req.body.weight_kg) {
      const allCheckins = await getProgressCheckins(customerId);
      const baseline = allCheckins[0];
      if (baseline && baseline.weight_kg && baseline.weight_kg - req.body.weight_kg >= 2) {
        const loss = Number((baseline.weight_kg - req.body.weight_kg).toFixed(1));
        await createMilestone({
          customer_id: customerId,
          title: `Achieved ${loss} kg Weight Loss! 🏆`,
          metric_name: 'weight_loss_kg',
          initial_val: baseline.weight_kg,
          achieved_val: req.body.weight_kg,
        });

        // Trigger Milestone automation
        await evaluateAutomationsForTrigger('MILESTONE_REACHED', {
          phone: customer.phone_number,
          customerId,
          name: customer.name,
          loss_kg: loss,
          coachId: customer.coach_id,
        });
      }
    }

    res.status(201).json(checkin);
  } catch (err) {
    next(err);
  }
});

// Measurements
customersRouter.get('/:id/measurements', async (req, res, next) => {
  try {
    const list = await getMeasurements(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/:id/measurements', async (req, res, next) => {
  try {
    const m = await createMeasurement({ customer_id: req.params.id, ...req.body });
    res.status(201).json(m);
  } catch (err) {
    next(err);
  }
});

// Photos
customersRouter.get('/:id/photos', async (req, res, next) => {
  try {
    const list = await getProgressPhotos(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/:id/photos', async (req, res, next) => {
  try {
    const p = await createProgressPhoto({ customer_id: req.params.id, ...req.body });
    res.status(201).json(p);
  } catch (err) {
    next(err);
  }
});

// Milestones
customersRouter.get('/:id/milestones', async (req, res, next) => {
  try {
    const list = await getMilestones(req.params.id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

customersRouter.post('/:id/milestones', async (req, res, next) => {
  try {
    const m = await createMilestone({ customer_id: req.params.id, ...req.body });
    res.status(201).json(m);
  } catch (err) {
    next(err);
  }
});
