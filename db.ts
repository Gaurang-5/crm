import { Pool } from 'pg';
import {
  Person,
  LeadSource,
  Campaign,
  PipelineStage,
  Lead,
  StageHistory,
  Activity,
  Task,
  Appointment,
  Customer,
  Plan,
  Enrollment,
  OnboardingItem,
  Product,
  Order,
  OrderItem,
  Payment,
  Refund,
  Expense,
  ProgressCheckin,
  Measurement,
  ProgressPhoto,
  Milestone,
  MessageTemplate,
  AutomationRule,
  AutomationRun,
  MessageDelivery,
  AuditEvent,
  ConsumerDataHomevisit,
  BodyAnalysisRecord,
} from './api/src/shared/types';
import { PRICING_CONFIG } from './constants';

export let useInMemory = process.env.APP_RUNTIME_MODE === 'test' || !process.env.DATABASE_URL;
export let pool: Pool | null = null;

export function setPool(p: Pool | null) {
  pool = p;
  useInMemory = !p;
}

// In-Memory Storage Arrays
export const memCoaches: any[] = [
  {
    id: 'coach_deepa',
    name: 'Deepa Bhatia',
    phone: '919876543210',
    email: 'deepa@wellnessclub.com',
    role: 'SENIOR_COACH',
    club_name: 'Healthy Living Club',
    club_code: 'WELLNESS101',
    zoom_link: 'https://zoom.us/j/community',
    session_time: '7:30 AM - 8:30 AM Daily',
    active: true,
  },
];

export const memCoachSessions: any[] = [];
export const memPeople: Person[] = [];
export const memLeadSources: LeadSource[] = [];
export const memCampaigns: Campaign[] = [
  { id: 1, name: 'Meta Instagram Weight Loss Ad 1', source: 'Instagram Lead Ads', ad_spend: 3500, status: 'ACTIVE' },
  { id: 2, name: 'WhatsApp Direct Outreach', source: 'WhatsApp', ad_spend: 0, status: 'ACTIVE' },
  { id: 3, name: 'Website Consultation Form', source: 'Website', ad_spend: 1200, status: 'ACTIVE' },
];

export const memPipelineStages: PipelineStage[] = [
  { code: 'NEW', name: 'New Lead', order_index: 1, is_terminal: false, is_won: false, is_lost: false, color: 'blue' },
  { code: 'CONTACTED', name: 'Contacted', order_index: 2, is_terminal: false, is_won: false, is_lost: false, color: 'indigo' },
  { code: 'QUALIFIED', name: 'Qualified', order_index: 3, is_terminal: false, is_won: false, is_lost: false, color: 'purple' },
  { code: 'CONSULTATION_BOOKED', name: 'Consultation Booked', order_index: 4, is_terminal: false, is_won: false, is_lost: false, color: 'amber' },
  { code: 'ATTENDED', name: 'Attended Session', order_index: 5, is_terminal: false, is_won: false, is_lost: false, color: 'orange' },
  { code: 'PLAN_OFFERED', name: 'Plan Offered', order_index: 6, is_terminal: false, is_won: false, is_lost: false, color: 'teal' },
  { code: 'WON', name: 'Won (Customer)', order_index: 7, is_terminal: true, is_won: true, is_lost: false, color: 'emerald' },
  { code: 'LOST', name: 'Lost', order_index: 8, is_terminal: true, is_won: false, is_lost: true, color: 'rose' },
];

export const memLeads: Lead[] = [];
export const memStageHistory: StageHistory[] = [];
export const memActivities: Activity[] = [];
export const memTasks: Task[] = [];
export const memAppointments: Appointment[] = [];

export const memCustomers: Customer[] = [];
export const memPlans: Plan[] = [
  {
    code: 'Basic',
    name: 'Basic Membership',
    price: 8400,
    coach_amount: 5320,
    cost_of_kit_new: 3006,
    cost_of_kit_renewal: 3497,
    f1_count: 2,
    afresh_count: 1,
    meals_replaced: 1,
    description: '1 Meal Replacement daily + Morning Club + 1 Afresh routine',
    active: true,
  },
  {
    code: 'Elite',
    name: 'Elite / Pro Membership',
    price: 12070,
    coach_amount: 8990,
    cost_of_kit_new: 5660,
    cost_of_kit_renewal: 6157,
    f1_count: 3,
    afresh_count: 2,
    meals_replaced: 2,
    description: '2 Meal Replacements daily + Morning & Evening Club + 2 Afresh routine',
    active: true,
  },
];
export const memEnrollments: Enrollment[] = [];
export const memOnboardingItems: OnboardingItem[] = [];

export const memProducts: Product[] = [
  { id: 'prod_f1_shake', code: 'F1_SHAKE', name: 'Formula 1 Nutritional Shake Mix (500g)', category: 'NUTRITION', sales_price: 2150, unit_cost: 1450, active: true },
  { id: 'prod_afresh', code: 'AFRESH_ENERGY', name: 'Afresh Energy Drink Mix (50g)', category: 'ENERGY', sales_price: 850, unit_cost: 560, active: true },
  { id: 'prod_protein', code: 'PPP_PROTEIN', name: 'Personalized Protein Powder (200g)', category: 'PROTEIN', sales_price: 1420, unit_cost: 950, active: true },
  { id: 'prod_multivitamin', code: 'MULTIVIT', name: 'Multivitamin Mineral Complex (90 tabs)', category: 'WELLNESS', sales_price: 1650, unit_cost: 1100, active: true },
  { id: 'prod_celluloss', code: 'CELLULOSS', name: 'Cell-U-Loss Herbal Blend (90 tabs)', category: 'WEIGHT_MANAGEMENT', sales_price: 1720, unit_cost: 1150, active: true },
  { id: 'prod_aloe', code: 'HERBAL_ALOE', name: 'Herbal Aloe Concentrate (500ml)', category: 'DIGESTION', sales_price: 2450, unit_cost: 1620, active: true },
  { id: 'prod_shaker', code: 'SHAKER_CUP', name: 'Neon Shaker Cup with Whisk Ball (600ml)', category: 'ACCESSORY', sales_price: 450, unit_cost: 220, active: true },
];

export const memOrders: Order[] = [];
export const memOrderItems: OrderItem[] = [];
export const memPayments: Payment[] = [];
export const memRefunds: Refund[] = [];
export const memExpenses: Expense[] = [];
export const memExpenseAllocations: any[] = [];

export const memBodyAnalyses: any[] = [];
export const memHomeVisits: any[] = [];
export const memConsumerHomevisitForms: ConsumerDataHomevisit[] = [];
export const memProfitSheets: any[] = [];
export const memProfitEntries: any[] = [];
export const memProgressCheckins: ProgressCheckin[] = [];
export const memMeasurements: Measurement[] = [];
export const memProgressPhotos: ProgressPhoto[] = [];
export const memMilestones: Milestone[] = [];

export const memMessageTemplates: MessageTemplate[] = [
  { id: 'tpl_welcome_lead', code: 'WELCOME_LEAD', name: 'New Lead Welcome', category: 'LEAD_ACQUISITION', body_template: 'नमस्ते {{name}} जी! 🙏 वेलनेस क्लब में आपका स्वागत है। आपकी हेल्थ एनालिसिस रिपोर्ट तैयार करने के लिए क्या आप 2 मिनट समय दे सकते हैं?', required_variables: ['name'], is_active: true },
  { id: 'tpl_zoom_invite', code: 'ZOOM_INVITE', name: 'Morning Club Zoom Invite', category: 'SALES_PIPELINE', body_template: '🎉 नमस्ते {{name}} जी! आपको लाइव ज़ूम वर्कआउट और वेलनेस ओरिएंटेशन के लिए आमंत्रित किया गया है। समय: {{session_time}} | लिंक: {{zoom_link}}', required_variables: ['name', 'session_time', 'zoom_link'], is_active: true },
  { id: 'tpl_welcome_customer', code: 'WELCOME_CUSTOMER', name: 'Won Lead Onboarding Welcome', category: 'ONBOARDING', body_template: '🎉 बधाई हो {{name}} जी! आपकी {{plan}} मेंबरशिप शुरू हो गई है। हम आपके साथ 1st Home Visit व डाइट रूटीन चार्ट साझा कर रहे हैं।', required_variables: ['name', 'plan'], is_active: true },
  { id: 'tpl_daily_checkin', code: 'DAILY_CHECKIN', name: 'Daily Morning Routine Check-in', category: 'PROGRESS', body_template: '🌅 सुप्रभात {{name}} जी! आज का वजन और पानी का लक्ष्य ({{water_target}}L) अपडेट करना न भूलें। आज आप कैसा महसूस कर रहे हैं?', required_variables: ['name', 'water_target'], is_active: true },
  { id: 'tpl_milestone_loss', code: 'MILESTONE_WEIGHT_LOSS', name: 'Weight Loss Milestone', category: 'PROGRESS', body_template: '🏆 वाह {{name}} जी! आपने कुल {{loss_kg}} kg वजन सफलतापूर्वक कम कर लिया है! बधाई हो!', required_variables: ['name', 'loss_kg'], is_active: true },
  { id: 'tpl_renewal_reminder', code: 'RENEWAL_REMINDER', name: 'Renewal Due Reminder', category: 'RENEWAL', body_template: '⏰ नमस्ते {{name}} जी! आपकी मेंबरशिप {{days_left}} दिन बाद ({{renewal_date}}) रिन्यूअल के लिए नियत है। अपनी निरंतरता बनाए रखने के लिए संपर्क करें।', required_variables: ['name', 'days_left', 'renewal_date'], is_active: true },
  { id: 'tpl_payment_reminder', code: 'PAYMENT_REMINDER', name: 'Pending Balance Reminder', category: 'PAYMENTS', body_template: '💳 नमस्ते {{name}} जी! आपके वेलनेस प्लान का बकाया ₹{{balance}} नियत है। कृपया UPI द्वारा भुगतान पूरा करें।', required_variables: ['name', 'balance'], is_active: true },
  { id: 'tpl_inactive_recovery', code: 'INACTIVE_RECOVERY', name: 'Inactive Customer Recovery', category: 'RETENTION', body_template: '🌿 नमस्ते {{name}} जी! हमें आपकी वेलनेस यात्रा याद आ रही है। आइए फिर से शुरुआत करें और एक नई गति प्राप्त करें!', required_variables: ['name'], is_active: true },
  { id: 'tpl_referral_ask', code: 'REFERRAL_REQUEST', name: 'Referral Invitation', category: 'REFERRAL', body_template: '🌟 नमस्ते {{name}} जी! आपकी शानदार प्रगति देखकर आपके परिवार या मित्र भी स्वस्थ होना चाहेंगे। किसी 1 दोस्त को फ्री बॉडी एनालिसिस गिफ्ट करें!', required_variables: ['name'], is_active: true },
];

