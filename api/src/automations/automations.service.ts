import {
  getAutomationRules,
  getMessageTemplates,
  createAutomationRun,
  recordMessageDelivery,
  createTask,
  logActivity,
  logAuditEvent,
} from '../../../db';
import { AutomationTrigger, MessageTemplate } from '../shared/types';
import { enqueue } from '../../../queue';

export function isQuietHours(date = new Date()): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeNum = hours + minutes / 60;
  // Quiet hours between 9:30 PM (21.5) and 8:00 AM (8.0)
  return timeNum >= 21.5 || timeNum < 8.0;
}

export function interpolateTemplate(template: string, vars: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(pattern, String(value ?? ''));
  }
  return result;
}

export async function evaluateAutomationsForTrigger(trigger: AutomationTrigger, context: {
  phone?: string;
  customerId?: string;
  name?: string;
  coachId?: string;
  plan?: string;
  balance?: number;
  days_left?: number;
  renewal_date?: string;
  water_target?: number;
  loss_kg?: number;
  [key: string]: any;
}) {
  const coachId = context.coachId || 'coach_deepa';
  const rules = await getAutomationRules(coachId);
  const matchingRules = rules.filter((r) => r.is_active && r.trigger_event === trigger);
  const templates = await getMessageTemplates();

  for (const rule of matchingRules) {
    const template = templates.find((t) => t.id === rule.template_id);
    const targetPhone = context.phone;

    let bodyText = '';
    if (template) {
      bodyText = interpolateTemplate(template.body_template, {
        name: context.name || 'Member',
        plan: context.plan || 'Basic',
        balance: context.balance || 0,
        days_left: context.days_left || 7,
        renewal_date: context.renewal_date || 'Upcoming Date',
        water_target: context.water_target || 3,
        loss_kg: context.loss_kg || 2,
        session_time: '7:30 AM - 8:30 AM Daily',
        zoom_link: 'https://zoom.us/j/community',
      });
    }

    if (rule.requires_manual_approval) {
      await createAutomationRun({
        rule_id: rule.id,
        target_entity_type: context.customerId ? 'customer' : 'lead',
        target_entity_id: context.customerId || targetPhone || 'unknown',
        status: 'PENDING_APPROVAL',
        payload: { ...context, rendered_body: bodyText },
      });

      await createTask({
        coach_id: coachId,
        phone_number: targetPhone,
        customer_id: context.customerId,
        title: `Approve Outbound Automation: ${rule.name} for ${context.name || 'Member'}`,
        due_date: new Date().toISOString(),
        priority: 'HIGH',
      });
      continue;
    }

    // Direct Execution / Scheduling
    const quiet = isQuietHours();
    const scheduledFor = quiet
      ? new Date(new Date().setHours(8, 30, 0, 0) + (new Date().getHours() >= 21 ? 24 * 3600 * 1000 : 0)).toISOString()
      : new Date().toISOString();

    const run = await createAutomationRun({
      rule_id: rule.id,
      target_entity_type: context.customerId ? 'customer' : 'lead',
      target_entity_id: context.customerId || targetPhone || 'unknown',
      status: quiet ? 'QUEUED' : 'SENT',
      scheduled_for: scheduledFor,
      executed_at: quiet ? undefined : new Date().toISOString(),
      payload: { ...context, rendered_body: bodyText },
    });

    if (rule.action_type === 'WHATSAPP' && targetPhone && bodyText && !quiet) {
      try {
        await enqueue({ task: 'SEND_TEXT', phone: targetPhone, body: bodyText });
        await recordMessageDelivery({
          phone: targetPhone,
          direction: 'OUTBOUND',
          message_type: 'TEXT',
          content: bodyText,
          status: 'SENT',
        });
      } catch (err: any) {
        console.error('Failed to send WhatsApp message via automation:', err);
      }
    } else if (rule.action_type === 'COACH_TASK') {
      await createTask({
        coach_id: coachId,
        phone_number: targetPhone,
        customer_id: context.customerId,
        title: rule.name + (context.name ? ` (${context.name})` : ''),
        due_date: new Date().toISOString(),
        priority: 'MEDIUM',
      });
    }
  }
}
