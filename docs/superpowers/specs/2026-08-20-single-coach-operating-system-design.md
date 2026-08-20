# Single-Coach Business Operating System Design

## 1. Objective

Transform the existing wellness CRM prototype into a coach-controlled business operating system covering the complete lifecycle:

`Lead acquisition -> sales follow-up -> conversion -> onboarding -> customer progress -> renewal -> revenue and profit`

Phase one supports one independent coach. The design avoids multi-coach workflows while keeping identifiers and service boundaries compatible with a future multi-coach edition.

## 2. Product Boundaries

### Included

- Lead capture from WhatsApp, public website forms, manual entry, and Facebook/Instagram Lead Ads.
- Deduplication using normalized phone number, with source and campaign attribution retained.
- Configurable sales pipeline, activities, appointments, tasks, and follow-up history.
- Conversion of a won lead into a customer without duplicate data entry.
- Complete wellness journey: body metrics, progress photos, attendance, meals, water, exercise, energy, sleep, milestones, and coach notes.
- Coach reminders and configurable WhatsApp automations.
- Products, plans, orders, manual payments, outstanding balances, expenses, revenue, customer profit, and monthly profit sheets.
- Renewal, inactivity-recovery, and referral workflows.
- Responsive coach dashboard and downloadable reports.

### Excluded from phase one

- Customer accounts or a customer-facing mobile application.
- Multi-coach teams, territories, commissions, and role hierarchies.
- Online payment collection.
- Inventory purchasing and warehouse management beyond product cost per order.
- Clinical diagnosis, treatment, or medical decision support.

Customers interact through WhatsApp and public forms. The coach controls all internal records and decisions.

## 3. Information Architecture

The primary navigation is:

1. **Today** — overdue and upcoming tasks, new leads, appointments, missed check-ins, pending payments, renewals, and alerts.
2. **Leads** — searchable list with source, campaign, interest, stage, last activity, and next action.
3. **Pipeline** — kanban and list views for New, Contacted, Qualified, Consultation Booked, Attended, Plan Offered, Won, and Lost.
4. **Customers** — active, inactive, renewal-due, and completed customers.
5. **Follow-ups** — task list and calendar with calls, meetings, WhatsApp messages, and reminders.
6. **Progress** — customer check-ins, comparisons, charts, milestones, and missing-data alerts.
7. **Orders & Payments** — plans, products, order status, received amounts, balances, and payment references.
8. **Revenue & Profit** — revenue, product cost, other expense allocation, refunds, gross profit, and net profit.
9. **Campaigns** — performance by source and Meta campaign, including leads, conversions, revenue, and optional ad spend.
10. **Reports** — conversion, progress, retention, renewals, revenue, outstanding balances, and profit sheets.
11. **Settings** — coach profile, plans, products, prices, pipeline stages, templates, integrations, and automation rules.

Desktop uses a collapsible sidebar. Mobile uses a compact header and drawer; dense tables become cards or focused lists.

## 4. Core Workflows

### 4.1 Lead acquisition and deduplication

All acquisition adapters call one lead-ingestion service. It normalizes phone numbers, searches for an existing person, and either creates a lead or appends a new source touchpoint. A repeated form or ad submission never silently overwrites sales history.

Each source event records channel, campaign, form/ad identifier, captured fields, consent evidence, timestamp, and raw provider reference. Invalid submissions enter a review queue rather than disappearing.

### 4.2 Sales pipeline

Every lead has one current stage and an immutable stage-history timeline. Stage changes may require structured information; for example, Lost requires a reason and Won requires a plan and start date. Each open lead should have a next action or be marked intentionally paused.

The coach can create notes, calls, appointments, messages, and follow-up tasks from the lead profile. Dashboard counters and automations derive from these records rather than from UI-only state.

### 4.3 Conversion and onboarding

Marking a lead Won creates a customer profile linked to the original person and lead. The conversion transaction also creates the selected plan enrollment, onboarding checklist, first progress baseline, initial order when applicable, and scheduled follow-ups. The complete pre-sale timeline remains visible.