export const memAutomationRules: AutomationRule[] = [
  { id: 'rule_new_lead', name: 'Instant New Lead Acknowledgement', trigger_event: 'NEW_LEAD', conditions: {}, delay_minutes: 0, action_type: 'WHATSAPP', template_id: 'tpl_welcome_lead', requires_manual_approval: false, is_active: true },
  { id: 'rule_won_onboarding', name: 'Customer Onboarding Welcome Sequence', trigger_event: 'WON_ONBOARDING', conditions: {}, delay_minutes: 0, action_type: 'WHATSAPP', template_id: 'tpl_welcome_customer', requires_manual_approval: false, is_active: true },
  { id: 'rule_daily_checkin', name: 'Daily Morning Routine Check-in', trigger_event: 'DAILY_CHECKIN', conditions: { time: '07:00' }, delay_minutes: 0, action_type: 'WHATSAPP', template_id: 'tpl_daily_checkin', requires_manual_approval: false, is_active: true },
  { id: 'rule_renewal_15d', name: 'Renewal Reminder 15 Days Notice', trigger_event: 'RENEWAL_15D', conditions: { days_before: 15 }, delay_minutes: 0, action_type: 'WHATSAPP', template_id: 'tpl_renewal_reminder', requires_manual_approval: false, is_active: true },
  { id: 'rule_renewal_7d', name: 'Renewal Reminder 7 Days Notice', trigger_event: 'RENEWAL_7D', conditions: { days_before: 7 }, delay_minutes: 0, action_type: 'WHATSAPP', template_id: 'tpl_renewal_reminder', requires_manual_approval: false, is_active: true },
  { id: 'rule_payment_reminder', name: 'Pending Balance Alert', trigger_event: 'PAYMENT_REMINDER', conditions: {}, delay_minutes: 0, action_type: 'WHATSAPP', template_id: 'tpl_payment_reminder', requires_manual_approval: true, is_active: true },
  { id: 'rule_referral_milestone', name: 'Milestone Celebration & Referral', trigger_event: 'MILESTONE_REACHED', conditions: {}, delay_minutes: 60, action_type: 'WHATSAPP', template_id: 'tpl_referral_ask', requires_manual_approval: false, is_active: true },
];

export const memAutomationRuns: AutomationRun[] = [];
export const memMessageDeliveries: MessageDelivery[] = [];
export const memAuditEvents: AuditEvent[] = [];
export const memProcessedWebhooks = new Set<string>();
export const memSettings: Record<string, string> = {
  app_base_url: 'http://localhost:3000',
  zoom_link: 'https://zoom.us/j/community',
  session_time: '7:30 AM - 8:30 AM Daily',
  club_code: 'WELLNESS101',
};

// Phone Normalization Helper
export function normalizePhone(raw: string): string {
  let cleaned = String(raw || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}

export async function initSchema() {
  if (pool && !useInMemory) {
    // Migrations are run via migration runner
  }
}

// Coach Methods
export async function getCoaches() {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM coaches WHERE active = true ORDER BY name');
    return rows;
  }
  return memCoaches;
}

export async function getCoachById(id: string) {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM coaches WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return memCoaches.find((c) => c.id === id) || null;
}

export async function getCoachByPhone(phone: string) {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM coaches WHERE phone = $1 OR phone = $2', [phone, norm]);
    return rows[0] || null;
  }
  return memCoaches.find((c) => normalizePhone(c.phone) === norm) || null;
}

export async function upsertCoach(coach: any) {
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO coaches (id, name, phone, email, role, club_name, club_code, zoom_link, session_time, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         zoom_link = EXCLUDED.zoom_link,
         session_time = EXCLUDED.session_time,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coach.id, coach.name, coach.phone, coach.email, coach.role || 'COACH', coach.club_name || 'Wellness Club', coach.club_code || 'WELLNESS101', coach.zoom_link, coach.session_time, coach.active ?? true]
    );
    return rows[0];
  }
  const idx = memCoaches.findIndex((c) => c.id === coach.id);
  if (idx >= 0) {
    memCoaches[idx] = { ...memCoaches[idx], ...coach };
    return memCoaches[idx];
  }
  memCoaches.push(coach);
  return coach;
}

// People & Lead Ingestion
export async function findPersonByPhone(phone: string): Promise<Person | null> {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM people WHERE phone = $1', [norm]);
    return rows[0] || null;
  }
  return memPeople.find((p) => normalizePhone(p.phone || p.phone_number) === norm) || null;
}

export async function upsertPerson(person: { id?: string; phone: string; name: string; email?: string; gender?: string; city?: string }): Promise<Person> {
  const norm = normalizePhone(person.phone);
  const id = person.id || 'person_' + norm;
  const now = new Date().toISOString();

  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO people (id, phone, name, email, gender, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phone) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, people.name),
         email = COALESCE(EXCLUDED.email, people.email),
         gender = COALESCE(EXCLUDED.gender, people.gender),
         city = COALESCE(EXCLUDED.city, people.city),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, norm, person.name, person.email, person.gender, person.city]
    );
    return rows[0];
  }

  const existing = memPeople.find((p) => normalizePhone(p.phone || p.phone_number) === norm);
  if (existing) {
    if (person.name) {
      existing.name = person.name;
      existing.full_name = person.name;
    }
    if (person.email) existing.email = person.email;
    if (person.gender) existing.gender = person.gender;
    if (person.city) existing.city = person.city;
    existing.updated_at = now;
    return existing;
  }
  const created: Person = {
    id,
    phone_number: norm,
    phone: norm,
    full_name: person.name,
    name: person.name,
    email: person.email,
    gender: person.gender,
    city: person.city,
    created_at: now,
    updated_at: now,
  };
  memPeople.push(created);
  return created;
}

export async function createLeadSource(source: LeadSource): Promise<LeadSource> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO lead_sources (person_id, channel, campaign_name, ad_id, form_id, utm_source, utm_campaign, raw_payload, consent_given, consent_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [source.person_id, source.channel, source.campaign_name, source.ad_id, source.form_id, source.utm_source, source.utm_campaign, JSON.stringify(source.raw_payload || {}), source.consent_given ?? true, source.consent_timestamp || now]
    );
    return rows[0];
  }
  const created: LeadSource = { ...source, id: memLeadSources.length + 1, created_at: now };
  memLeadSources.push(created);
  return created;
}

export async function getLeadSources(personId: string): Promise<LeadSource[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM lead_sources WHERE person_id = $1 ORDER BY created_at DESC', [personId]);
    return rows;
  }
  return memLeadSources.filter((s) => s.person_id === personId);
}

// Pipeline Stages
export async function getPipelineStages(): Promise<PipelineStage[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM pipeline_stages ORDER BY order_index ASC');
    return rows;
  }
  return memPipelineStages.slice().sort((a, b) => a.order_index - b.order_index);
}

// Leads
export async function getLead(phone: string): Promise<Lead | null> {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `SELECT l.*, p.name as person_name, p.email as person_email, p.city as person_city
       FROM leads l
       LEFT JOIN people p ON l.person_id = p.id
       WHERE l.phone_number = $1`,
      [norm]
    );
    if (!rows[0]) return null;
    const l = rows[0];
    return {
      ...l,
      display_name: l.display_name || l.person_name,
      person: l.person_id ? { id: l.person_id, phone: l.phone_number, name: l.person_name, email: l.person_email, city: l.person_city } : undefined,
    };
  }
  const lead = memLeads.find((l) => normalizePhone(l.phone_number) === norm);
  if (!lead) return null;
  const person = lead.person_id ? memPeople.find((p) => p.id === lead.person_id) : undefined;
  const sources = lead.person_id ? memLeadSources.filter((s) => s.person_id === lead.person_id) : [];
  return { ...lead, person, sources };
}

