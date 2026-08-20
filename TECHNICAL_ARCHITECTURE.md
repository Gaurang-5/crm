# Technical Architecture Document

## WhatsApp Lead & Sales CRM

## 1. Architecture Overview

```text
[ Dad's WhatsApp Status ]
          │  wa.me link tap
          ▼
[ Meta WhatsApp Cloud API ]  ── (separate API number from dad's personal WhatsApp)
          │  webhook POST
          ▼
[ Express Webhook Server ]  ── responds 200 OK immediately, no blocking work
          │  1. Idempotency check (dedupe message_id)
          │  2. Upsert lead + log event to Postgres
          │  3. Push outbound job to queue
          ▼
[ Redis / BullMQ Queue ]
          │
          ▼
[ Background Worker ]  ── calls Meta API to actually send replies/templates/lists
          │
          ▼
[ Lead's WhatsApp ]

[ Cron Scheduler ]  ── runs hourly, reads leads + settings from Postgres,
                       triggers no-show / silent recovery jobs into the same queue

[ Coach's WhatsApp ]  ── admin commands routed through the same webhook,
                         answered via the same queue/worker pipeline
```

## 2. Why This Shape

- Webhook and sending are decoupled. Meta requires a response within about 3 seconds; anything that calls an external API happens in a background worker, not inside the webhook handler.
- No custom frontend. The coach’s dashboard is WhatsApp text commands, backed by simple SQL queries. That removes an entire UI layer from scope and matches how the coach already works.
- Single source of truth in Postgres. Every lead, event, and setting lives in one relational database so `/stats` and `/brief` are just SQL queries, not a second system to sync.

## 3. Core Data Model

**leads**

column
notes

phone_number (PK)
unique identifier from Meta’s `from` field

display_name
WhatsApp profile name

goal
weight / energy / fitness — captured on first contact

funnel_state
NEW → GOAL_CAPTURED → INVITED → FOLLOWUP_SENT / RECOVERY_SENT → READY_FOR_COACH → PLAN_SELECTED → CLOSED / OPTED_OUT

last_inbound_at
used by the recovery cron to distinguish attended vs no-show

created_at / updated_at

**funnel_events**

column
notes

id (PK)

phone_number (FK)

event_type
e.g. INBOUND_MESSAGE, GOAL_CAPTURED, PLAN_SELECTED

metadata
JSON - free-form detail per event

created_at
powers `/stats` and `/brief`

**processed_webhooks**

column
notes

message_id (PK)
Meta’s message ID - guarantees idempotency if Meta redelivers a webhook

**settings**

column
notes

key (PK)
zoom_link, session_time, checkout_basic_url, checkout_pro_url

value
plain text - editable entirely via admin WhatsApp commands

## 4. Key Design Decisions

| Decision | Reasoning |
| --- | --- |
| Postgres over a NoSQL store | The funnel is inherently relational, so SQL makes `/stats` trivial |
| Redis + BullMQ for outbound sends | Prevents webhook timeouts and handles retries if Meta’s API rate-limits |
| Settings table instead of hardcoded config | Lets the coach change the Zoom link or checkout URLs without a redeploy |
| No Zoom API integration in v1 | Attendance is inferred from whether a lead messages again after the session start time |
| Admin commands via WhatsApp, not a web dashboard | Zero login, zero UI to design, coach already lives in WhatsApp all day |

## 5. Infrastructure & Cost

| Component | Provider | Est. Cost |
| --- | --- | --- |
| Database | Supabase (Postgres) | Free tier |
| Queue | Upstash (Redis) | Free tier |
| Web server + worker + cron | Railway (2-3 small services) | ~ $8-10/month |

**Total**

**~ $10/month**

## 6. Reliability Requirements

- Webhook must always return `200 OK` within 3 seconds, even on internal errors. Log failures, don’t let Meta retry into duplicate sends.
- Idempotency table prevents double-processing if Meta redelivers a webhook.
- Worker retries failed sends with exponential backoff to handle transient Meta API errors or rate limits.
- Cron job must be safe to run even if a previous run is still in progress. Use a last-run guard or a job lock.

## 7. Security

- All tokens live in environment variables, never in code.
- Admin commands are gated by a phone-number allowlist.
- Webhook verify token prevents unauthorized parties from registering a fake webhook.

## 8. What’s Deliberately Deferred (v2+)

- Zoom API attendance polling once a paid plan exists
- Multi-coach role-based routing if the team grows beyond mom + senior coach
- A read-only web dashboard if WhatsApp commands stop being sufficient at higher lead volume