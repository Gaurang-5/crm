export interface Person {
  id: string;
  phone_number: string;
  phone?: string;
  full_name: string;
  name?: string;
  gender?: 'M' | 'F' | 'OTHER' | string;
  age?: number;
  city?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type LeadSourceChannel = 'whatsapp' | 'web_form' | 'meta_lead_ad' | 'manual' | 'referral' | string;

export interface LeadSource {
  id?: number;
  person_id?: string;
  phone_number: string;
  channel: LeadSourceChannel;
  campaign_name?: string;
  utm_source?: string;
  utm_campaign?: string;
  ad_id?: string;
  form_id?: string;
  referrer_phone?: string;
  raw_payload?: Record<string, any>;
  consent_given: boolean;
  consent_timestamp?: string;
  created_at: string;
}

export interface Campaign {
  id: string | number;
  name: string;
  source: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  ad_spend: number;
  notes?: string;
  created_at?: string;
}

export interface PipelineStage {
  id?: number | string;
  code: string;
  name: string;
  order_index: number;
  description?: string;
  is_active?: boolean;
  is_terminal?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  color?: string;
}

export interface Lead {
  phone_number: string;
  person_id?: string;
  coach_id?: string;
  display_name?: string;
  gender?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  interest_topic?: string;
  lead_score?: number;
  funnel_state: string;
  conversation_step?: string;
  state_data?: Record<string, any>;
  membership_type?: string;
  next_action?: string;
  next_action_due?: string;
  next_followup_at?: string;
  paused?: boolean;
  created_at: string;
  updated_at: string;
  person?: Person;
  sources?: LeadSource[];
}

export interface StageHistory {
  id: number;
  lead_phone: string;
  from_stage?: string;
  to_stage: string;
  reason?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export type ActivityType = 'NOTE' | 'CALL' | 'MEETING' | 'WHATSAPP' | 'SYSTEM';

export interface Activity {
  id: number;
  coach_id?: string;
  phone_number?: string;
  customer_id?: string;
  type: ActivityType;
  summary: string;
  details?: string;
  created_at: string;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: number;
  coach_id?: string;
  phone_number?: string;
  customer_id?: string;
  title: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string;
  created_at: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'ATTENDED' | 'MISSED' | 'CANCELLED';

export interface Appointment {
  id: number;
  coach_id?: string;
  phone_number?: string;
  customer_id?: string;
  title: string;
  scheduled_at: string;
  duration_mins: number;
  status: AppointmentStatus;
  zoom_link?: string;
  notes?: string;
  created_at: string;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'RENEWAL_DUE' | 'COMPLETED';

export interface Customer {
  id: string;
  person_id?: string;
  phone_number: string;
  coach_id?: string;
  lead_phone?: string;
  name: string;
  status: CustomerStatus;
  start_date: string;
  renewal_date?: string;
  current_plan?: string;
  goals?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  code: 'Basic' | 'Elite' | string;
  name: string;
  price: number;
  coach_amount: number;
  cost_of_kit_new: number;
  cost_of_kit_renewal: number;
  f1_count?: number;
  f1_required_count?: number;
  afresh_count?: number;
  afresh_required_count?: number;
  meals_replaced: number;
  description: string;
  active: boolean;
}

export interface Enrollment {
  id: number;
  customer_id: string;
  plan_code: string;
  start_date: string;
  end_date?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
}

export interface OnboardingItem {
  id: number;
  customer_id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  sales_price: number;
  unit_cost: number;
  active: boolean;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  unit_cost_snapshot: number;
  quantity: number;
  subtotal_price: number;
  subtotal_cost: number;
}

export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: number;
  coach_id?: string;
  phone_number?: string;
  customer_id?: string;
  order_number?: string;
  membership_type?: string;
  transaction_type?: string;
  f1_flavors?: string[];
  afresh_flavors?: string[];
  amount_received?: number;
  coach_amount?: number;
  cost_of_kit?: number;
  cash_profit?: number;
  total_cost?: number;
  order_status: OrderStatus;
  delivery_address?: string;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  coach_id?: string;
  customer_id: string;
  order_id?: number;
  amount: number;
  payment_date: string;
  payment_method: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD';
  reference_no?: string;
  notes?: string;
  author_id?: string;
  created_at: string;
}

export interface Refund {
  id?: number;
  coach_id?: string;
  customer_id?: string;
  order_id?: number;
  payment_id?: number;
  amount: number;
  refund_date?: string;
  reason: string;
  author_id?: string;
  created_at?: string;
}

export interface Expense {
  id: number;
  coach_id?: string;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface ProgressCheckin {
  id: number;
  customer_id: string;
  checkin_date: string;
  weight_kg?: number;
  water_liters?: number;
  meals_compliant?: boolean;
  exercise_mins?: number;
  energy_level?: number;
  sleep_hours?: number;
  notes?: string;
  coach_feedback?: string;
  reviewed_by_coach: boolean;
  created_at: string;
}

export interface Measurement {
  id: number;
  customer_id: string;
  recorded_date: string;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  thighs_cm?: number;
  arms_cm?: number;
  notes?: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: number;
  customer_id: string;
  photo_url: string;
  photo_type: 'FRONT' | 'BACK' | 'SIDE';
  caption?: string;
  recorded_date: string;
  is_private: boolean;
  created_at: string;
}

export interface Milestone {
  id: number;
  customer_id: string;
  title: string;
  achieved_date: string;
  metric_name?: string;
  initial_val?: number;
  achieved_val?: number;
  celebrated_on_whatsapp: boolean;
  created_at: string;
}

// Form 1: Consumer Data [First Homevisit] (All 24 fields compulsory)
export interface ConsumerDataHomevisit {
  id?: number;
  customer_id?: string;
  phone_number: string;
  coach_id?: string;
  date: string;                     // DATE (Compulsory)
  name: string;                     // 1. Name (Compulsory)
  age: number;                      // 2. Age (Compulsory)
  height: string;                   // 3. Height (Compulsory)
  weight: number;                   // 4. Weight (Compulsory)
  ideal_weight: number;             // 5. Ideal weight (Compulsory)
  health_challenges: string;        // 6. Any health challenge/any pain (leg pain, back pain, headache) (Compulsory)
  purpose_of_joining: string;       // 7. Purpose of joining (Compulsory)
  energy: string;                   // 8. Energy (Compulsory)
  digestion: string;                // 9. Digestion (constipation, gas, acidity, burps) (Compulsory)
  sleep: string;                    // 10. Sleep (बीच में रात को उठना, snoring) (Compulsory)
  sleeping_time: string;            // 11. Sleeping time (Compulsory)
  wake_up_time: string;             // 12. Wake up time (Compulsory)
  breakfast_time: string;           // 13. Breakfast time (Compulsory)
  mid_meal_1: string;               // 14. Mid-meal (Compulsory)
  lunch: string;                    // 15. Lunch (Compulsory)
  mid_meal_2: string;               // 16. Mid-meal (Compulsory)
  dinner: string;                   // 17. Dinner (Compulsory)
  exercise: string;                 // 18. Exercise (Compulsory)
  water_intake: string;             // 19. Water intake (Compulsory)
  family_members: string;           // 20. Family members (Compulsory)
  fruit_salad: string;              // 21. Fruit salad (Compulsory)
  tea: string;                      // 22. Tea (Compulsory)
  non_veg: string;                  // 23. Non veg (Compulsory)
  created_at?: string;
}

// Form 2: Body Analysis (All 17 fields compulsory)
export interface BodyAnalysisRecord {
  id?: number;
  coach_id?: string;
  phone_number: string;
  name: string;                     // Name (Compulsory)
  date: string;                     // Date (Compulsory)
  serial_no: string;                // S. No. (Compulsory)
  age: number;                      // AGE (Compulsory)
  gender: 'M' | 'F';                // M / F (Compulsory)
  height_cm: number;                // Height (Compulsory)
  mobile: string;                   // Mob. (Compulsory)
  address: string;                  // Address (Compulsory)
  weight_kg: number;                // WEIGHT (Kg.) (Compulsory)
  sub_fat_pct: number;              // Subcutaneous Fat (Ideal: <15%) (Compulsory)
  body_age: number;                 // BODY AGE (Years) (Compulsory)
  skeletal_muscle_pct: number;      // SKELETAL MUSCLE % (Ideal Male: 33-36%, Female: 30-33%) (Compulsory)
  body_fat_pct: number;             // BODY FAT % (Compulsory)
  visceral_fat: number;             // VISCERAL FAT (Units) (Compulsory)
  bmr: number;                      // BMR (Energy spent at rest) (Compulsory)
  bmi: number;                      // BMI (Compulsory)
  wellness_consultant: string;      // Your Wellness Consultant (Compulsory)
  ideal_weight_kg?: number;
  body_fat_category?: 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH';
  visceral_fat_category?: 'NORMAL' | 'HIGH' | 'VERY_HIGH';
  bmi_category?: 'UNDER_WEIGHT' | 'NORMAL' | 'OVER_WEIGHT' | 'OBESE';
  bmr_status?: 'LOW' | 'NORMAL';
  hindi_report?: string;
  pdf_filename?: string;
  created_at?: string;
}

export interface MessageTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  body_template: string;
  required_variables: string[];
  is_active: boolean;
  created_at?: string;
}

export type AutomationTrigger =
  | 'NEW_LEAD'
  | 'NO_RESPONSE_24H'
  | 'CONSULTATION_CONFIRM'
  | 'CONSULTATION_REMINDER'
  | 'WON_ONBOARDING'
  | 'DAILY_CHECKIN'
  | 'MISSED_CHECKIN'
  | 'MILESTONE_REACHED'
  | 'PAYMENT_REMINDER'
  | 'RENEWAL_15D'
  | 'RENEWAL_7D'
  | 'RENEWAL_1D'
  | 'INACTIVE_RECOVERY'
  | 'REFERRAL_REQUEST';

export interface AutomationRule {
  id: string;
  coach_id?: string;
  name: string;
  trigger_event: AutomationTrigger;
  conditions?: Record<string, any>;
  delay_minutes: number;
  action_type: 'WHATSAPP' | 'COACH_TASK' | 'ALERT_COACH';
  template_id?: string;
  requires_manual_approval: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface AutomationRun {
  id: number;
  rule_id: string;
  target_entity_type: 'lead' | 'customer' | 'coach';
  target_entity_id: string;
  status: 'PENDING_APPROVAL' | 'QUEUED' | 'SENT' | 'SKIPPED' | 'FAILED' | 'CANCELLED';
  scheduled_for: string;
  executed_at?: string;
  payload?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export interface MessageDelivery {
  id: number;
  phone: string;
  direction: 'OUTBOUND' | 'INBOUND';
  message_type: string;
  content: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  provider_msg_id?: string;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  coach_id?: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