export async function getAllLeads(coachId?: string): Promise<Lead[]> {
  if (pool && !useInMemory) {
    const query = coachId
      ? `SELECT l.*, p.name as person_name, p.email as person_email, p.city as person_city
         FROM leads l
         LEFT JOIN people p ON l.person_id = p.id
         WHERE l.coach_id = $1 OR l.coach_id IS NULL
         ORDER BY l.updated_at DESC`
      : `SELECT l.*, p.name as person_name, p.email as person_email, p.city as person_city
         FROM leads l
         LEFT JOIN people p ON l.person_id = p.id
         ORDER BY l.updated_at DESC`;
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows.map((l: any) => ({
      ...l,
      display_name: l.display_name || l.person_name,
      person: l.person_id ? { id: l.person_id, phone: l.phone_number, name: l.person_name, email: l.person_email, city: l.person_city } : undefined,
    }));
  }
  return memLeads
    .filter((l) => !coachId || l.coach_id === coachId || !l.coach_id)
    .map((l) => {
      const person = l.person_id ? memPeople.find((p) => p.id === l.person_id) : undefined;
      const sources = l.person_id ? memLeadSources.filter((s) => s.person_id === l.person_id) : [];
      return { ...l, person, sources };
    })
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
}

export async function upsertLead(phone: string, displayName?: string, extra: Partial<Lead> = {}): Promise<Lead> {
  const norm = normalizePhone(phone);
  const now = new Date().toISOString();

  // Ensure person exists
  const person = await upsertPerson({
    phone: norm,
    name: displayName || extra.display_name || 'Wellness Lead',
    gender: extra.gender,
  });

  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO leads (phone_number, person_id, coach_id, display_name, gender, age, height_cm, weight_kg, funnel_state, conversation_step, state_data, membership_type, next_action, next_action_due, interest_topic, lead_score, paused)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (phone_number) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, leads.display_name),
         coach_id = COALESCE(EXCLUDED.coach_id, leads.coach_id),
         person_id = COALESCE(EXCLUDED.person_id, leads.person_id),
         gender = COALESCE(EXCLUDED.gender, leads.gender),
         age = COALESCE(EXCLUDED.age, leads.age),
         height_cm = COALESCE(EXCLUDED.height_cm, leads.height_cm),
         weight_kg = COALESCE(EXCLUDED.weight_kg, leads.weight_kg),
         funnel_state = COALESCE(EXCLUDED.funnel_state, leads.funnel_state),
         conversation_step = COALESCE(EXCLUDED.conversation_step, leads.conversation_step),
         state_data = leads.state_data || EXCLUDED.state_data,
         membership_type = COALESCE(EXCLUDED.membership_type, leads.membership_type),
         next_action = COALESCE(EXCLUDED.next_action, leads.next_action),
         next_action_due = COALESCE(EXCLUDED.next_action_due, leads.next_action_due),
         interest_topic = COALESCE(EXCLUDED.interest_topic, leads.interest_topic),
         lead_score = COALESCE(EXCLUDED.lead_score, leads.lead_score),
         paused = COALESCE(EXCLUDED.paused, leads.paused),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        norm,
        person.id,
        extra.coach_id || 'coach_deepa',
        displayName || extra.display_name || person.name,
        extra.gender,
        extra.age,
        extra.height_cm,
        extra.weight_kg,
        extra.funnel_state || 'NEW',
        extra.conversation_step || 'IDLE',
        JSON.stringify(extra.state_data || {}),
        extra.membership_type,
        extra.next_action,
        extra.next_action_due,
        extra.interest_topic,
        extra.lead_score ?? 50,
        extra.paused ?? false,
      ]
    );
    return rows[0];
  }

  const existing = memLeads.find((l) => normalizePhone(l.phone_number) === norm);
  if (existing) {
    if (displayName) existing.display_name = displayName;
    if (extra.coach_id) existing.coach_id = extra.coach_id;
    if (extra.gender) existing.gender = extra.gender;
    if (extra.age) existing.age = extra.age;
    if (extra.height_cm) existing.height_cm = extra.height_cm;
    if (extra.weight_kg) existing.weight_kg = extra.weight_kg;
    if (extra.funnel_state) existing.funnel_state = extra.funnel_state;
    if (extra.conversation_step) existing.conversation_step = extra.conversation_step;
    if (extra.state_data) existing.state_data = { ...(existing.state_data || {}), ...extra.state_data };
    if (extra.membership_type) existing.membership_type = extra.membership_type;
    if (extra.next_action !== undefined) existing.next_action = extra.next_action;
    if (extra.next_action_due !== undefined) existing.next_action_due = extra.next_action_due;
    if (extra.interest_topic) existing.interest_topic = extra.interest_topic;
    if (extra.lead_score !== undefined) existing.lead_score = extra.lead_score;
    if (extra.paused !== undefined) existing.paused = extra.paused;
    existing.updated_at = now;
    return existing;
  }

  const created: Lead = {
    phone_number: norm,
    person_id: person.id,
    coach_id: extra.coach_id || 'coach_deepa',
    display_name: displayName || extra.display_name || person.name,
    gender: extra.gender,
    age: extra.age,
    height_cm: extra.height_cm,
    weight_kg: extra.weight_kg,
    funnel_state: extra.funnel_state || 'NEW',
    conversation_step: extra.conversation_step || 'IDLE',
    state_data: extra.state_data || {},
    membership_type: extra.membership_type,
    next_action: extra.next_action || 'Send Welcome Message & Book Consultation',
    next_action_due: extra.next_action_due || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    interest_topic: extra.interest_topic || 'Weight Loss & Fitness',
    lead_score: extra.lead_score ?? 50,
    paused: extra.paused ?? false,
    created_at: now,
    updated_at: now,
  };
  memLeads.push(created);
  return created;
}

export async function setLeadState(phone: string, funnelState: string, conversationStep: string, stateData: Record<string, any> = {}) {
  const norm = normalizePhone(phone);
  const lead = await getLead(norm);
  const fromStage = lead?.funnel_state || 'NEW';

  if (pool && !useInMemory) {
    await pool.query(
      `UPDATE leads SET
         funnel_state = $1,
         conversation_step = $2,
         state_data = state_data || $3::jsonb,
         updated_at = CURRENT_TIMESTAMP
       WHERE phone_number = $4`,
      [funnelState, conversationStep, JSON.stringify(stateData), norm]
    );
  } else {
    const mem = memLeads.find((l) => normalizePhone(l.phone_number) === norm);
    if (mem) {
      mem.funnel_state = funnelState;
      mem.conversation_step = conversationStep;
      mem.state_data = { ...(mem.state_data || {}), ...stateData };
      mem.updated_at = new Date().toISOString();
    }
  }

  // Record Stage History if stage changed
  if (fromStage !== funnelState) {
    await recordStageHistory({
      lead_phone: norm,
      from_stage: fromStage,
      to_stage: funnelState,
      metadata: stateData,
    });
  }
}

export async function updateLeadStage(phone: string, toStage: string, reason?: string, metadata: Record<string, any> = {}, coachId = 'coach_deepa'): Promise<Lead> {
  const norm = normalizePhone(phone);
  const lead = await getLead(norm);
  if (!lead) throw new Error('Lead not found');

  const fromStage = lead.funnel_state;
  const now = new Date().toISOString();

  if (pool && !useInMemory) {
    await pool.query(
      `UPDATE leads SET funnel_state = $1, updated_at = CURRENT_TIMESTAMP WHERE phone_number = $2`,
      [toStage, norm]
    );
  } else {
    const mem = memLeads.find((l) => normalizePhone(l.phone_number) === norm);
    if (mem) {
      mem.funnel_state = toStage;
      mem.updated_at = now;
    }
  }

  await recordStageHistory({
    lead_phone: norm,
    from_stage: fromStage,
    to_stage: toStage,
    reason,
    metadata,
    created_by: coachId,
  });

  await logActivity({
    coach_id: coachId,
    phone_number: norm,
    type: 'SYSTEM',
    summary: `Stage changed from ${fromStage} to ${toStage}`,
    details: reason ? `Reason: ${reason}` : undefined,
  });

  return lead;
}

export async function recordStageHistory(entry: { lead_phone: string; from_stage?: string; to_stage: string; reason?: string; metadata?: Record<string, any>; created_by?: string }): Promise<StageHistory> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO stage_history (lead_phone, from_stage, to_stage, reason, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [entry.lead_phone, entry.from_stage, entry.to_stage, entry.reason, JSON.stringify(entry.metadata || {}), entry.created_by]
    );
    return rows[0];
  }
  const history: StageHistory = {
    id: memStageHistory.length + 1,
    lead_phone: entry.lead_phone,
    from_stage: entry.from_stage,
    to_stage: entry.to_stage,
    reason: entry.reason,
    metadata: entry.metadata,
    created_by: entry.created_by,
    created_at: now,
  };
  memStageHistory.push(history);
  return history;
}

export async function getStageHistory(phone: string): Promise<StageHistory[]> {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM stage_history WHERE lead_phone = $1 ORDER BY created_at DESC', [norm]);
    return rows;
  }
  return memStageHistory.filter((h) => normalizePhone(h.lead_phone) === norm).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Activities, Tasks, Appointments
