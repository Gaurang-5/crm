-- Migration 002: Single-Coach Business Operating System Full Lifecycle Schema

CREATE TABLE IF NOT EXISTS people (
  id                 VARCHAR(50) PRIMARY KEY,
  phone              VARCHAR(30) UNIQUE NOT NULL,
  name               VARCHAR(100) NOT NULL,
  email              VARCHAR(100),
  gender             VARCHAR(10),
  city               VARCHAR(100),
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_sources (
  id                 SERIAL PRIMARY KEY,
  person_id          VARCHAR(50) REFERENCES people(id) ON DELETE CASCADE,
  channel            VARCHAR(30) NOT NULL, -- 'whatsapp', 'web_form', 'manual', 'meta_lead_ad'
  campaign_name      VARCHAR(100),
  ad_id              VARCHAR(100),
  form_id            VARCHAR(100),
  utm_source         VARCHAR(100),
  utm_campaign       VARCHAR(100),
  raw_payload        JSONB DEFAULT '{}'::jsonb,
  consent_given      BOOLEAN DEFAULT TRUE,
  consent_timestamp  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  name               VARCHAR(100) NOT NULL,
  source             VARCHAR(50) NOT NULL,
  ad_spend           NUMERIC DEFAULT 0,
  status             VARCHAR(30) DEFAULT 'ACTIVE',
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  code               VARCHAR(50) PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  order_index        INT NOT NULL,
  is_terminal        BOOLEAN DEFAULT FALSE,
  is_won             BOOLEAN DEFAULT FALSE,
  is_lost            BOOLEAN DEFAULT FALSE,
  color              VARCHAR(30) DEFAULT 'blue'
);

-- Insert Default Pipeline Stages if not existing
INSERT INTO pipeline_stages (code, name, order_index, is_terminal, is_won, is_lost, color) VALUES
  ('NEW', 'New Lead', 1, FALSE, FALSE, FALSE, 'blue'),
  ('CONTACTED', 'Contacted', 2, FALSE, FALSE, FALSE, 'indigo'),
  ('QUALIFIED', 'Qualified', 3, FALSE, FALSE, FALSE, 'purple'),
  ('CONSULTATION_BOOKED', 'Consultation Booked', 4, FALSE, FALSE, FALSE, 'amber'),
  ('ATTENDED', 'Attended Session', 5, FALSE, FALSE, FALSE, 'orange'),
  ('PLAN_OFFERED', 'Plan Offered', 6, FALSE, FALSE, FALSE, 'teal'),
  ('WON', 'Won (Customer)', 7, TRUE, TRUE, FALSE, 'emerald'),
  ('LOST', 'Lost', 8, TRUE, FALSE, TRUE, 'rose')
ON CONFLICT (code) DO NOTHING;

-- Extend leads table with person_id and next action if not already present
ALTER TABLE leads ADD COLUMN IF NOT EXISTS person_id VARCHAR(50) REFERENCES people(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_due TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_topic VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS stage_history (
  id                 SERIAL PRIMARY KEY,
  lead_phone         VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  from_stage         VARCHAR(50),
  to_stage           VARCHAR(50) NOT NULL,
  reason             TEXT,
  metadata           JSONB DEFAULT '{}'::jsonb,
  created_by         VARCHAR(50),
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  customer_id        VARCHAR(50),
  type               VARCHAR(30) NOT NULL, -- 'NOTE', 'CALL', 'MEETING', 'WHATSAPP', 'SYSTEM'
  summary            VARCHAR(255) NOT NULL,
  details            TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  customer_id        VARCHAR(50),
  title              VARCHAR(255) NOT NULL,
  due_date           TIMESTAMPTZ NOT NULL,
  priority           VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  status             VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'CANCELLED'
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  customer_id        VARCHAR(50),
  title              VARCHAR(255) NOT NULL,
  scheduled_at       TIMESTAMPTZ NOT NULL,
  duration_mins      INT DEFAULT 45,
  status             VARCHAR(30) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'ATTENDED', 'MISSED', 'CANCELLED'
  zoom_link          TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id                 VARCHAR(50) PRIMARY KEY,
  person_id          VARCHAR(50) REFERENCES people(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) UNIQUE NOT NULL,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  lead_phone         VARCHAR(30),
  name               VARCHAR(100) NOT NULL,
  status             VARCHAR(30) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'RENEWAL_DUE', 'COMPLETED'
  start_date         DATE DEFAULT CURRENT_DATE,
  renewal_date       DATE,
  current_plan       VARCHAR(50) DEFAULT 'Basic',
  goals              TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  code               VARCHAR(50) PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  price              NUMERIC NOT NULL,
  coach_amount       NUMERIC NOT NULL,
  cost_of_kit_new    NUMERIC NOT NULL,
  cost_of_kit_renewal NUMERIC NOT NULL,
  f1_count           INT DEFAULT 2,
  afresh_count       INT DEFAULT 1,
  meals_replaced     INT DEFAULT 1,
  description        TEXT,
  active             BOOLEAN DEFAULT TRUE
);

-- Seed Default Plans
INSERT INTO plans (code, name, price, coach_amount, cost_of_kit_new, cost_of_kit_renewal, f1_count, afresh_count, meals_replaced, description, active) VALUES
  ('Basic', 'Basic Membership', 8400, 5320, 3006, 3497, 2, 1, 1, '1 Meal Replacement daily + Morning Club + 1 Afresh routine', TRUE),
  ('Elite', 'Elite / Pro Membership', 12070, 8990, 5660, 6157, 3, 2, 2, '2 Meal Replacements daily + Morning & Evening Club + 2 Afresh routine', TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS enrollments (
  id                 SERIAL PRIMARY KEY,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  plan_code          VARCHAR(50) REFERENCES plans(code),
  start_date         DATE NOT NULL,
  end_date           DATE,
  status             VARCHAR(30) DEFAULT 'ACTIVE',
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding_items (
  id                 SERIAL PRIMARY KEY,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  title              VARCHAR(255) NOT NULL,
  order_index        INT DEFAULT 0,
  is_completed       BOOLEAN DEFAULT FALSE,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id                 VARCHAR(50) PRIMARY KEY,
  code               VARCHAR(50) UNIQUE NOT NULL,
  name               VARCHAR(100) NOT NULL,
  category           VARCHAR(50) DEFAULT 'NUTRITION',
  sales_price        NUMERIC NOT NULL,
  unit_cost          NUMERIC NOT NULL,
  active             BOOLEAN DEFAULT TRUE
);

-- Seed Products
INSERT INTO products (id, code, name, category, sales_price, unit_cost, active) VALUES
  ('prod_f1_shake', 'F1_SHAKE', 'Formula 1 Nutritional Shake Mix (500g)', 'NUTRITION', 2150, 1450, TRUE),
  ('prod_afresh', 'AFRESH_ENERGY', 'Afresh Energy Drink Mix (50g)', 'ENERGY', 850, 560, TRUE),
  ('prod_protein', 'PPP_PROTEIN', 'Personalized Protein Powder (200g)', 'PROTEIN', 1420, 950, TRUE),
  ('prod_multivitamin', 'MULTIVIT', 'Multivitamin Mineral Complex (90 tabs)', 'WELLNESS', 1650, 1100, TRUE),
  ('prod_celluloss', 'CELLULOSS', 'Cell-U-Loss Herbal Blend (90 tabs)', 'WEIGHT_MANAGEMENT', 1720, 1150, TRUE),
  ('prod_aloe', 'HERBAL_ALOE', 'Herbal Aloe Concentrate (500ml)', 'DIGESTION', 2450, 1620, TRUE),
  ('prod_shaker', 'SHAKER_CUP', 'Neon Shaker Cup with Whisk Ball (600ml)', 'ACCESSORY', 450, 220, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Extend orders with customer_id and total_cost
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS order_items (
  id                 SERIAL PRIMARY KEY,
  order_id           INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id         VARCHAR(50),
  product_name_snapshot VARCHAR(100) NOT NULL,
  unit_price_snapshot NUMERIC NOT NULL,
  unit_cost_snapshot NUMERIC NOT NULL,
  quantity           INT DEFAULT 1,
  subtotal_price     NUMERIC NOT NULL,
  subtotal_cost      NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  order_id           INT REFERENCES orders(id) ON DELETE SET NULL,
  amount             NUMERIC NOT NULL,
  payment_date       DATE DEFAULT CURRENT_DATE,
  payment_method     VARCHAR(50) DEFAULT 'UPI', -- 'UPI', 'CASH', 'BANK_TRANSFER', 'CARD'
  reference_no       VARCHAR(100),
  notes              TEXT,
  author_id          VARCHAR(50),
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  order_id           INT REFERENCES orders(id) ON DELETE SET NULL,
  amount             NUMERIC NOT NULL,
  refund_date        DATE DEFAULT CURRENT_DATE,
  reason             TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  title              VARCHAR(150) NOT NULL,
  category           VARCHAR(50) DEFAULT 'MARKETING', -- 'MARKETING', 'ZOOM_SOFTWARE', 'CLUB_RENT', 'SHIPPING', 'OTHER'
  amount             NUMERIC NOT NULL,
  expense_date       DATE DEFAULT CURRENT_DATE,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_allocations (
  id                 SERIAL PRIMARY KEY,
  expense_id         INT REFERENCES expenses(id) ON DELETE CASCADE,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  allocated_amount   NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_checkins (
  id                 SERIAL PRIMARY KEY,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  checkin_date       DATE DEFAULT CURRENT_DATE,
  weight_kg          NUMERIC,
  water_liters       NUMERIC,
  meals_compliant    BOOLEAN DEFAULT TRUE,
  exercise_mins      INT DEFAULT 0,
  energy_level       INT DEFAULT 4, -- 1 to 5
  sleep_hours        NUMERIC DEFAULT 7,
  notes              TEXT,
  coach_feedback     TEXT,
  reviewed_by_coach  BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS measurements (
  id                 SERIAL PRIMARY KEY,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  recorded_date      DATE DEFAULT CURRENT_DATE,
  chest_cm           NUMERIC,
  waist_cm           NUMERIC,
  hips_cm            NUMERIC,
  thighs_cm          NUMERIC,
  arms_cm            NUMERIC,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id                 SERIAL PRIMARY KEY,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  photo_url          TEXT NOT NULL,
  photo_type         VARCHAR(20) DEFAULT 'FRONT', -- 'FRONT', 'BACK', 'SIDE'
  caption            TEXT,
  recorded_date      DATE DEFAULT CURRENT_DATE,
  is_private         BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestones (
  id                 SERIAL PRIMARY KEY,
  customer_id        VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  title              VARCHAR(150) NOT NULL,
  achieved_date      DATE DEFAULT CURRENT_DATE,
  metric_name        VARCHAR(50),
  initial_val        NUMERIC,
  achieved_val       NUMERIC,
  celebrated_on_whatsapp BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_templates (
  id                 VARCHAR(50) PRIMARY KEY,
  code               VARCHAR(50) UNIQUE NOT NULL,
  name               VARCHAR(100) NOT NULL,
  category           VARCHAR(50) DEFAULT 'GENERAL',
  body_template      TEXT NOT NULL,
  required_variables JSONB DEFAULT '[]'::jsonb,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Message Templates
INSERT INTO message_templates (id, code, name, category, body_template, required_variables, is_active) VALUES
  ('tpl_welcome_lead', 'WELCOME_LEAD', 'New Lead Welcome', 'LEAD_ACQUISITION', 'नमस्ते {{name}} जी! 🙏 वेलनेस क्लब में आपका स्वागत है। आपकी हेल्थ एनालिसिस रिपोर्ट तैयार करने के लिए क्या आप 2 मिनट समय दे सकते हैं?', '["name"]'::jsonb, TRUE),
  ('tpl_zoom_invite', 'ZOOM_INVITE', 'Morning Club Zoom Invite', 'SALES_PIPELINE', '🎉 नमस्ते {{name}} जी! आपको लाइव ज़ूम वर्कआउट और वेलनेस ओरिएंटेशन के लिए आमंत्रित किया गया है। समय: {{session_time}} | लिंक: {{zoom_link}}', '["name", "session_time", "zoom_link"]'::jsonb, TRUE),
  ('tpl_welcome_customer', 'WELCOME_CUSTOMER', 'Won Lead Onboarding Welcome', 'ONBOARDING', '🎉 बधाई हो {{name}} जी! आपकी {{plan}} मेंबरशिप शुरू हो गई है। हम आपके साथ 1st Home Visit व डाइट रूटीन चार्ट साझा कर रहे हैं।', '["name", "plan"]'::jsonb, TRUE),
  ('tpl_daily_checkin', 'DAILY_CHECKIN', 'Daily Morning Routine Check-in', 'PROGRESS', '🌅 सुप्रभात {{name}} जी! आज का वजन और पानी का लक्ष्य ({{water_target}}L) अपडेट करना न भूलें। आज आप कैसा महसूस कर रहे हैं?', '["name", "water_target"]'::jsonb, TRUE),
  ('tpl_milestone_loss', 'MILESTONE_WEIGHT_LOSS', 'Weight Loss Milestone', 'PROGRESS', '🏆 वाह {{name}} जी! आपने कुल {{loss_kg}} kg वजन सफलतापूर्वक कम कर लिया है! बधाई हो!', '["name", "loss_kg"]'::jsonb, TRUE),
  ('tpl_renewal_reminder', 'RENEWAL_REMINDER', 'Renewal Due Reminder', 'RENEWAL', '⏰ नमस्ते {{name}} जी! आपकी मेंबरशिप {{days_left}} दिन बाद ({{renewal_date}}) रिन्यूअल के लिए नियत है। अपनी निरंतरता बनाए रखने के लिए संपर्क करें।', '["name", "days_left", "renewal_date"]'::jsonb, TRUE),
  ('tpl_payment_reminder', 'PAYMENT_REMINDER', 'Pending Balance Reminder', 'PAYMENTS', '💳 नमस्ते {{name}} जी! आपके वेलनेस प्लान का बकाया ₹{{balance}} नियत है। कृपया UPI द्वारा भुगतान पूरा करें।', '["name", "balance"]'::jsonb, TRUE),
  ('tpl_inactive_recovery', 'INACTIVE_RECOVERY', 'Inactive Customer Recovery', 'RETENTION', '🌿 नमस्ते {{name}} जी! हमें आपकी वेलनेस यात्रा याद आ रही है। आइए फिर से शुरुआत करें और एक नई गति प्राप्त करें!', '["name"]'::jsonb, TRUE),
  ('tpl_referral_ask', 'REFERRAL_REQUEST', 'Referral Invitation', 'REFERRAL', '🌟 नमस्ते {{name}} जी! आपकी शानदार प्रगति देखकर आपके परिवार या मित्र भी स्वस्थ होना चाहेंगे। किसी 1 दोस्त को फ्री बॉडी एनालिसिस गिफ्ट करें!', '["name"]'::jsonb, TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS automation_rules (
  id                 VARCHAR(50) PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  name               VARCHAR(100) NOT NULL,
  trigger_event      VARCHAR(50) NOT NULL, -- 'NEW_LEAD', 'NO_RESPONSE_24H', 'CONSULTATION_CONFIRM', 'CONSULTATION_REMINDER', 'WON_ONBOARDING', 'DAILY_CHECKIN', 'MISSED_CHECKIN', 'MILESTONE_REACHED', 'PAYMENT_REMINDER', 'RENEWAL_15D', 'RENEWAL_7D', 'RENEWAL_1D', 'INACTIVE_RECOVERY', 'REFERRAL_REQUEST'
  conditions         JSONB DEFAULT '{}'::jsonb,
  delay_minutes      INT DEFAULT 0,
  action_type        VARCHAR(50) DEFAULT 'WHATSAPP', -- 'WHATSAPP', 'COACH_TASK', 'ALERT_COACH'
  template_id        VARCHAR(50) REFERENCES message_templates(id) ON DELETE SET NULL,
  requires_manual_approval BOOLEAN DEFAULT FALSE,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Automation Rules
INSERT INTO automation_rules (id, coach_id, name, trigger_event, conditions, delay_minutes, action_type, template_id, requires_manual_approval, is_active) VALUES
  ('rule_new_lead', NULL, 'Instant New Lead Acknowledgement', 'NEW_LEAD', '{}'::jsonb, 0, 'WHATSAPP', 'tpl_welcome_lead', FALSE, TRUE),
  ('rule_won_onboarding', NULL, 'Customer Onboarding Welcome Sequence', 'WON_ONBOARDING', '{}'::jsonb, 0, 'WHATSAPP', 'tpl_welcome_customer', FALSE, TRUE),
  ('rule_daily_checkin', NULL, 'Daily Morning Routine Check-in', 'DAILY_CHECKIN', '{"time": "07:00"}'::jsonb, 0, 'WHATSAPP', 'tpl_daily_checkin', FALSE, TRUE),
  ('rule_renewal_15d', NULL, 'Renewal Reminder 15 Days Notice', 'RENEWAL_15D', '{"days_before": 15}'::jsonb, 0, 'WHATSAPP', 'tpl_renewal_reminder', FALSE, TRUE),
  ('rule_renewal_7d', NULL, 'Renewal Reminder 7 Days Notice', 'RENEWAL_7D', '{"days_before": 7}'::jsonb, 0, 'WHATSAPP', 'tpl_renewal_reminder', FALSE, TRUE),
  ('rule_payment_reminder', NULL, 'Pending Balance Alert', 'PAYMENT_REMINDER', '{}'::jsonb, 0, 'WHATSAPP', 'tpl_payment_reminder', TRUE, TRUE),
  ('rule_referral_milestone', NULL, 'Milestone Celebration & Referral', 'MILESTONE_REACHED', '{}'::jsonb, 60, 'WHATSAPP', 'tpl_referral_ask', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS automation_runs (
  id                 SERIAL PRIMARY KEY,
  rule_id            VARCHAR(50) REFERENCES automation_rules(id) ON DELETE CASCADE,
  target_entity_type VARCHAR(30) NOT NULL, -- 'lead', 'customer', 'coach'
  target_entity_id   VARCHAR(50) NOT NULL,
  status             VARCHAR(30) DEFAULT 'SENT', -- 'PENDING_APPROVAL', 'QUEUED', 'SENT', 'SKIPPED', 'FAILED', 'CANCELLED'
  scheduled_for      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  executed_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  payload            JSONB DEFAULT '{}'::jsonb,
  error_message      TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_deliveries (
  id                 SERIAL PRIMARY KEY,
  phone              VARCHAR(30) NOT NULL,
  direction          VARCHAR(20) DEFAULT 'OUTBOUND', -- 'OUTBOUND', 'INBOUND'
  message_type       VARCHAR(30) DEFAULT 'TEXT',
  content            TEXT NOT NULL,
  status             VARCHAR(30) DEFAULT 'DELIVERED', -- 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'
  provider_msg_id    VARCHAR(100),
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50),
  event_type         VARCHAR(50) NOT NULL, -- 'AUTH_LOGIN', 'STAGE_CHANGE', 'PAYMENT_RECORDED', 'REFUND_ISSUED', 'CUSTOMER_CONVERTED', 'DATA_EXPORT', 'DATA_DELETED'
  entity_type        VARCHAR(50) NOT NULL,
  entity_id          VARCHAR(100) NOT NULL,
  payload            JSONB DEFAULT '{}'::jsonb,
  ip_address         VARCHAR(50),
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Form 1: Consumer Data [First Homevisit] (All 24 fields compulsory)
CREATE TABLE IF NOT EXISTS consumer_homevisit_forms (
  id                  SERIAL PRIMARY KEY,
  customer_id         VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
  phone_number        VARCHAR(30) NOT NULL,
  coach_id            VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  name                VARCHAR(100) NOT NULL,
  age                 INT NOT NULL,
  height              VARCHAR(50) NOT NULL,
  weight              NUMERIC NOT NULL,
  ideal_weight        NUMERIC NOT NULL,
  health_challenges   TEXT NOT NULL,
  purpose_of_joining  TEXT NOT NULL,
  energy              TEXT NOT NULL,
  digestion           TEXT NOT NULL,
  sleep               TEXT NOT NULL,
  sleeping_time       VARCHAR(50) NOT NULL,
  wake_up_time        VARCHAR(50) NOT NULL,
  breakfast_time      VARCHAR(50) NOT NULL,
  mid_meal_1          TEXT NOT NULL,
  lunch               TEXT NOT NULL,
  mid_meal_2          TEXT NOT NULL,
  dinner              TEXT NOT NULL,
  exercise            TEXT NOT NULL,
  water_intake        VARCHAR(50) NOT NULL,
  family_members      VARCHAR(50) NOT NULL,
  fruit_salad         TEXT NOT NULL,
  tea                 TEXT NOT NULL,
  non_veg             TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Form 2: Body Analysis Enhancements (Ensure all columns exist)
ALTER TABLE body_analyses ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE body_analyses ADD COLUMN IF NOT EXISTS serial_no VARCHAR(50);
ALTER TABLE body_analyses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE body_analyses ADD COLUMN IF NOT EXISTS wellness_consultant VARCHAR(100);