### 4.4 Customer journey

Customer profiles contain:

- Contact information, consent, goals, plan, start date, renewal date, and status.
- Body analyses and measurements with source, recorded date, and coach-reviewed status.
- Optional photos stored privately.
- Daily or weekly check-ins for attendance, meals, water, exercise, energy, sleep, and notes.
- Milestones, risks, tasks, messages, documents, orders, payments, and renewals.

Progress summaries compare the latest check-in to baseline and previous periods. Missing values remain unknown; they are not interpreted as zero.

### 4.5 Orders, payments, and profit

Orders preserve snapshots of product names, quantities, sales prices, and unit costs. Later catalog changes cannot modify historical accounts.

Payments are entered manually and may be partial. Each payment stores amount, date, method, reference, notes, and author. Outstanding balance is derived from order totals, payments, discounts, and refunds.

Customer profit is:

`payments received - product costs - allocated expenses - refunds`

Reports distinguish cash profit from expected profit so unpaid balances are never counted as received cash. Every financial edit is audited.

## 5. Automation Engine

Automations consist of a trigger, optional conditions, delay, action, template, active state, and execution history. Actions create coach tasks or enqueue approved WhatsApp messages.

Initial automation templates cover:

- New-lead acknowledgement and coach notification.
- No-response follow-ups at configurable intervals.
- Consultation confirmation, reminder, attendance, and missed-session recovery.
- Won-lead onboarding checklist and welcome sequence.
- Daily or weekly customer check-ins.
- Missed check-in alerts to the coach.
- Progress milestone messages.
- Pending-payment reminders.
- Renewal reminders 15, 7, and 1 day before due date.
- Inactive-customer recovery.
- Referral request after a successful milestone.

Automations must be idempotent, respect opt-out and quiet-hour rules, and expose pending, sent, failed, skipped, and cancelled states. The coach can disable any rule or require manual approval before sending.

## 6. Data Model

Primary entities:

- `people` — normalized identity and contact information.
- `leads` — sales status, current stage, interest, score, and next action.
- `lead_sources` and `campaigns` — attribution and provider references.
- `pipeline_stages` and `stage_history` — configurable stages and immutable movement history.
- `activities`, `appointments`, and `tasks` — complete interaction and follow-up timeline.
- `customers`, `enrollments`, and `onboarding_items` — post-conversion lifecycle.
- `body_analyses`, `progress_checkins`, `measurements`, `habits`, `progress_photos`, and `milestones`.
- `products`, `plans`, `orders`, and `order_items`.
- `payments`, `refunds`, `expenses`, and `expense_allocations`.
- `message_templates`, `automation_rules`, `automation_runs`, and `message_deliveries`.
- `documents`, `consents`, `audit_events`, and `settings`.

Foreign keys, unique constraints, check constraints, and database transactions protect lifecycle integrity. Migrations replace runtime `CREATE TABLE` statements. Pagination and indexes cover phone lookup, stage, status, task due date, customer status, renewal date, payment date, and campaign reporting.

## 7. Technical Architecture

### Frontend

A responsive TypeScript application replaces the mismatched static HTML and monolithic JavaScript. Feature modules own routes, components, form schemas, API calls, and tests. Shared components cover cards, tables, forms, dialogs, timelines, charts, loading states, empty states, and errors.

### Backend

The Node.js service is separated into modules for authentication, leads, customers, progress, commerce, automations, messaging, campaigns, reports, and integrations. Routes call validated service functions; services own transactions and business rules; repositories own database access.

### Integrations

- Meta WhatsApp Cloud API for inbound messages and approved outbound templates.
- Meta Lead Ads webhook/API adapter for Facebook and Instagram submissions.
- Public website-form endpoint protected with validation, rate limits, and anti-abuse controls.
- Private object storage for photos and reports using expiring signed URLs.
- PostgreSQL as the only production source of truth.
- Redis/BullMQ for durable message and automation jobs.