export async function logActivity(activity: Partial<Activity>): Promise<Activity> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO activities (coach_id, phone_number, customer_id, type, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [activity.coach_id || 'coach_deepa', activity.phone_number, activity.customer_id, activity.type || 'NOTE', activity.summary || 'Activity', activity.details]
    );
    return rows[0];
  }
  const created: Activity = {
    id: memActivities.length + 1,
    coach_id: activity.coach_id || 'coach_deepa',
    phone_number: activity.phone_number,
    customer_id: activity.customer_id,
    type: activity.type || 'NOTE',
    summary: activity.summary || 'Activity',
    details: activity.details,
    created_at: now,
  };
  memActivities.push(created);
  return created;
}

export async function getActivities(phone?: string, customerId?: string, coachId?: string): Promise<Activity[]> {
  const norm = phone ? normalizePhone(phone) : undefined;
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM activities WHERE 1=1';
    const params: any[] = [];
    if (norm) {
      params.push(norm);
      query += ` AND phone_number = $${params.length}`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memActivities
    .filter((a) => {
      if (norm && a.phone_number && normalizePhone(a.phone_number) !== norm) return false;
      if (customerId && a.customer_id !== customerId) return false;
      if (coachId && a.coach_id && a.coach_id !== coachId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const now = new Date().toISOString();
  const due = task.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (coach_id, phone_number, customer_id, title, due_date, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [task.coach_id || 'coach_deepa', task.phone_number, task.customer_id, task.title || 'Follow-up Task', due, task.priority || 'MEDIUM', task.status || 'PENDING']
    );
    return rows[0];
  }
  const created: Task = {
    id: memTasks.length + 1,
    coach_id: task.coach_id || 'coach_deepa',
    phone_number: task.phone_number,
    customer_id: task.customer_id,
    title: task.title || 'Follow-up Task',
    due_date: due,
    priority: task.priority || 'MEDIUM',
    status: task.status || 'PENDING',
    created_at: now,
  };
  memTasks.push(created);
  return created;
}

export async function getTasks(coachId?: string, status?: string): Promise<Task[]> {
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY due_date ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memTasks
    .filter((t) => {
      if (coachId && t.coach_id && t.coach_id !== coachId) return false;
      if (status && t.status !== status) return false;
      return true;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
}

export async function updateTaskStatus(id: number, status: 'PENDING' | 'COMPLETED' | 'CANCELLED'): Promise<Task | null> {
  const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `UPDATE tasks SET status = $1, completed_at = $2 WHERE id = $3 RETURNING *`,
      [status, completedAt, id]
    );
    return rows[0] || null;
  }
  const task = memTasks.find((t) => t.id === id);
  if (!task) return null;
  task.status = status;
  task.completed_at = completedAt || undefined;
  return task;
}

export async function createAppointment(app: Partial<Appointment>): Promise<Appointment> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO appointments (coach_id, phone_number, customer_id, title, scheduled_at, duration_mins, status, zoom_link, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [app.coach_id || 'coach_deepa', app.phone_number, app.customer_id, app.title || 'Wellness Consultation', app.scheduled_at || now, app.duration_mins || 45, app.status || 'SCHEDULED', app.zoom_link || 'https://zoom.us/j/community', app.notes]
    );
    return rows[0];
  }
  const created: Appointment = {
    id: memAppointments.length + 1,
    coach_id: app.coach_id || 'coach_deepa',
    phone_number: app.phone_number,
    customer_id: app.customer_id,
    title: app.title || 'Wellness Consultation',
    scheduled_at: app.scheduled_at || now,
    duration_mins: app.duration_mins || 45,
    status: app.status || 'SCHEDULED',
    zoom_link: app.zoom_link || 'https://zoom.us/j/community',
    notes: app.notes,
    created_at: now,
  };
  memAppointments.push(created);
  return created;
}

export async function getAppointments(coachId?: string, status?: string): Promise<Appointment[]> {
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params: any[] = [];
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY scheduled_at ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memAppointments
    .filter((a) => {
      if (coachId && a.coach_id && a.coach_id !== coachId) return false;
      if (status && a.status !== status) return false;
      return true;
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
}

export async function updateAppointmentStatus(id: number, status: Appointment['status']): Promise<Appointment | null> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return rows[0] || null;
  }
  const app = memAppointments.find((a) => a.id === id);
  if (!app) return null;
  app.status = status;
  return app;
}

// Customers & Customer Journey
export async function getCustomer(id: string): Promise<Customer | null> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return memCustomers.find((c) => c.id === id) || null;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM customers WHERE phone_number = $1', [norm]);
    return rows[0] || null;
  }
  return memCustomers.find((c) => normalizePhone(c.phone_number) === norm) || null;
}

