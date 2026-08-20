CREATE TABLE IF NOT EXISTS coaches (
  id                 VARCHAR(50) PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  phone              VARCHAR(30) UNIQUE NOT NULL,
  email              VARCHAR(100),
  role               VARCHAR(30) DEFAULT 'COACH',
  club_name          VARCHAR(100) DEFAULT 'Wellness Club',
  club_code          VARCHAR(50) DEFAULT 'WELLNESS101',
  zoom_link          TEXT,
  session_time       VARCHAR(100) DEFAULT '7:30 AM - 8:30 AM Daily',
  active             BOOLEAN DEFAULT TRUE,
  password_hash      VARCHAR(255),
  last_login_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coach_sessions (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE CASCADE,
  token_hash         VARCHAR(255) UNIQUE NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  phone_number       VARCHAR(30) PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  display_name       VARCHAR(100),
  gender             VARCHAR(10),
  age                INT,
  height_cm          NUMERIC,
  weight_kg          NUMERIC,
  funnel_state       VARCHAR(40) DEFAULT 'NEW',
  conversation_step  VARCHAR(50) DEFAULT 'IDLE',
  state_data         JSONB DEFAULT '{}'::jsonb,
  membership_type    VARCHAR(20),
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS body_analyses (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  name               VARCHAR(100),
  age                INT,
  gender             VARCHAR(10),
  height_cm          NUMERIC,
  weight_kg          NUMERIC,
  bmi                NUMERIC,
  sub_fat_pct        NUMERIC,
  visceral_fat       NUMERIC,
  skeletal_muscle_pct NUMERIC,
  body_fat_pct       NUMERIC,
  body_age           INT,
  bmr                INT,
  ideal_weight_kg    NUMERIC,
  hindi_report       TEXT,
  pdf_filename       VARCHAR(255),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  membership_type    VARCHAR(20),
  transaction_type   VARCHAR(30) DEFAULT 'New',
  f1_flavors         JSONB DEFAULT '[]'::jsonb,
  afresh_flavors     JSONB DEFAULT '[]'::jsonb,
  amount_received    NUMERIC DEFAULT 0,
  coach_amount       NUMERIC DEFAULT 0,
  cost_of_kit        NUMERIC DEFAULT 0,
  cash_profit        NUMERIC DEFAULT 0,
  order_status       VARCHAR(30) DEFAULT 'PLACED',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS home_visits (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  phone_number       VARCHAR(30) REFERENCES leads(phone_number) ON DELETE CASCADE,
  visit_number       INT DEFAULT 1,
  visit_date         DATE DEFAULT CURRENT_DATE,
  ideal_weight_kg    NUMERIC,
  health_challenges  TEXT,
  purpose_of_joining TEXT,
  energy_rating      VARCHAR(50),
  digestion          TEXT,
  wake_up_time       VARCHAR(30),
  sleeping_time      VARCHAR(30),
  water_intake       VARCHAR(50),
  routine_type       VARCHAR(50),
  member_name        VARCHAR(100),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profit_sheets (
  sheet_id           VARCHAR(50) PRIMARY KEY,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  month              VARCHAR(20),
  year               INT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profit_entries (
  id                 SERIAL PRIMARY KEY,
  sheet_id           VARCHAR(50) REFERENCES profit_sheets(sheet_id) ON DELETE CASCADE,
  coach_id           VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  payment_date       DATE DEFAULT CURRENT_DATE,
  phone_number       VARCHAR(30),
  member_name        VARCHAR(100),
  membership_type    VARCHAR(30),
  transaction_type   VARCHAR(30) DEFAULT 'New',
  amount_received    NUMERIC DEFAULT 0,
  coach_amount       NUMERIC DEFAULT 0,
  cost_of_kit        NUMERIC DEFAULT 0,
  cash_profit        NUMERIC DEFAULT 0,
  payment_status     VARCHAR(30) DEFAULT 'Received',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS funnel_events (
  id                 SERIAL PRIMARY KEY,
  coach_id           VARCHAR(50),
  phone_number       VARCHAR(30),
  event_type         VARCHAR(50),
  payload            JSONB DEFAULT '{}'::jsonb,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processed_webhooks (
  message_id         VARCHAR(100) PRIMARY KEY,
  processed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key                VARCHAR(50) PRIMARY KEY,
  value              TEXT,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
