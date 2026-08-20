import { Router } from 'express';
import {
  getAllLeads,
  getAllCustomers,
  getTasks,
  getAppointments,
  getCustomerBalances,
  getProgressCheckins,
  getOrders,
  getPayments,
  getExpenses,
  getProfitSheets,
  pool,
  useInMemory,
} from '../../../db';

export const reportsRouter = Router();

// Today Dashboard Intelligence
reportsRouter.get('/today', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const leads = await getAllLeads(coachId);
    const customers = await getAllCustomers(coachId, 'ACTIVE');
    const allTasks = await getTasks(coachId, 'PENDING');
    const allAppointments = await getAppointments(coachId, 'SCHEDULED');
    const balances = await getCustomerBalances(coachId);

    // 1. Overdue and Today's Tasks
    const overdueTasks = allTasks.filter((t) => new Date(t.due_date).getTime() < now.getTime());
    const upcomingTasks = allTasks.filter((t) => new Date(t.due_date).toISOString().split('T')[0] === todayStr && !overdueTasks.includes(t));

    // 2. New Inbound Leads awaiting first contact
    const newLeads = leads.filter((l) => l.funnel_state === 'NEW' || l.funnel_state === 'CONTACTED');

    // 3. Appointments scheduled for today
    const appointmentsToday = allAppointments.filter((a) => new Date(a.scheduled_at).toISOString().split('T')[0] === todayStr);

    // 4. Pending Payments
    const pendingPayments = balances.filter((b) => b.outstandingBalance > 0);

    // 5. Renewals Due (15 days, 7 days, 1 day)
    const renewalsDue = customers.filter((c) => {
      if (!c.renewal_date) return false;
      const diffDays = Math.ceil((new Date(c.renewal_date).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 15 && diffDays >= -2;
    }).map((c) => {
      const diffDays = Math.ceil((new Date(c.renewal_date!).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return {
        ...c,
        daysLeft: diffDays,
        urgency: diffDays <= 1 ? 'CRITICAL' : diffDays <= 7 ? 'HIGH' : 'MEDIUM',
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);

    // 6. Missed Check-ins
    const missedCheckins = [];
    for (const c of customers) {
      const checkins = await getProgressCheckins(c.id);
      const latest = checkins.length > 0 ? checkins[checkins.length - 1] : null;
      if (!latest) {
        missedCheckins.push({ customer: c, lastCheckin: 'Never' });
      } else {
        const diffDays = Math.floor((now.getTime() - new Date(latest.checkin_date).getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 2) {
          missedCheckins.push({ customer: c, lastCheckin: latest.checkin_date, daysMissed: diffDays });
        }
      }
    }

    // 7. Real System Operational Health Signal
    const isDbConnected = pool ? !pool.ended : true;
    const systemHealth = {
      status: isDbConnected ? 'HEALTHY' : 'DEGRADED',
      database: useInMemory ? 'IN_MEMORY_TEST' : (isDbConnected ? 'CONNECTED_POSTGRES' : 'DISCONNECTED'),
      queue: 'ACTIVE',
      uptimeSec: Math.floor(process.uptime()),
    };

    res.json({
      summary: {
        overdueTasksCount: overdueTasks.length,
        newLeadsCount: newLeads.length,
        appointmentsTodayCount: appointmentsToday.length,
        renewalsDueCount: renewalsDue.length,
        pendingPaymentsCount: pendingPayments.length,
        missedCheckinsCount: missedCheckins.length,
      },
      overdueTasks,
      upcomingTasks,
      newLeads,
      appointmentsToday,
      renewalsDue,
      pendingPayments,
      missedCheckins,
      systemHealth,
    });
  } catch (err) {
    next(err);
  }
});

// Retention Cohorts Report
reportsRouter.get('/retention', async (req, res, next) => {
  try {
    const coachId = (req as any).coach?.id || 'coach_deepa';
    const customers = await getAllCustomers(coachId);
    const active = customers.filter((c) => c.status === 'ACTIVE').length;
    const inactive = customers.filter((c) => c.status === 'INACTIVE').length;
    const completed = customers.filter((c) => c.status === 'COMPLETED').length;

    res.json({
      totalCustomers: customers.length,
      activeCustomers: active,
      inactiveCustomers: inactive,
      completedCustomers: completed,
      retentionRate: customers.length > 0 ? Number(((active / customers.length) * 100).toFixed(1)) : 100,
    });
  } catch (err) {
    next(err);
  }
});

// CSV / JSON Data Export
reportsRouter.get('/export', async (req, res, next) => {
  try {
    const type = req.query.type || 'customers';
    const format = req.query.format || 'json';
    const coachId = (req as any).coach?.id || 'coach_deepa';

    let data: any[] = [];
    if (type === 'leads') {
      data = await getAllLeads(coachId);
    } else if (type === 'orders') {
      data = await getOrders(undefined, undefined, coachId);
    } else if (type === 'payments') {
      data = await getPayments(undefined, coachId);
    } else {
      data = await getAllCustomers(coachId);
    }

    if (format === 'csv') {
      if (data.length === 0) {
        res.setHeader('Content-Type', 'text/csv');
        return res.send('');
      }
      const headers = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
      const csvRows = [
        headers.join(','),
        ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
      return res.send(csvRows.join('\n'));
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});