export async function getAllCustomers(coachId?: string, status?: string): Promise<Customer[]> {
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memCustomers
    .filter((c) => {
      if (coachId && c.coach_id && c.coach_id !== coachId) return false;
      if (status && c.status !== status) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export interface ConvertLeadParams {
  leadPhone: string;
  coachId?: string;
  planCode: 'Basic' | 'Elite';
  startDate?: string;
  goals?: string;
  initialWeightKg?: number;
  f1Flavors?: string[];
  afreshFlavors?: string[];
  deliveryAddress?: string;
}

export async function convertLeadToCustomerTransaction(params: ConvertLeadParams) {
  const norm = normalizePhone(params.leadPhone);
  const coachId = params.coachId || 'coach_deepa';
  const lead = await getLead(norm);
  if (!lead) throw new Error('Lead not found');

  const customerId = 'cust_' + norm;
  const startDate = params.startDate || new Date().toISOString().split('T')[0];
  const renewalDateObj = new Date(startDate);
  renewalDateObj.setDate(renewalDateObj.getDate() + 30);
  const renewalDate = renewalDateObj.toISOString().split('T')[0];

  const planCode = params.planCode || 'Basic';
  const pricing = PRICING_CONFIG[planCode] || PRICING_CONFIG.Basic;
  const now = new Date().toISOString();

  // 1. Update Lead to WON
  await updateLeadStage(norm, 'WON', 'Converted to Paying Customer', { plan: planCode, converted_at: now }, coachId);

  // 2. Create Customer
  const customer: Customer = {
    id: customerId,
    person_id: lead.person_id,
    phone_number: norm,
    coach_id: coachId,
    lead_phone: norm,
    name: lead.display_name || 'Wellness Member',
    status: 'ACTIVE',
    start_date: startDate,
    renewal_date: renewalDate,
    current_plan: planCode,
    goals: params.goals || 'Weight loss and healthy lifestyle energy',
    notes: 'Converted from lead pipeline',
    created_at: now,
    updated_at: now,
  };

  if (pool && !useInMemory) {
    await pool.query(
      `INSERT INTO customers (id, person_id, phone_number, coach_id, lead_phone, name, status, start_date, renewal_date, current_plan, goals, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         status = 'ACTIVE',
         start_date = EXCLUDED.start_date,
         renewal_date = EXCLUDED.renewal_date,
         current_plan = EXCLUDED.current_plan,
         updated_at = CURRENT_TIMESTAMP`,
      [customerId, lead.person_id, norm, coachId, norm, customer.name, 'ACTIVE', startDate, renewalDate, planCode, customer.goals, customer.notes]
    );
  } else {
    const idx = memCustomers.findIndex((c) => c.id === customerId);
    if (idx >= 0) memCustomers[idx] = customer;
    else memCustomers.push(customer);
  }

  // 3. Create Enrollment
  const enrollment: Enrollment = {
    id: memEnrollments.length + 1,
    customer_id: customerId,
    plan_code: planCode,
    start_date: startDate,
    end_date: renewalDate,
    status: 'ACTIVE',
    created_at: now,
  };
  if (pool && !useInMemory) {
    await pool.query(
      `INSERT INTO enrollments (customer_id, plan_code, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5)`,
      [customerId, planCode, startDate, renewalDate, 'ACTIVE']
    );
  } else {
    memEnrollments.push(enrollment);
  }

  // 4. Create Standard 10-Point Onboarding Checklist
  const onboardingTitles = [
    'Welcome Call & Routine Confirmation',
    'Share 18 Golden Rules and Instructions PDF',
    'Schedule Day 1 First Home Visit Session',
    'Confirm F1 Shake & Afresh Flavors Selection',
    'Deliver Wellness Kit & Shake Shaker Cup',
    'Explain 6:00 AM Wakeup & Hydration Routine',
    'Orientation for Live 7:30 AM Morning Zoom Club',
    'Schedule Day 5 Progress Video Call',
    'Schedule Day 15 Mid-Month Body Review Call',
    'Schedule Day 25 Renewal & Goal Setting Meeting',
  ];

  for (let i = 0; i < onboardingTitles.length; i++) {
    const item: OnboardingItem = {
      id: memOnboardingItems.length + 1,
      customer_id: customerId,
      title: onboardingTitles[i],
      order_index: i + 1,
      is_completed: false,
      created_at: now,
    };
    if (pool && !useInMemory) {
      await pool.query(
        `INSERT INTO onboarding_items (customer_id, title, order_index, is_completed) VALUES ($1, $2, $3, $4)`,
        [customerId, onboardingTitles[i], i + 1, false]
      );
    } else {
      memOnboardingItems.push(item);
    }
  }

  // 5. Initial Progress Baseline
  if (params.initialWeightKg || lead.weight_kg) {
    const checkin: ProgressCheckin = {
      id: memProgressCheckins.length + 1,
      customer_id: customerId,
      checkin_date: startDate,
      weight_kg: params.initialWeightKg || lead.weight_kg,
      water_liters: 2.5,
      meals_compliant: true,
      exercise_mins: 30,
      energy_level: 4,
      sleep_hours: 7,
      notes: 'Initial Onboarding Baseline Check-in',
      coach_feedback: 'Welcome to the club! Focus on first 5 days strict discipline.',
      reviewed_by_coach: true,
      created_at: now,
    };
    if (pool && !useInMemory) {
      await pool.query(
        `INSERT INTO progress_checkins (customer_id, checkin_date, weight_kg, water_liters, meals_compliant, exercise_mins, energy_level, sleep_hours, notes, coach_feedback, reviewed_by_coach)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [customerId, startDate, checkin.weight_kg, checkin.water_liters, true, 30, 4, 7, checkin.notes, checkin.coach_feedback, true]
      );
    } else {
      memProgressCheckins.push(checkin);
    }
  }

  // 6. Initial Order
  const f1 = params.f1Flavors || ['Kulfi', 'Rose Kheer'];
  const afresh = params.afreshFlavors || ['Lemon'];
  const orderNumber = 'ORD-' + Date.now().toString().slice(-6);

  const initialOrder: Order = {
    id: memOrders.length + 1,
    coach_id: coachId,
    phone_number: norm,
    customer_id: customerId,
    order_number: orderNumber,
    membership_type: planCode,
    transaction_type: 'New',
    f1_flavors: f1,
    afresh_flavors: afresh,
    amount_received: pricing.amountReceived,
    coach_amount: pricing.coachAmount,
    cost_of_kit: pricing.costOfKitNew,
    cash_profit: pricing.coachAmount - pricing.costOfKitNew,
    total_cost: pricing.costOfKitNew,
    order_status: 'PLACED',
    delivery_address: params.deliveryAddress || 'Home Address',
    notes: 'Initial Kit Order upon Won Conversion',
    created_at: now,
  };

  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO orders (coach_id, phone_number, customer_id, order_number, membership_type, transaction_type, f1_flavors, afresh_flavors, amount_received, coach_amount, cost_of_kit, cash_profit, total_cost, order_status, delivery_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        coachId,
        norm,
        customerId,
        orderNumber,
        planCode,
        'New',
        JSON.stringify(f1),
        JSON.stringify(afresh),
        pricing.amountReceived,
        pricing.coachAmount,
        pricing.costOfKitNew,
        pricing.coachAmount - pricing.costOfKitNew,
        pricing.costOfKitNew,
        'PLACED',
        params.deliveryAddress || 'Home Address',
        'Initial Kit Order upon Won Conversion',
      ]
    );
    initialOrder.id = rows[0].id;
  } else {
    memOrders.push(initialOrder);
  }

  // 7. Schedule Initial Follow-up Tasks
  await createTask({
    coach_id: coachId,
    phone_number: norm,
    customer_id: customerId,
    title: `Day 1 First Home Visit for ${customer.name}`,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
  });

  await createTask({
    coach_id: coachId,
    phone_number: norm,
    customer_id: customerId,
    title: `Day 5 Progress Review Call with ${customer.name}`,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
  });

  // 8. Log Audit Event
  await logAuditEvent({
    coach_id: coachId,
    event_type: 'CUSTOMER_CONVERTED',
    entity_type: 'CUSTOMER',
    entity_id: customerId,
    payload: { plan: planCode, amount: pricing.amountReceived },
  });

  return { customer, initialOrder, enrollment };
}

// Onboarding Items
export async function getOnboardingItems(customerId: string): Promise<OnboardingItem[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM onboarding_items WHERE customer_id = $1 ORDER BY order_index ASC', [customerId]);
    return rows;
  }
  return memOnboardingItems.filter((item) => item.customer_id === customerId).sort((a, b) => a.order_index - b.order_index);
}

export async function toggleOnboardingItem(id: number, isCompleted: boolean): Promise<OnboardingItem | null> {
  const completedAt = isCompleted ? new Date().toISOString() : null;
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `UPDATE onboarding_items SET is_completed = $1, completed_at = $2 WHERE id = $3 RETURNING *`,
      [isCompleted, completedAt, id]
    );
    return rows[0] || null;
  }
  const item = memOnboardingItems.find((i) => i.id === id);
  if (!item) return null;
  item.is_completed = isCompleted;
  item.completed_at = completedAt || undefined;
  return item;
}

// Progress Check-ins & Body Analysis
export async function createProgressCheckin(checkin: Partial<ProgressCheckin>): Promise<ProgressCheckin> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO progress_checkins (customer_id, checkin_date, weight_kg, water_liters, meals_compliant, exercise_mins, energy_level, sleep_hours, notes, coach_feedback, reviewed_by_coach)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        checkin.customer_id,
        checkin.checkin_date || now.split('T')[0],
        checkin.weight_kg,
        checkin.water_liters || 2.0,
        checkin.meals_compliant ?? true,
        checkin.exercise_mins || 0,
        checkin.energy_level || 4,
        checkin.sleep_hours || 7,
        checkin.notes,
        checkin.coach_feedback,
        checkin.reviewed_by_coach ?? false,
      ]
    );
    return rows[0];
  }
  const created: ProgressCheckin = {
    id: memProgressCheckins.length + 1,
    customer_id: checkin.customer_id!,
    checkin_date: checkin.checkin_date || now.split('T')[0],
    weight_kg: checkin.weight_kg,
    water_liters: checkin.water_liters || 2.0,
    meals_compliant: checkin.meals_compliant ?? true,
    exercise_mins: checkin.exercise_mins || 0,
    energy_level: checkin.energy_level || 4,
    sleep_hours: checkin.sleep_hours || 7,
    notes: checkin.notes,
    coach_feedback: checkin.coach_feedback,
    reviewed_by_coach: checkin.reviewed_by_coach ?? false,
    created_at: now,
  };
  memProgressCheckins.push(created);
  return created;
}

export async function getProgressCheckins(customerId: string): Promise<ProgressCheckin[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM progress_checkins WHERE customer_id = $1 ORDER BY checkin_date ASC', [customerId]);
    return rows;
  }
  return memProgressCheckins.filter((c) => c.customer_id === customerId).sort((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime());
}

export async function createMeasurement(m: Partial<Measurement>): Promise<Measurement> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO measurements (customer_id, recorded_date, chest_cm, waist_cm, hips_cm, thighs_cm, arms_cm, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [m.customer_id, m.recorded_date || now.split('T')[0], m.chest_cm, m.waist_cm, m.hips_cm, m.thighs_cm, m.arms_cm, m.notes]
    );
    return rows[0];
  }
  const created: Measurement = {
    id: memMeasurements.length + 1,
    customer_id: m.customer_id!,
    recorded_date: m.recorded_date || now.split('T')[0],
    chest_cm: m.chest_cm,
    waist_cm: m.waist_cm,
    hips_cm: m.hips_cm,
    thighs_cm: m.thighs_cm,
    arms_cm: m.arms_cm,
    notes: m.notes,
    created_at: now,
  };
  memMeasurements.push(created);
  return created;
}

export async function getMeasurements(customerId: string): Promise<Measurement[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM measurements WHERE customer_id = $1 ORDER BY recorded_date ASC', [customerId]);
    return rows;
  }
  return memMeasurements.filter((m) => m.customer_id === customerId).sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());
}

export async function createProgressPhoto(p: Partial<ProgressPhoto>): Promise<ProgressPhoto> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO progress_photos (customer_id, photo_url, photo_type, caption, recorded_date, is_private)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [p.customer_id, p.photo_url || '/placeholder_photo.jpg', p.photo_type || 'FRONT', p.caption, p.recorded_date || now.split('T')[0], p.is_private ?? true]
    );
    return rows[0];
  }
  const created: ProgressPhoto = {
    id: memProgressPhotos.length + 1,
    customer_id: p.customer_id!,
    photo_url: p.photo_url || '/placeholder_photo.jpg',
    photo_type: p.photo_type || 'FRONT',
    caption: p.caption,
    recorded_date: p.recorded_date || now.split('T')[0],
    is_private: p.is_private ?? true,
    created_at: now,
  };
  memProgressPhotos.push(created);
  return created;
}

export async function getProgressPhotos(customerId: string): Promise<ProgressPhoto[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM progress_photos WHERE customer_id = $1 ORDER BY recorded_date DESC', [customerId]);
    return rows;
  }
  return memProgressPhotos.filter((p) => p.customer_id === customerId).sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime());
}

export async function createMilestone(m: Partial<Milestone>): Promise<Milestone> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO milestones (customer_id, title, achieved_date, metric_name, initial_val, achieved_val, celebrated_on_whatsapp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [m.customer_id, m.title || 'Milestone', m.achieved_date || now.split('T')[0], m.metric_name, m.initial_val, m.achieved_val, m.celebrated_on_whatsapp ?? false]
    );
    return rows[0];
  }
  const created: Milestone = {
    id: memMilestones.length + 1,
    customer_id: m.customer_id!,
    title: m.title || 'Milestone',
    achieved_date: m.achieved_date || now.split('T')[0],
    metric_name: m.metric_name,
    initial_val: m.initial_val,
    achieved_val: m.achieved_val,
    celebrated_on_whatsapp: m.celebrated_on_whatsapp ?? false,
    created_at: now,
  };
  memMilestones.push(created);
  return created;
}

export async function getMilestones(customerId: string): Promise<Milestone[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM milestones WHERE customer_id = $1 ORDER BY achieved_date DESC', [customerId]);
    return rows;
  }
  return memMilestones.filter((m) => m.customer_id === customerId).sort((a, b) => new Date(b.achieved_date).getTime() - new Date(a.achieved_date).getTime());
}

// Body Analyses (Form 2 with all compulsory fields)
export async function createBodyAnalysis(data: any) {
  const phone = data.mobile || data.phone_number;
  const norm = normalizePhone(phone);
  const now = new Date().toISOString();
  const dateVal = data.date || now.split('T')[0];

  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO body_analyses (
        coach_id, phone_number, name, age, gender, height_cm, weight_kg, bmi,
        sub_fat_pct, visceral_fat, skeletal_muscle_pct, body_fat_pct, body_age, bmr,
        ideal_weight_kg, hindi_report, pdf_filename, serial_no, address, wellness_consultant, date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        data.coach_id || 'coach_deepa',
        norm,
        data.name,
        data.age,
        data.gender,
        data.height_cm,
        data.weight_kg,
        data.bmi,
        data.sub_fat_pct,
        data.visceral_fat,
        data.skeletal_muscle_pct,
        data.body_fat_pct,
        data.body_age,
        data.bmr,
        data.ideal_weight_kg,
        data.hindi_report,
        data.pdf_filename,
        data.serial_no || '',
        data.address || '',
        data.wellness_consultant || '',
        dateVal,
      ]
    );
    return rows[0];
  }
  const created: BodyAnalysisRecord = {
    id: memBodyAnalyses.length + 1,
    ...data,
    phone_number: norm,
    date: dateVal,
    serial_no: data.serial_no || '',
    address: data.address || '',
    wellness_consultant: data.wellness_consultant || '',
    created_at: now,
  };
  memBodyAnalyses.push(created);
  return created;
}

export async function getBodyAnalyses(phone: string): Promise<BodyAnalysisRecord[]> {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM body_analyses WHERE phone_number = $1 ORDER BY created_at DESC', [norm]);
    return rows;
  }
  return memBodyAnalyses.filter((b) => normalizePhone(b.phone_number) === norm);
}

export async function getAllBodyAnalyses(coachId?: string): Promise<BodyAnalysisRecord[]> {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT * FROM body_analyses WHERE coach_id = $1 OR coach_id IS NULL ORDER BY created_at DESC'
      : 'SELECT * FROM body_analyses ORDER BY created_at DESC';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memBodyAnalyses.filter((b) => !coachId || b.coach_id === coachId || !b.coach_id);
}

// Form 1: Consumer Data [First Homevisit] (All 24 fields compulsory)
export async function saveConsumerHomevisitForm(data: ConsumerDataHomevisit): Promise<ConsumerDataHomevisit> {
  const norm = normalizePhone(data.phone_number);
  const now = new Date().toISOString();
  const dateVal = data.date || now.split('T')[0];

  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO consumer_homevisit_forms (
        customer_id, phone_number, coach_id, date, name, age, height, weight, ideal_weight,
        health_challenges, purpose_of_joining, energy, digestion, sleep, sleeping_time,
        wake_up_time, breakfast_time, mid_meal_1, lunch, mid_meal_2, dinner, exercise,
        water_intake, family_members, fruit_salad, tea, non_veg
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *`,
      [
        data.customer_id || null,
        norm,
        data.coach_id || 'coach_deepa',
        dateVal,
        data.name,
        data.age,
        data.height,
        data.weight,
        data.ideal_weight,
        data.health_challenges,
        data.purpose_of_joining,
        data.energy,
        data.digestion,
        data.sleep,
        data.sleeping_time,
        data.wake_up_time,
        data.breakfast_time,
        data.mid_meal_1,
        data.lunch,
        data.mid_meal_2,
        data.dinner,
        data.exercise,
        data.water_intake,
        data.family_members,
        data.fruit_salad,
        data.tea,
        data.non_veg,
      ]
    );
    return rows[0];
  }

  const created: ConsumerDataHomevisit = {
    id: memConsumerHomevisitForms.length + 1,
    ...data,
    phone_number: norm,
    date: dateVal,
    created_at: now,
  };
  memConsumerHomevisitForms.push(created);
  return created;
}

export async function getConsumerHomevisitForms(phone?: string, customerId?: string): Promise<ConsumerDataHomevisit[]> {
  const norm = phone ? normalizePhone(phone) : undefined;
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM consumer_homevisit_forms WHERE 1=1';
    const params: any[] = [];
    if (norm) {
      params.push(norm);
      query += ` AND phone_number = $${params.length}`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  return memConsumerHomevisitForms.filter((f) => {
    if (norm && normalizePhone(f.phone_number) !== norm) return false;
    if (customerId && f.customer_id !== customerId) return false;
    return true;
  });
}

// Legacy Home Visits
export async function createHomeVisit(data: any) {
  const norm = normalizePhone(data.phone_number);
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO home_visits (coach_id, phone_number, visit_number, visit_date, ideal_weight_kg, health_challenges, purpose_of_joining, energy_rating, digestion, wake_up_time, sleeping_time, water_intake, routine_type, member_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.coach_id || 'coach_deepa',
        norm,
        data.visit_number || 1,
        data.visit_date || new Date(),
        data.ideal_weight_kg,
        data.health_challenges,
        data.purpose_of_joining,
        data.energy_rating,
        data.digestion,
        data.wake_up_time,
        data.sleeping_time,
        data.water_intake,
        data.routine_type || 'Basic',
        data.member_name,
      ]
    );
    return rows[0];
  }
  const created = { id: memHomeVisits.length + 1, ...data, phone_number: norm, created_at: now };
  memHomeVisits.push(created);
  return created;
}

export async function getHomeVisits(phone: string) {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM home_visits WHERE phone_number = $1 ORDER BY created_at DESC', [norm]);
    return rows;
  }
  return memHomeVisits.filter((v) => normalizePhone(v.phone_number) === norm);
}

export async function getAllHomeVisits(coachId?: string) {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT * FROM home_visits WHERE coach_id = $1 OR coach_id IS NULL ORDER BY created_at DESC'
      : 'SELECT * FROM home_visits ORDER BY created_at DESC';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memHomeVisits.filter((v) => !coachId || v.coach_id === coachId || !v.coach_id);
}

// Commerce: Products, Plans, Orders, Payments, Refunds, Expenses
export async function getPlans(): Promise<Plan[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM plans WHERE active = true');
    return rows;
  }
  return memPlans.filter((p) => p.active);
}

export async function getProducts(): Promise<Product[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM products WHERE active = true ORDER BY name');
    return rows;
  }
  return memProducts.filter((p) => p.active);
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  const norm = data.phone_number ? normalizePhone(data.phone_number) : undefined;
  const now = new Date().toISOString();
  const orderNumber = data.order_number || 'ORD-' + Date.now().toString().slice(-6);

  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO orders (coach_id, phone_number, customer_id, order_number, membership_type, transaction_type, f1_flavors, afresh_flavors, amount_received, coach_amount, cost_of_kit, cash_profit, total_cost, order_status, delivery_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        data.coach_id || 'coach_deepa',
        norm,
        data.customer_id,
        orderNumber,
        data.membership_type || 'Basic',
        data.transaction_type || 'New',
        JSON.stringify(data.f1_flavors || []),
        JSON.stringify(data.afresh_flavors || []),
        data.amount_received || 0,
        data.coach_amount || 0,
        data.cost_of_kit || 0,
        data.cash_profit || 0,
        data.total_cost || data.cost_of_kit || 0,
        data.order_status || 'PLACED',
        data.delivery_address,
        data.notes,
      ]
    );
    const order = rows[0];

    // Insert order items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await pool.query(
          `INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price_snapshot, unit_cost_snapshot, quantity, subtotal_price, subtotal_cost)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [order.id, item.product_id, item.product_name_snapshot, item.unit_price_snapshot, item.unit_cost_snapshot, item.quantity, item.subtotal_price, item.subtotal_cost]
        );
      }
    }

    return order;
  }

  const created: Order = {
    id: memOrders.length + 1,
    coach_id: data.coach_id || 'coach_deepa',
    phone_number: norm,
    customer_id: data.customer_id,
    order_number: orderNumber,
    membership_type: data.membership_type || 'Basic',
    transaction_type: data.transaction_type || 'New',
    f1_flavors: data.f1_flavors || [],
    afresh_flavors: data.afresh_flavors || [],
    amount_received: data.amount_received || 0,
    coach_amount: data.coach_amount || 0,
    cost_of_kit: data.cost_of_kit || 0,
    cash_profit: data.cash_profit || 0,
    total_cost: data.total_cost || data.cost_of_kit || 0,
    order_status: data.order_status || 'PLACED',
    delivery_address: data.delivery_address,
    notes: data.notes,
    items: data.items || [],
    created_at: now,
  };
  memOrders.push(created);
  return created;
}

export async function getOrders(phone?: string, customerId?: string, coachId?: string): Promise<Order[]> {
  const norm = phone ? normalizePhone(phone) : undefined;
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];
    if (norm) {
      params.push(norm);
      query += ` AND phone_number = $${params.length}`;
    }
    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memOrders
    .filter((o) => {
      if (norm && o.phone_number && normalizePhone(o.phone_number) !== norm) return false;
      if (customerId && o.customer_id !== customerId) return false;
      if (coachId && o.coach_id && o.coach_id !== coachId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateOrderStatus(id: number, status: Order['order_status']): Promise<Order | null> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return rows[0] || null;
  }
  const order = memOrders.find((o) => o.id === id);
  if (!order) return null;
  order.order_status = status;
  return order;
}

// Payments & Refunds
export async function createPayment(p: Partial<Payment>): Promise<Payment> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO payments (coach_id, customer_id, order_id, amount, payment_date, payment_method, reference_no, notes, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [p.coach_id || 'coach_deepa', p.customer_id, p.order_id, p.amount, p.payment_date || now.split('T')[0], p.payment_method || 'UPI', p.reference_no, p.notes, p.author_id]
    );
    const payment = rows[0];
    await logAuditEvent({
      coach_id: p.coach_id || 'coach_deepa',
      event_type: 'PAYMENT_RECORDED',
      entity_type: 'PAYMENT',
      entity_id: String(payment.id),
      payload: { amount: p.amount, customer_id: p.customer_id, method: p.payment_method },
    });
    return payment;
  }
  const created: Payment = {
    id: memPayments.length + 1,
    coach_id: p.coach_id || 'coach_deepa',
    customer_id: p.customer_id!,
    order_id: p.order_id,
    amount: Number(p.amount || 0),
    payment_date: p.payment_date || now.split('T')[0],
    payment_method: p.payment_method || 'UPI',
    reference_no: p.reference_no,
    notes: p.notes,
    author_id: p.author_id,
    created_at: now,
  };
  memPayments.push(created);
  await logAuditEvent({
    coach_id: p.coach_id || 'coach_deepa',
    event_type: 'PAYMENT_RECORDED',
    entity_type: 'PAYMENT',
    entity_id: String(created.id),
    payload: { amount: p.amount, customer_id: p.customer_id, method: p.payment_method },
  });
  return created;
}

export async function getPayments(customerId?: string, coachId?: string): Promise<Payment[]> {
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params: any[] = [];
    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    query += ' ORDER BY payment_date DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memPayments
    .filter((p) => {
      if (customerId && p.customer_id !== customerId) return false;
      if (coachId && p.coach_id && p.coach_id !== coachId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
}

export async function createRefund(r: Partial<Refund>): Promise<Refund> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO refunds (coach_id, customer_id, order_id, amount, refund_date, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [r.coach_id || 'coach_deepa', r.customer_id, r.order_id, r.amount, r.refund_date || now.split('T')[0], r.reason]
    );
    const refund = rows[0];
    await logAuditEvent({
      coach_id: r.coach_id || 'coach_deepa',
      event_type: 'REFUND_ISSUED',
      entity_type: 'REFUND',
      entity_id: String(refund.id),
      payload: { amount: r.amount, customer_id: r.customer_id, reason: r.reason },
    });
    return refund;
  }
  const created: Refund = {
    id: memRefunds.length + 1,
    coach_id: r.coach_id || 'coach_deepa',
    customer_id: r.customer_id,
    order_id: r.order_id,
    amount: Number(r.amount || 0),
    refund_date: r.refund_date || now.split('T')[0],
    reason: r.reason || '',
    created_at: now,
  };
  memRefunds.push(created);
  await logAuditEvent({
    coach_id: r.coach_id || 'coach_deepa',
    event_type: 'REFUND_ISSUED',
    entity_type: 'REFUND',
    entity_id: String(created.id),
    payload: { amount: r.amount, customer_id: r.customer_id, reason: r.reason },
  });
  return created;
}

export async function getRefunds(customerId?: string, coachId?: string): Promise<Refund[]> {
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM refunds WHERE 1=1';
    const params: any[] = [];
    if (customerId) {
      params.push(customerId);
      query += ` AND customer_id = $${params.length}`;
    }
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    query += ' ORDER BY refund_date DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memRefunds
    .filter((r) => {
      if (customerId && r.customer_id !== customerId) return false;
      if (coachId && r.coach_id && r.coach_id !== coachId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.refund_date || 0).getTime() - new Date(a.refund_date || 0).getTime());
}

// Expenses
export async function createExpense(exp: Partial<Expense>): Promise<Expense> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO expenses (coach_id, title, category, amount, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [exp.coach_id || 'coach_deepa', exp.title, exp.category || 'MARKETING', exp.amount, exp.expense_date || now.split('T')[0], exp.notes]
    );
    return rows[0];
  }
  const created: Expense = {
    id: memExpenses.length + 1,
    coach_id: exp.coach_id || 'coach_deepa',
    title: exp.title || 'Expense',
    category: exp.category || 'MARKETING',
    amount: Number(exp.amount || 0),
    expense_date: exp.expense_date || now.split('T')[0],
    notes: exp.notes,
    created_at: now,
  };
  memExpenses.push(created);
  return created;
}

export async function getExpenses(coachId?: string): Promise<Expense[]> {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT * FROM expenses WHERE coach_id = $1 OR coach_id IS NULL ORDER BY expense_date DESC'
      : 'SELECT * FROM expenses ORDER BY expense_date DESC';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memExpenses.filter((e) => !coachId || e.coach_id === coachId || !e.coach_id).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
}

// Financial Derivations: Customer Balance & Profit
export async function getCustomerBalances(coachId?: string) {
  const customers = await getAllCustomers(coachId);
  const orders = await getOrders(undefined, undefined, coachId);
  const payments = await getPayments(undefined, coachId);
  const refunds = await getRefunds(undefined, coachId);
  const expenses = await getExpenses(coachId);

  return customers.map((c) => {
    const custOrders = orders.filter((o) => o.customer_id === c.id || (o.phone_number && normalizePhone(o.phone_number) === normalizePhone(c.phone_number)));
    const custPayments = payments.filter((p) => p.customer_id === c.id);
    const custRefunds = refunds.filter((r) => r.customer_id === c.id);

    const totalOrdersAmount = custOrders.reduce((sum, o) => sum + Number(o.amount_received || 0), 0);
    const totalCostOfKit = custOrders.reduce((sum, o) => sum + Number(o.cost_of_kit || o.total_cost || 0), 0);
    const totalPaymentsReceived = custPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalRefundsIssued = custRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const outstandingBalance = Math.max(0, totalOrdersAmount - totalPaymentsReceived + totalRefundsIssued);
    const cashProfit = totalPaymentsReceived - totalCostOfKit - totalRefundsIssued;

    return {
      customerId: c.id,
      customerName: c.name,
      phone: c.phone_number,
      plan: c.current_plan,
      totalOrdersAmount,
      totalPaymentsReceived,
      totalRefundsIssued,
      outstandingBalance,
      totalCostOfKit,
      cashProfit,
    };
  });
}

// Profit Sheets & Entries (Legacy & Enhanced)
export async function ensureProfitSheet(sheetId: string, coachId = 'coach_deepa') {
  if (pool && !useInMemory) {
    const [month, yearStr] = sheetId.split(' ');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const { rows } = await pool.query(
      `INSERT INTO profit_sheets (sheet_id, coach_id, month, year)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (sheet_id) DO NOTHING
       RETURNING *`,
      [sheetId, coachId, month, year]
    );
    return rows[0] || { sheet_id: sheetId, coach_id: coachId, month, year };
  }
  const existing = memProfitSheets.find((s) => s.sheet_id === sheetId);
  if (existing) return existing;
  const [month, yearStr] = sheetId.split(' ');
  const sheet = { sheet_id: sheetId, coach_id: coachId, month, year: parseInt(yearStr, 10) || new Date().getFullYear(), created_at: new Date().toISOString() };
  memProfitSheets.push(sheet);
  return sheet;
}

export async function getProfitSheets(coachId?: string) {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT * FROM profit_sheets WHERE coach_id = $1 OR coach_id IS NULL ORDER BY created_at DESC'
      : 'SELECT * FROM profit_sheets ORDER BY created_at DESC';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memProfitSheets.filter((s) => !coachId || s.coach_id === coachId || !s.coach_id);
}

export async function getProfitEntries(sheetId: string, coachId?: string) {
  if (pool && !useInMemory) {
    let query = 'SELECT * FROM profit_entries WHERE sheet_id = $1';
    const params: any[] = [sheetId];
    if (coachId) {
      params.push(coachId);
      query += ` AND (coach_id = $${params.length} OR coach_id IS NULL)`;
    }
    query += ' ORDER BY payment_date ASC, id ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memProfitEntries
    .filter((e) => e.sheet_id === sheetId && (!coachId || e.coach_id === coachId || !e.coach_id))
    .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
}

export async function createProfitEntry(entry: any) {
  const norm = entry.phone_number ? normalizePhone(entry.phone_number) : undefined;
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO profit_entries (sheet_id, coach_id, payment_date, phone_number, member_name, membership_type, transaction_type, amount_received, coach_amount, cost_of_kit, cash_profit, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        entry.sheet_id,
        entry.coach_id || 'coach_deepa',
        entry.payment_date || new Date(),
        norm,
        entry.member_name,
        entry.membership_type || 'Basic',
        entry.transaction_type || 'New',
        entry.amount_received || 0,
        entry.coach_amount || 0,
        entry.cost_of_kit || 0,
        entry.cash_profit || 0,
        entry.payment_status || 'Received',
      ]
    );
    return rows[0];
  }
  const created = {
    id: memProfitEntries.length + 1,
    ...entry,
    phone_number: norm,
    created_at: new Date().toISOString(),
  };
  memProfitEntries.push(created);
  return created;
}

export async function updateProfitEntry(id: number, data: any) {
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `UPDATE profit_entries SET
         member_name = COALESCE($1, member_name),
         membership_type = COALESCE($2, membership_type),
         amount_received = COALESCE($3, amount_received),
         coach_amount = COALESCE($4, coach_amount),
         cost_of_kit = COALESCE($5, cost_of_kit),
         cash_profit = COALESCE($6, cash_profit),
         payment_status = COALESCE($7, payment_status)
       WHERE id = $8
       RETURNING *`,
      [data.member_name, data.membership_type, data.amount_received, data.coach_amount, data.cost_of_kit, data.cash_profit, data.payment_status, id]
    );
    return rows[0];
  }
  const idx = memProfitEntries.findIndex((e) => e.id === id);
  if (idx >= 0) {
    memProfitEntries[idx] = { ...memProfitEntries[idx], ...data };
    return memProfitEntries[idx];
  }
  return null;
}

export async function deleteProfitEntry(id: number) {
  if (pool && !useInMemory) {
    await pool.query('DELETE FROM profit_entries WHERE id = $1', [id]);
    return true;
  }
  const idx = memProfitEntries.findIndex((e) => e.id === id);
  if (idx >= 0) {
    memProfitEntries.splice(idx, 1);
    return true;
  }
  return false;
}

export async function getSheetProfitStats(sheetId: string, coachId?: string) {
  const entries = await getProfitEntries(sheetId, coachId);
  let total_received = 0;
  let total_profit = 0;
  entries.forEach((e: any) => {
    total_received += Number(e.amount_received || 0);
    total_profit += Number(e.cash_profit || 0);
  });
  return { count: entries.length, total_received, total_profit };
}

export async function getLifetimeProfitStats(coachId?: string) {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT COUNT(id) as cnt, SUM(amount_received) as rev, SUM(cash_profit) as prof FROM profit_entries WHERE coach_id = $1 OR coach_id IS NULL'
      : 'SELECT COUNT(id) as cnt, SUM(amount_received) as rev, SUM(cash_profit) as prof FROM profit_entries';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return {
      lifetimeCustomers: parseInt(rows[0]?.cnt || '0', 10),
      lifetimeRevenue: parseFloat(rows[0]?.rev || '0'),
      lifetimeProfit: parseFloat(rows[0]?.prof || '0'),
    };
  }
  let lifetimeCustomers = memProfitEntries.length;
  let lifetimeRevenue = 0;
  let lifetimeProfit = 0;
  memProfitEntries.forEach((e) => {
    if (!coachId || e.coach_id === coachId || !e.coach_id) {
      lifetimeRevenue += Number(e.amount_received || 0);
      lifetimeProfit += Number(e.cash_profit || 0);
    }
  });
  return { lifetimeCustomers, lifetimeRevenue, lifetimeProfit };
}

// Automations & Templates
export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM message_templates WHERE is_active = true');
    return rows;
  }
  return memMessageTemplates.filter((t) => t.is_active);
}

export async function getAutomationRules(coachId?: string): Promise<AutomationRule[]> {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT * FROM automation_rules WHERE (coach_id = $1 OR coach_id IS NULL) ORDER BY created_at ASC'
      : 'SELECT * FROM automation_rules ORDER BY created_at ASC';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memAutomationRules.filter((r) => !coachId || r.coach_id === coachId || !r.coach_id);
}

export async function updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule | null> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `UPDATE automation_rules SET
         name = COALESCE($1, name),
         is_active = COALESCE($2, is_active),
         requires_manual_approval = COALESCE($3, requires_manual_approval),
         delay_minutes = COALESCE($4, delay_minutes)
       WHERE id = $5
       RETURNING *`,
      [updates.name, updates.is_active, updates.requires_manual_approval, updates.delay_minutes, id]
    );
    return rows[0] || null;
  }
  const rule = memAutomationRules.find((r) => r.id === id);
  if (!rule) return null;
  if (updates.name !== undefined) rule.name = updates.name;
  if (updates.is_active !== undefined) rule.is_active = updates.is_active;
  if (updates.requires_manual_approval !== undefined) rule.requires_manual_approval = updates.requires_manual_approval;
  if (updates.delay_minutes !== undefined) rule.delay_minutes = updates.delay_minutes;
  return rule;
}

export async function createAutomationRun(run: Partial<AutomationRun>): Promise<AutomationRun> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO automation_runs (rule_id, target_entity_type, target_entity_id, status, scheduled_for, executed_at, payload, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [run.rule_id, run.target_entity_type || 'lead', run.target_entity_id || '', run.status || 'SENT', run.scheduled_for || now, run.executed_at || now, JSON.stringify(run.payload || {}), run.error_message]
    );
    return rows[0];
  }
  const created: AutomationRun = {
    id: memAutomationRuns.length + 1,
    rule_id: run.rule_id!,
    target_entity_type: run.target_entity_type || 'lead',
    target_entity_id: run.target_entity_id || '',
    status: run.status || 'SENT',
    scheduled_for: run.scheduled_for || now,
    executed_at: run.executed_at || now,
    payload: run.payload || {},
    error_message: run.error_message,
    created_at: now,
  };
  memAutomationRuns.push(created);
  return created;
}

export async function getAutomationRuns(coachId?: string): Promise<AutomationRun[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM automation_runs ORDER BY created_at DESC LIMIT 50');
    return rows;
  }
  return memAutomationRuns.slice().reverse().slice(0, 50);
}

export async function recordMessageDelivery(delivery: Partial<MessageDelivery>): Promise<MessageDelivery> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO message_deliveries (phone, direction, message_type, content, status, provider_msg_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [delivery.phone || '', delivery.direction || 'OUTBOUND', delivery.message_type || 'TEXT', delivery.content || '', delivery.status || 'DELIVERED', delivery.provider_msg_id]
    );
    return rows[0];
  }
  const created: MessageDelivery = {
    id: memMessageDeliveries.length + 1,
    phone: delivery.phone || '',
    direction: delivery.direction || 'OUTBOUND',
    message_type: delivery.message_type || 'TEXT',
    content: delivery.content || '',
    status: delivery.status || 'DELIVERED',
    provider_msg_id: delivery.provider_msg_id,
    created_at: now,
  };
  memMessageDeliveries.push(created);
  return created;
}

export async function getMessageDeliveries(): Promise<MessageDelivery[]> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT * FROM message_deliveries ORDER BY created_at DESC LIMIT 100');
    return rows;
  }
  return memMessageDeliveries.slice().reverse().slice(0, 100);
}

// Audit Events
export async function logAuditEvent(event: Partial<AuditEvent>): Promise<AuditEvent> {
  const now = new Date().toISOString();
  if (pool && !useInMemory) {
    const { rows } = await pool.query(
      `INSERT INTO audit_events (coach_id, event_type, entity_type, entity_id, payload, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [event.coach_id || 'coach_deepa', event.event_type || 'SYSTEM_ACTION', event.entity_type || 'UNKNOWN', event.entity_id || '', JSON.stringify(event.payload || {}), event.ip_address]
    );
    return rows[0];
  }
  const created: AuditEvent = {
    id: memAuditEvents.length + 1,
    coach_id: event.coach_id || 'coach_deepa',
    event_type: event.event_type || 'SYSTEM_ACTION',
    entity_type: event.entity_type || 'UNKNOWN',
    entity_id: event.entity_id || '',
    payload: event.payload || {},
    ip_address: event.ip_address,
    created_at: now,
  };
  memAuditEvents.push(created);
  return created;
}