The in-memory database and direct-dispatch queue are permitted only in explicit development/test mode and must fail closed in production.

## 8. Security, Privacy, and Wellness Safety

- Secure coach authentication, server-side authorization, session expiry, and optional OTP.
- Restricted CORS, security headers, request-size limits, schema validation, rate limiting, and webhook-signature verification.
- Secrets only in managed environment variables; no production default verification token.
- Clear consent and privacy records for lead communication, health information, and progress photos.
- Private report/photo access, retention settings, export, correction, withdrawal, and deletion workflows.
- Audit events for authentication, customer access, consent, stage changes, financial changes, exports, and deletions.
- Encrypted transport, database backups, restoration testing, and monitored job failures.
- AI output is optional, labeled as non-clinical wellness guidance, reviewed by the coach before sharing, and covered by safety tests and provider-policy review.

## 9. Error Handling and Observability

API errors use a consistent structured format with a safe user message and trace identifier. The UI preserves entered data after recoverable failures and displays actionable retry guidance.

Integration failures are retried with bounded exponential backoff and dead-letter handling. Permanent failures create coach-visible alerts. Logging excludes message bodies, health details, access tokens, and other sensitive fields by default.

Operational health covers API latency/error rate, database availability, queue depth, failed jobs, webhook failures, automation lag, delivery results, and backup status. The existing hard-coded “System Online” label is replaced by real health signals.

## 10. Testing Strategy

- Unit tests for normalization, deduplication, stage rules, profit calculations, renewal dates, and automation conditions.
- Database/service integration tests for conversion, partial payments, refunds, historical pricing, and idempotency.
- API contract tests for validation, authorization, pagination, and error responses.
- Integration tests for WhatsApp, Meta Lead Ads, form ingestion, and failed-delivery recovery using provider fixtures.
- Browser tests for lead creation, pipeline movement, conversion, check-in entry, payment entry, profit reporting, settings, and responsive navigation.
- Accessibility checks for keyboard navigation, labels, focus management, dialogs, contrast, and status announcements.
- Security tests for unauthenticated access, cross-user data access, webhook forgery, injection, unsafe file access, rate limits, and sensitive logging.

Critical workflows must pass on desktop and mobile before a phase is released.

## 11. Delivery Phases

1. **Foundation** — migrations, authentication, authorization, responsive shell, API conventions, private storage, and repair of existing working features.
2. **Lead CRM** — ingestion adapters, deduplication, pipeline, lead profile, activities, appointments, tasks, and source attribution.
3. **Customer journey** — conversion transaction, onboarding, customer profile, check-ins, progress comparisons, photos, and documents.
4. **Commerce** — catalog, plans, orders, manual/partial payments, refunds, expenses, balances, and historical pricing.
5. **Automation** — rule engine, approval modes, WhatsApp templates, quiet hours, retry handling, renewals, recovery, and referrals.
6. **Intelligence** — Today dashboard, funnel analytics, campaign attribution, customer health, retention, renewal, revenue, and profit reports.
7. **Hardening** — full automated regression suite, accessibility, security review, performance tuning, backups, monitoring, deployment runbook, and documentation.

Each phase must be deployable and independently verifiable. New feature work pauses when a release-blocking data integrity, privacy, or financial calculation defect is open.

## 12. Acceptance Criteria

The first production release is complete when the coach can:

1. Receive and deduplicate leads from all four approved sources.
2. See every lead's source, campaign, activity history, stage, and next action.
3. Convert a won lead into a customer in one transaction.
4. Record and compare the complete optional wellness journey.
5. Configure coach reminders and approved WhatsApp automations.
6. Create orders, record partial/manual payments, and see accurate outstanding balances.
7. View customer-level and monthly cash profit without historical price drift.
8. Identify overdue follow-ups, inactive customers, pending payments, and upcoming renewals from Today.
9. Export required reports while keeping health documents and photos private.
10. Use all critical workflows on mobile and desktop with authenticated, audited access.