export async function getAuditEvents(coachId?: string): Promise<AuditEvent[]> {
  if (pool && !useInMemory) {
    const query = coachId
      ? 'SELECT * FROM audit_events WHERE coach_id = $1 OR coach_id IS NULL ORDER BY created_at DESC LIMIT 100'
      : 'SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 100';
    const params = coachId ? [coachId] : [];
    const { rows } = await pool.query(query, params);
    return rows;
  }
  return memAuditEvents.filter((a) => !coachId || a.coach_id === coachId || !a.coach_id).slice().reverse().slice(0, 100);
}

// Events & Settings
export async function logEvent(phone: string, eventType: string, payload: any = {}) {
  const norm = normalizePhone(phone);
  if (pool && !useInMemory) {
    await pool.query(
      `INSERT INTO funnel_events (phone_number, event_type, payload) VALUES ($1, $2, $3)`,
      [norm, eventType, JSON.stringify(payload)]
    );
  }
}

export async function markWebhookProcessed(msgId: string): Promise<boolean> {
  if (pool && !useInMemory) {
    try {
      await pool.query(`INSERT INTO processed_webhooks (message_id) VALUES ($1)`, [msgId]);
      return true;
    } catch {
      return false;
    }
  }
  if (memProcessedWebhooks.has(msgId)) return false;
  memProcessedWebhooks.add(msgId);
  return true;
}

export async function getSetting(key: string): Promise<string | null> {
  if (pool && !useInMemory) {
    const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    return rows[0]?.value || null;
  }
  return memSettings[key] || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (pool && !useInMemory) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );
    return;
  }
  memSettings[key] = value;
}
