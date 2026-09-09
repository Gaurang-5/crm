# Unified Website and Meeting Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Lifestyle Mantra landing page, tracked Zoom gateway, authenticated CRM, and shared API from one deployment and one URL.

**Architecture:** Keep the approved landing page as an isolated static Vite entry so its document-level CSS and interactions remain exact. Serve the React customer gateway and CRM from a second Vite entry, with Express public endpoints for lead capture and meeting events and authenticated endpoints for link management and reporting. PostgreSQL is authoritative; focused repositories provide an in-memory implementation for deterministic tests.

**Tech Stack:** TypeScript, Express 4, PostgreSQL, Zod, React 18, React Router 6, Vite 5, Vitest, Testing Library, Supertest, Playwright

**Spec:** `docs/superpowers/specs/2026-09-09-website-crm-meeting-tracker-design.md`

## Global Constraints

- `/` is the existing public Lifestyle Mantra landing page, `/join` is the tracked customer gateway, and `/crm/*` is the authenticated portal.
- The permanent `/join` URL remains unchanged when the coach replaces the underlying Zoom destination.
- A final **Open Zoom Meeting** click is the first-version attendance signal; do not claim verified Zoom attendance.
- A partial name or phone draft is retained for 30 days but does not create a CRM lead.
- Anonymous visits are retained for 90 days; do not store raw IP addresses or browser fingerprints.
- Zoom links remain active until the coach replaces or disables them; there is no automatic 24-hour expiry.
- Preserve the landing page's existing copy, sections, assets, motion, responsive behavior, and WhatsApp follow-through.
- Public APIs reveal the Zoom destination only after valid registration and the final join action.
- All CRM meeting endpoints require the existing session authentication.

---

### Task 1: Namespace the Existing CRM Under `/crm`

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/pages/Login.tsx`
- Modify: `web/src/components/layout/Sidebar.tsx`
- Modify: `web/src/pages/TodayPage.tsx`
- Modify: `web/src/pages/CustomersPage.tsx`
- Modify: `web/src/pages/CustomerDetailPage.tsx`
- Modify: `web/src/pages/LeadDetailPage.tsx`
- Modify: `web/src/pages/LeadsPage.tsx`
- Modify: `web/src/pages/PipelinePage.tsx`
- Test: `web/tests/routing/crmRoutes.test.tsx`
- Test: `web/tests/pages/Login.test.tsx`

**Interfaces:**
- Consumes: existing `Layout`, page components, and `react-router-dom` routes.
- Produces: authenticated route prefix `/crm`, canonical login success route `/crm/today`, and backward redirects from old CRM paths.

- [ ] **Step 1: Write failing route tests**

```tsx
// web/tests/routing/crmRoutes.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';

vi.mock('../../src/api/client', () => ({
  api: {
    getSession: vi.fn().mockResolvedValue({ coach: { name: 'Deepa', email: 'd@example.com' } }),
    getToday: vi.fn().mockResolvedValue({
      overdueTasks: [], appointmentsToday: [], newLeads: [], pendingPayments: [], renewalsDue: [], missedCheckins: [],
    }),
  },
}));

describe('CRM route namespace', () => {
  it('renders the coach dashboard below /crm', async () => {
    render(<MemoryRouter initialEntries={['/crm/today']}><App /></MemoryRouter>);
    expect(await screen.findByText("Today's Focus")).toBeInTheDocument();
  });

  it('redirects the legacy /today path to /crm/today', async () => {
    render(<MemoryRouter initialEntries={['/today']}><App /></MemoryRouter>);
    expect(await screen.findByText("Today's Focus")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused tests and confirm the new route fails**

Run: `npm run test:web -- --run web/tests/routing/crmRoutes.test.tsx web/tests/pages/Login.test.tsx`

Expected: FAIL because `/crm/today` is not registered and login still navigates to `/today`.

- [ ] **Step 3: Add the `/crm` route tree and backward redirects**

Use this route shape in `web/src/App.tsx`:

```tsx
<Route path="/login" element={<Login />} />
<Route path="/join" element={<div>Meeting access is loading.</div>} />
<Route path="/body-analysis" element={<BodyAnalysisReport />} />
<Route path="/report" element={<BodyAnalysisReport />} />
<Route path="/crm" element={<Layout />}>
  <Route index element={<Navigate to="today" replace />} />
  <Route path="today" element={<TodayPage />} />
  <Route path="leads" element={<LeadsPage />} />
  <Route path="leads/:phone" element={<LeadDetailPage />} />
  <Route path="pipeline" element={<PipelinePage />} />
  <Route path="customers" element={<CustomersPage />} />
  <Route path="customers/:id" element={<CustomerDetailPage />} />
  <Route path="followups" element={<FollowUpsPage />} />
  <Route path="analyses" element={<BodyAnalysisPage />} />
  <Route path="homevisit" element={<ConsumerHomevisitPage />} />
  <Route path="orders" element={<OrdersPaymentsPage />} />
  <Route path="revenue" element={<RevenueProfitPage />} />
  <Route path="campaigns" element={<CampaignsPage />} />
  <Route path="reports" element={<ReportsPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
<Route path="/today" element={<Navigate to="/crm/today" replace />} />
<Route path="/leads/*" element={<Navigate to="/crm/leads" replace />} />
<Route path="/pipeline" element={<Navigate to="/crm/pipeline" replace />} />
<Route path="/customers/*" element={<Navigate to="/crm/customers" replace />} />
<Route path="*" element={<Navigate to="/crm/today" replace />} />
```

Do not add `MeetingJoinPage` until Task 5; replace the temporary `/join` element in Task 5.

Change login success to `navigate('/crm/today')`. Prefix every CRM `NavLink`, `Link`, and `navigate()` target identified by `rg -n "to=.*\/|navigate\(" web/src` with `/crm` while leaving `/login`, `/join`, `/report`, `/body-analysis`, API URLs, WhatsApp URLs, and Zoom URLs unchanged.

- [ ] **Step 4: Run the route tests and TypeScript check**

Run: `npm run test:web -- --run web/tests/routing/crmRoutes.test.tsx web/tests/pages/Login.test.tsx && npx tsc -p web/tsconfig.json --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the route namespace**

```bash
git add web/src web/tests/routing web/tests/pages/Login.test.tsx
git commit -m "refactor: namespace coach portal routes"
```

---

### Task 2: Add the Meeting Tracker Schema and Repository

**Files:**
- Create: `server/src/db/migrations/003_meeting_tracker.sql`
- Create: `server/src/meetings/meeting.types.ts`
- Create: `server/src/meetings/meeting.repository.ts`
- Test: `server/tests/meetings/meeting.repository.test.ts`
- Modify: `server/src/shared/types.ts`

**Interfaces:**
- Consumes: `pool` and `useInMemory` from `db.ts`, existing `coaches` and `leads` tables.
- Produces: `MeetingLink`, `MeetingVisit`, `MeetingVisitEvent`, `MeetingSummary`, `MeetingVisitFilters`; repository functions `createOrResumeVisit`, `saveDraft`, `recordIntent`, `markRegistered`, `recordJoin`, `getActiveMeetingLink`, `replaceMeetingLink`, `disableMeetingLink`, `listMeetingLinks`, `getMeetingSummary`, `listMeetingVisits`, `getMeetingVisitDetail`, and `pruneExpiredMeetingVisits`.

- [ ] **Step 1: Write migration and repository tests**

```ts
// server/tests/meetings/meeting.repository.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createOrResumeVisit, saveDraft, recordIntent, markRegistered, recordJoin,
  replaceMeetingLink, getMeetingSummary, resetMeetingMemoryStore,
} from '../../src/meetings/meeting.repository';

describe('meeting repository', () => {
  beforeEach(() => resetMeetingMemoryStore());

  it('resumes a token without increasing unique visits', async () => {
    const first = await createOrResumeVisit({ tokenHash: 'a'.repeat(64), source: 'whatsapp' });
    const second = await createOrResumeVisit({ tokenHash: 'a'.repeat(64), source: 'whatsapp' });
    expect(second.visit.id).toBe(first.visit.id);
    expect((await getMeetingSummary({})).uniqueVisits).toBe(1);
    expect((await getMeetingSummary({})).totalVisits).toBe(2);
  });

  it('rejects a stale draft revision', async () => {
    await createOrResumeVisit({ tokenHash: 'b'.repeat(64) });
    await saveDraft('b'.repeat(64), { name: 'Dee', phone: '98', revision: 2 });
    const stale = await saveDraft('b'.repeat(64), { name: 'D', phone: '9', revision: 1 });
    expect(stale.draft_name).toBe('Dee');
    expect(stale.draft_revision).toBe(2);
  });

  it('keeps one active destination and idempotent funnel events', async () => {
    await replaceMeetingLink('coach_deepa', 'https://zoom.us/j/111');
    await replaceMeetingLink('coach_deepa', 'https://zoom.us/j/222');
    await createOrResumeVisit({ tokenHash: 'c'.repeat(64) });
    await recordIntent('c'.repeat(64));
    await recordIntent('c'.repeat(64));
    await markRegistered('c'.repeat(64), '919897258859');
    await recordJoin('c'.repeat(64));
    await recordJoin('c'.repeat(64));
    const summary = await getMeetingSummary({});
    expect(summary.intentClicks).toBe(1);
    expect(summary.joinClicks).toBe(1);
  });
});
```

- [ ] **Step 2: Run the repository tests and confirm failure**

Run: `npm run test:api -- --run server/tests/meetings/meeting.repository.test.ts`

Expected: FAIL because the meeting module and migration do not exist.

- [ ] **Step 3: Define the SQL schema**

Create `003_meeting_tracker.sql` with UUID values supplied by the application, a partial unique index for one active link, and idempotent event constraints:

```sql
CREATE TABLE meeting_links (
  id UUID PRIMARY KEY,
  destination_url TEXT NOT NULL,
  status VARCHAR(12) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_by VARCHAR(50) REFERENCES coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX one_active_meeting_link ON meeting_links (status) WHERE status = 'ACTIVE';

CREATE TABLE meeting_visits (
  id UUID PRIMARY KEY,
  public_token_hash CHAR(64) UNIQUE NOT NULL,
  meeting_link_id UUID REFERENCES meeting_links(id) ON DELETE SET NULL,
  lead_phone_number VARCHAR(30) REFERENCES leads(phone_number) ON DELETE SET NULL,
  draft_name VARCHAR(100),
  draft_phone VARCHAR(30),
  draft_revision INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'VISITED'
    CHECK (status IN ('VISITED','STARTED','DETAILS_INCOMPLETE','REGISTERED','JOINED')),
  source VARCHAR(100),
  campaign VARCHAR(100),
  referrer TEXT,
  device_category VARCHAR(20),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  intent_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX meeting_visits_status_date ON meeting_visits (status, first_seen_at DESC);
CREATE INDEX meeting_visits_phone ON meeting_visits (lead_phone_number);

CREATE TABLE meeting_visit_events (
  id BIGSERIAL PRIMARY KEY,
  meeting_visit_id UUID NOT NULL REFERENCES meeting_visits(id) ON DELETE CASCADE,
  event_type VARCHAR(24) NOT NULL CHECK (event_type IN ('VISIT','INTENT','DRAFT_SAVED','REGISTERED','JOINED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX meeting_singleton_events
  ON meeting_visit_events (meeting_visit_id, event_type)
  WHERE event_type IN ('INTENT','REGISTERED','JOINED');
CREATE INDEX meeting_events_visit_date ON meeting_visit_events (meeting_visit_id, created_at);
```

- [ ] **Step 4: Implement typed PostgreSQL and in-memory repository paths**

Define exact status and summary types in `meeting.types.ts`:

```ts
export type MeetingVisitStatus = 'VISITED' | 'STARTED' | 'DETAILS_INCOMPLETE' | 'REGISTERED' | 'JOINED';
export interface MeetingSummary {
  totalVisits: number;
  uniqueVisits: number;
  intentClicks: number;
  registrations: number;
  joinClicks: number;
}
export interface MeetingVisitFilters { from?: string; to?: string; status?: MeetingVisitStatus; search?: string; }
```

Each repository function must branch on `pool && !useInMemory`. Use `crypto.randomUUID()` for row IDs. `createOrResumeVisit` inserts a `VISIT` event on every call, so total page views can exceed unique visitors. Define `markRegistered(tokenHash: string, phone: string)` and reject `recordJoin` when the visit is not registered. `replaceMeetingLink` must acquire a transaction client, deactivate the current row, insert the new active row, log an audit event, and commit. In-memory arrays must enforce the same status transitions and event idempotency. Export `resetMeetingMemoryStore()` only for the test runtime and throw unless `NODE_ENV === 'test'` or `APP_RUNTIME_MODE === 'test'`.

- [ ] **Step 5: Run repository and migration tests**

Run: `npm run test:api -- --run server/tests/meetings/meeting.repository.test.ts server/tests/db/migration.test.ts`

Expected: PASS and migration `003_meeting_tracker` appears after `002_operating_system`.

- [ ] **Step 6: Commit the data layer**

```bash
git add server/src/db/migrations/003_meeting_tracker.sql server/src/meetings server/src/shared/types.ts server/tests/meetings
git commit -m "feat: add meeting tracker data model"
```

---

### Task 3: Implement Public Lead and Meeting APIs

**Files:**
- Create: `server/src/leads/public-lead.routes.ts`
- Create: `server/src/meetings/meeting.validation.ts`
- Create: `server/src/meetings/meeting.service.ts`
- Create: `server/src/meetings/meeting.public.routes.ts`
- Modify: `server/src/app.ts`
- Test: `server/tests/leads/public-lead.routes.test.ts`
- Test: `server/tests/meetings/meeting.public.routes.test.ts`

**Interfaces:**
- Consumes: `ingestLead(input)`, meeting repository functions from Task 2, `normalizePhone(raw)`.
- Produces: `POST /api/public/leads`, `GET /api/public/meetings/status`, and visit, intent, draft, register, and join endpoints under `/api/public/meetings`.

- [ ] **Step 1: Write failing public API tests**

```ts
// server/tests/meetings/meeting.public.routes.test.ts
it('never returns the destination before registration and final join', async () => {
  await replaceMeetingLink('coach_deepa', 'https://zoom.us/j/123456');
  const token = '7f1f40b0-22f1-4d53-92fc-8f8fffe31b2d';
  const visit = await request(app).post('/api/public/meetings/visits').send({ visitorToken: token }).expect(201);
  expect(JSON.stringify(visit.body)).not.toContain('123456');
  await request(app).post(`/api/public/meetings/visits/${token}/intent`).expect(200);
  await request(app).patch(`/api/public/meetings/visits/${token}/draft`)
    .send({ name: 'Asha', phone: '98', revision: 1 }).expect(200);
  await request(app).post(`/api/public/meetings/visits/${token}/register`)
    .send({ name: 'Asha Jain', phone: '9897258859' }).expect(200);
  const joined = await request(app).post(`/api/public/meetings/visits/${token}/join`).expect(200);
  expect(joined.body.destinationUrl).toBe('https://zoom.us/j/123456');
});

it('does not create a lead for an unfinished draft', async () => {
  const token = 'a32b90f2-b06d-4121-b043-acde12c10a12';
  await request(app).post('/api/public/meetings/visits').send({ visitorToken: token }).expect(201);
  await request(app).patch(`/api/public/meetings/visits/${token}/draft`)
    .send({ name: 'Rah', phone: '9897', revision: 1 }).expect(200);
  expect(await getLead('9897')).toBeNull();
});
```

Add a landing ingestion test that submits `{ name, phone, city, goal }`, expects `201`, and verifies `campaign_name === 'Website Consultation'` and `interest_topic === goal`.

- [ ] **Step 2: Run the new public API tests and confirm failure**

Run: `npm run test:api -- --run server/tests/leads/public-lead.routes.test.ts server/tests/meetings/meeting.public.routes.test.ts`

Expected: FAIL because the public routers are missing.

- [ ] **Step 3: Add exact validation and token helpers**

```ts
// server/src/meetings/meeting.validation.ts
import { createHash } from 'crypto';
import { z } from 'zod';

export const visitorTokenSchema = z.string().uuid();
export const draftSchema = z.object({
  name: z.string().trim().max(100).default(''),
  phone: z.string().trim().max(30).default(''),
  revision: z.number().int().min(1),
});
export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(30),
});
export const hashVisitToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function parseZoomUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !(url.hostname === 'zoom.us' || url.hostname.endsWith('.zoom.us'))) throw new Error();
    return url.toString();
  } catch {
    throw Object.assign(new Error('Enter a valid Zoom HTTPS link'), { status: 400, code: 'INVALID_INPUT' });
  }
}
```

Use Zod safe parsing in every route and return the existing `{ error: { code, message } }` shape.

- [ ] **Step 4: Implement public services and routers**

Move the existing inline `/api/public/lead` handler from `server/src/app.ts` into `public-lead.routes.ts`. Register both `/leads` as the canonical route and `/lead` as a backward-compatible alias using the same handler.

`registerVisit(token, input)` must call `ingestLead` with:

```ts
{
  phone: normalizedPhone,
  name: input.name,
  channel: 'web_form',
  campaignName: 'Zoom Link Tracker',
  interestTopic: 'Wellness Zoom Session',
  rawPayload: { meetingVisitId: visit.id },
  consentGiven: true,
}
```

`POST /api/public/meetings/visits/:visitToken/join` must return `409 MEETING_UNAVAILABLE` when no link is active and otherwise return `{ destinationUrl, joinedAt }`. Mount public routers before `app.use('/api', requireAuth, ...)`. Apply route-specific rate limiters: 60 visit/status requests per 15 minutes and 30 draft/intent/register/join requests per 15 minutes per network key.

- [ ] **Step 5: Run public API tests and the security suite**

Run: `npm run test:api -- --run server/tests/leads/public-lead.routes.test.ts server/tests/meetings/meeting.public.routes.test.ts server/tests/app/security.test.ts`

Expected: PASS; protected CRM routes still return `401` without a session.

- [ ] **Step 6: Commit the public APIs**

```bash
git add server/src/app.ts server/src/leads/public-lead.routes.ts server/src/meetings server/tests/leads server/tests/meetings
git commit -m "feat: add public lead and meeting tracking APIs"
```

---

### Task 4: Implement Authenticated Link Management, Analytics, and Retention

**Files:**
- Create: `server/src/meetings/meeting.admin.routes.ts`
- Create: `server/src/meetings/meeting.maintenance.routes.ts`
- Create: `server/src/shared/async-handler.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/config/env.ts`
- Modify: `.env.example`
- Modify: `vercel.json`
- Test: `server/tests/meetings/meeting.admin.routes.test.ts`
- Test: `server/tests/meetings/meeting.maintenance.routes.test.ts`

**Interfaces:**
- Consumes: repository summary, list, detail, link replacement, disable, and prune functions from Task 2; `parseZoomUrl` from Task 3; existing `requireAuth`.
- Produces: authenticated `/api/meetings/*` API and a daily protected `/api/maintenance/meeting-visits` retention endpoint.

- [ ] **Step 1: Write failing authentication, replacement, analytics, and pruning tests**

```ts
async function loginCoach(app: Express) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'coach@example.com', password: 'Correct-Horse-2026' }).expect(200);
  return agent;
}

it('protects meeting administration and replaces the active link', async () => {
  await request(app).get('/api/meetings/summary').expect(401);
  const agent = await loginCoach(app);
  await agent.post('/api/meetings/links').send({ destinationUrl: 'https://zoom.us/j/111' }).expect(201);
  await agent.post('/api/meetings/links').send({ destinationUrl: 'https://zoom.us/j/222' }).expect(201);
  const links = await agent.get('/api/meetings/links').expect(200);
  expect(links.body.filter((link: any) => link.status === 'ACTIVE')).toHaveLength(1);
  expect(links.body[0].destination_url).toContain('/222');
});

it('requires the cron secret and prunes only expired records', async () => {
  await request(app).post('/api/maintenance/meeting-visits').expect(401);
  const response = await request(app).post('/api/maintenance/meeting-visits')
    .set('authorization', 'Bearer retention-test-secret').expect(200);
  expect(response.body).toEqual({ pruned: expect.any(Number) });
});
```

- [ ] **Step 2: Run the admin API tests and confirm failure**

Run: `npm run test:api -- --run server/tests/meetings/meeting.admin.routes.test.ts server/tests/meetings/meeting.maintenance.routes.test.ts`

Expected: FAIL because the routes are not registered.

- [ ] **Step 3: Implement authenticated routes**

Add this shared adapter so rejected route promises reach the existing error middleware:

```ts
// server/src/shared/async-handler.ts
import { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void Promise.resolve(handler(req, res, next)).catch(next);
};
```

In `meeting.admin.routes.ts`, define `parseFilters(query)` with a Zod object accepting optional ISO `from`, ISO `to`, one of the five meeting statuses, and a trimmed 100-character `search` string. Return `400 INVALID_INPUT` when filter parsing fails. Add routes with these exact response contracts:

```ts
router.get('/summary', asyncHandler(async (req, res) => {
  res.json(await getMeetingSummary(parseFilters(req.query)));
}));
router.get('/visits', asyncHandler(async (req, res) => {
  res.json(await listMeetingVisits(parseFilters(req.query)));
}));
router.get('/visits/:id', asyncHandler(async (req, res) => {
  const detail = await getMeetingVisitDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting visit not found' } });
  res.json(detail);
}));
router.get('/links', asyncHandler(async (_req, res) => res.json(await listMeetingLinks())));
router.post('/links', asyncHandler(async (req, res) => {
  const destinationUrl = parseZoomUrl(req.body.destinationUrl);
  res.status(201).json(await replaceMeetingLink((req as any).coach.id, destinationUrl));
}));
router.post('/links/:id/disable', asyncHandler(async (req, res) => {
  res.json(await disableMeetingLink(req.params.id, (req as any).coach.id));
}));
```

Mount with `app.use('/api/meetings', requireAuth, meetingAdminRouter)`.

- [ ] **Step 4: Add the retention endpoint and daily Vercel schedule**

Add `CRON_SECRET` as an optional environment variable that is required by the maintenance route. Reject a missing or mismatched `Authorization: Bearer <CRON_SECRET>` header. Call `pruneExpiredMeetingVisits({ anonymousDays: 90, draftDays: 30 })`. Add this deployment schedule:

```json
"crons": [{ "path": "/api/maintenance/meeting-visits", "schedule": "20 2 * * *" }]
```

The route accepts both GET, for Vercel Cron, and POST, for deterministic tests. Set `CRON_SECRET=replace-with-a-long-random-value` in `.env.example`.

- [ ] **Step 5: Run admin, retention, and full API tests**

Run: `npm run test:api`

Expected: all API tests pass.

- [ ] **Step 6: Commit administration and retention**

```bash
git add server/src/app.ts server/src/config/env.ts server/src/meetings .env.example vercel.json server/tests/meetings
git commit -m "feat: add meeting administration and retention"
```

---

### Task 5: Build the Luxury Customer Meeting Gateway

**Files:**
- Create: `web/src/features/meetings/meetingApi.ts`
- Create: `web/src/features/meetings/meetingTypes.ts`
- Create: `web/src/features/meetings/useMeetingVisit.ts`
- Create: `web/src/features/meetings/MeetingJoinPage.tsx`
- Create: `web/src/features/meetings/meeting-join.css`
- Create: `web/src/assets/meeting-gateway-concept.png`
- Modify: `web/src/App.tsx`
- Test: `web/tests/meetings/MeetingJoinPage.test.tsx`

**Interfaces:**
- Consumes: Task 3 public meeting API contracts.
- Produces: `/join` states `loading`, `invite`, `details`, `ready`, and `unavailable`; local keys `lm-meeting-visitor-v1` and `lm-meeting-profile-v1`.

- [ ] **Step 1: Generate and inspect the complete visual concept**

Use the frontend-app-builder and imagegen skills to create a 390×844 mobile concept covering the initial invitation, details form, ready state, and unavailable state in one coherent art direction. Save the accepted concept to `web/src/assets/meeting-gateway-concept.png`. Use Lifestyle Mantra's Playfair/Inter typography, white and pale-neutral surfaces, restrained emerald accents, subtle glass, generous negative space, and one focal action per state. Do not add marketing claims or unrelated content.

- [ ] **Step 2: Write failing interaction tests**

```tsx
it('tracks intent, autosaves a draft, registers, then requests the destination', async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<MeetingJoinPage />);
  await user.click(await screen.findByRole('button', { name: 'Join Zoom' }));
  expect(api.recordIntent).toHaveBeenCalledTimes(1);
  await user.type(screen.getByLabelText('Full name'), 'Asha Jain');
  await user.type(screen.getByLabelText('Phone / WhatsApp number'), '9897258859');
  await vi.advanceTimersByTimeAsync(900);
  expect(api.saveDraft).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Asha Jain', revision: expect.any(Number) }));
  await user.click(screen.getByRole('button', { name: 'Continue to meeting' }));
  expect(await screen.findByRole('button', { name: 'Open Zoom Meeting' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Open Zoom Meeting' }));
  expect(api.joinMeeting).toHaveBeenCalledTimes(1);
});
```

Also test unavailable state, retained input after registration failure, prefilled returning profile, and reduced-motion class behavior.

- [ ] **Step 3: Run the component tests and confirm failure**

Run: `npm run test:web -- --run web/tests/meetings/MeetingJoinPage.test.tsx`

Expected: FAIL because the feature does not exist.

- [ ] **Step 4: Implement the typed API and visit hook**

Define `MeetingPublicStatus`, `MeetingVisitStage`, `MeetingRegistration`, and `MeetingJoinResult` in `meetingTypes.ts`. `MeetingJoinResult` is exactly `{ destinationUrl: string; joinedAt: string }`; the pre-registration types contain no destination field.

`getVisitorToken()` must create one UUID with `crypto.randomUUID()` and persist it. `useMeetingVisit` creates or resumes a visit on mount, records intent once, debounces draft saves by 800 ms, aborts superseded draft requests, increments `revision`, retains form values on errors, and stores the confirmed profile only after successful registration.

The final handler must wait for `joinMeeting(token)`, then execute `window.location.assign(destinationUrl)` so metrics are recorded before leaving. Disable the final button while the request is active to prevent duplicate navigation.

- [ ] **Step 5: Implement the accessible visual states**

Use one semantic `<main>` and one visible `<h1>`. Buttons must be at least 48 px high on mobile. Inputs use `autocomplete="name"` and `autocomplete="tel"`; progress and save feedback use a polite ARIA live region. CSS must implement focus-visible outlines, 390 px and 1440 px layouts, and `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 6: Run meeting UI tests and TypeScript**

Run: `npm run test:web -- --run web/tests/meetings/MeetingJoinPage.test.tsx && npx tsc -p web/tsconfig.json --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Render and compare the first viewport**

Run the Vite and API servers, open `/join` in the browser at 390×844 and 1440×900, and capture screenshots. Inspect the concept and both renders with `view_image`. Fix copy, type scale, first-viewport balance, palette, spacing, control sizing, focus, and state transitions until no material mismatch remains.

- [ ] **Step 8: Commit the customer gateway**

```bash
git add web/src/features/meetings web/src/assets/meeting-gateway-concept.png web/src/App.tsx web/tests/meetings
git commit -m "feat: add tracked customer meeting gateway"
```

---

### Task 6: Build the CRM Meeting Tracker Page

**Files:**
- Create: `web/src/features/meetings/MeetingTrackerPage.tsx`
- Create: `web/src/features/meetings/MeetingLinkPanel.tsx`
- Create: `web/src/features/meetings/MeetingFunnel.tsx`
- Create: `web/src/features/meetings/MeetingVisitsTable.tsx`
- Create: `web/src/features/meetings/MeetingVisitDrawer.tsx`
- Create: `web/src/features/meetings/meeting-admin.css`
- Modify: `web/src/api/client.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/layout/Sidebar.tsx`
- Modify: `web/src/components/ui/Icons.tsx`
- Test: `web/tests/meetings/MeetingTrackerPage.test.tsx`

**Interfaces:**
- Consumes: Task 4 authenticated summary, visit, detail, link list, link replacement, and disable endpoints.
- Produces: `/crm/meetings`, `api.getMeetingSummary`, `api.getMeetingVisits`, `api.getMeetingVisit`, `api.getMeetingLinks`, `api.replaceMeetingLink`, and `api.disableMeetingLink`.

- [ ] **Step 1: Write failing CRM page tests**

```tsx
it('shows the funnel, filters visits, and replaces the destination', async () => {
  const user = userEvent.setup();
  render(<MeetingTrackerPage />);
  expect(await screen.findByText('Meeting Tracker')).toBeInTheDocument();
  expect(screen.getByText('42')).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Status'), 'DETAILS_INCOMPLETE');
  expect(api.getMeetingVisits).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'DETAILS_INCOMPLETE' }));
  await user.click(screen.getByRole('button', { name: 'Replace Link' }));
  await user.type(screen.getByLabelText('New Zoom link'), 'https://zoom.us/j/987');
  await user.click(screen.getByRole('button', { name: 'Save New Link' }));
  expect(api.replaceMeetingLink).toHaveBeenCalledWith('https://zoom.us/j/987');
});
```

Add tests for copy-link feedback, WhatsApp share URL, disabled link state, masked destination, status labels, and opening the visit timeline drawer.

- [ ] **Step 2: Run the page tests and confirm failure**

Run: `npm run test:web -- --run web/tests/meetings/MeetingTrackerPage.test.tsx`

Expected: FAIL because the tracker components and client methods are missing.

- [ ] **Step 3: Add typed API client methods**

Add these shared types and query helper beside the API client methods:

```ts
export interface MeetingFilters {
  from?: string;
  to?: string;
  status?: 'VISITED' | 'STARTED' | 'DETAILS_INCOMPLETE' | 'REGISTERED' | 'JOINED';
  search?: string;
}

const toQuery = (filters: MeetingFilters) => {
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== '');
  return new URLSearchParams(entries as [string, string][]).toString();
};
```

```ts
getMeetingSummary: (filters: MeetingFilters) => apiRequest(`/api/meetings/summary?${toQuery(filters)}`),
getMeetingVisits: (filters: MeetingFilters) => apiRequest(`/api/meetings/visits?${toQuery(filters)}`),
getMeetingVisit: (id: string) => apiRequest(`/api/meetings/visits/${id}`),
getMeetingLinks: () => apiRequest('/api/meetings/links'),
replaceMeetingLink: (destinationUrl: string) => apiRequest('/api/meetings/links', {
  method: 'POST', body: JSON.stringify({ destinationUrl }),
}),
disableMeetingLink: (id: string) => apiRequest(`/api/meetings/links/${id}/disable`, { method: 'POST' }),
```

Build query strings with `URLSearchParams`, omitting undefined and empty values.

- [ ] **Step 4: Implement focused CRM components**

`MeetingLinkPanel` owns replacement and disable actions. `MeetingFunnel` renders Visit → Intent → Registered → Joined counts and percentages with semantic labels, not a chart dependency. `MeetingVisitsTable` owns filters and rows. `MeetingVisitDrawer` fetches and renders the selected chronological event timeline. `MeetingTrackerPage` starts summary, links, and visit requests together with `Promise.all` and passes results down.

Use the permanent URL `${window.location.origin}/join`. The WhatsApp share action uses `https://wa.me/?text=${encodeURIComponent(message)}`. Show the full active destination only inside the edit modal; show a masked host and meeting suffix in the main panel.

- [ ] **Step 5: Add navigation and responsive styles**

Add a production-quality video/meeting SVG as `Icons.Meetings`, add `{ path: '/crm/meetings', label: 'Meeting Tracker', icon: <Icons.Meetings size={18} /> }` after Pipeline in `navItems`, and add the `/crm/meetings` route. At widths below 760 px, stack summary cards, make the visit table horizontally scrollable, and render the detail drawer full-screen.

- [ ] **Step 6: Run focused and complete web tests**

Run: `npm run test:web -- --run web/tests/meetings/MeetingTrackerPage.test.tsx && npm run test:web`

Expected: all web tests pass.

- [ ] **Step 7: Browser-check the CRM workflow**

At desktop and mobile widths, log in, open `/crm/meetings`, copy the public URL, replace the Zoom link, filter incomplete visits, and open a timeline. Confirm the page remains readable with empty data and at least 50 seeded rows.

- [ ] **Step 8: Commit the CRM page**

```bash
git add web/src/features/meetings web/src/api/client.ts web/src/App.tsx web/src/components web/tests/meetings
git commit -m "feat: add CRM meeting tracker dashboard"
```

---

### Task 7: Merge the Existing Landing Page Into the Unified Build

**Files:**
- Rename: `web/index.html` to `web/app.html`
- Create: `web/index.html`
- Create: `web/public/marketing/script.js`
- Create: `web/public/marketing/style.css`
- Create: `web/public/marketing/glass-hero.css`
- Create: `web/public/marketing/motion.css`
- Create: `web/public/marketing/sculpture.css`
- Create: `web/public/marketing/journey.css`
- Create: `web/public/marketing/journey-overrides.css`
- Create: `web/public/marketing/human-journey.css`
- Create: `web/public/marketing/assets/*`
- Modify: `web/vite.config.ts`
- Modify: `server/src/app.ts`
- Modify: `vercel.json`
- Test: `web/tests/landing/landing-entry.test.ts`
- Test: `server/tests/app/static-routing.test.ts`

**Interfaces:**
- Consumes: approved landing sources from `/Users/gaurangbhatia/Desktop/Projects/hl`, Task 3 `POST /api/public/leads`, and Task 1 React entry routes.
- Produces: Vite outputs `dist/web/index.html` for `/` and `dist/web/app.html` for `/join`, `/login`, `/report`, `/body-analysis`, and `/crm/*`.

- [ ] **Step 1: Write failing entry and form tests**

```ts
it('keeps the complete landing content and submits to the CRM before WhatsApp', async () => {
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../../public/marketing/script.js', import.meta.url), 'utf8');
  expect(html).toContain('Vibrant Wellness');
  expect(html).toContain('id="client-results"');
  expect(html).toContain('id="reels"');
  expect(html).toContain('id="apply"');
  expect(script).toContain("fetch('/api/public/leads'");
  expect(script.indexOf("fetch('/api/public/leads'")).toBeLessThan(script.indexOf('window.location.assign'));
});
```

The server routing test builds a temporary `dist/web` with `index.html` and `app.html`, then asserts `/` serves the landing entry and `/crm/today`, `/join`, and `/login` serve the React entry.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm run test:web -- --run web/tests/landing/landing-entry.test.ts && npm run test:api -- --run server/tests/app/static-routing.test.ts`

Expected: FAIL because the app still has one HTML entry.

- [ ] **Step 3: Copy the approved landing source into isolated paths**

Copy `index.html` to `web/index.html`, all seven landing CSS files and `script.js` to `web/public/marketing/`, and the full `assets/` directory to `web/public/marketing/assets/`. Update landing references from local filenames to `/marketing/<filename>` and `assets/` to `/marketing/assets/`. Keep all visible copy, remote video, transformation image order, Instagram embeds, and accessibility attributes unchanged.

Rename the existing React `web/index.html` to `web/app.html`; keep its React module script unchanged.

- [ ] **Step 4: Change the consultation form to save before WhatsApp**

Replace only the existing form handler with an async handler that:

```js
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  const payload = Object.fromEntries(new FormData(form));
  submitButton.disabled = true;
  note.textContent = 'Saving your consultation request…';
  try {
    const response = await fetch('/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: payload.name, phone: payload.phone, city: payload.city, goal: payload.goal }),
    });
    if (!response.ok) throw new Error('Unable to save your request');
    const message = `New Lifestyle Mantra consultation request\n\nName: ${payload.name}\nPhone / WhatsApp: ${payload.phone}\nCity: ${payload.city}\nPrimary wellness goal: ${payload.goal}`;
    window.location.assign(`https://wa.me/919897258859?text=${encodeURIComponent(message)}`);
    note.textContent = 'Your request is saved. Continue in WhatsApp.';
    form.reset();
  } catch {
    note.textContent = 'We could not save your request. Please retry.';
  } finally {
    submitButton.disabled = false;
  }
});
```

Use a visible error class and keep entered fields on failure.

- [ ] **Step 5: Configure two Vite entry points and local route rewriting**

Set Rollup input to `{ landing: resolve(webRoot, 'index.html'), app: resolve(webRoot, 'app.html') }`. Add a `configureServer` middleware that rewrites requests beginning with `/crm`, `/join`, `/login`, `/report`, or `/body-analysis` to `/app.html`, while `/` continues to load `index.html`.

In `vercel.json`, keep API rewrites first, then map the same React route prefixes to `/app.html`; let `/` and `/marketing/*` resolve as static files. Update Express production fallback to choose `app.html` for the React route prefixes and `index.html` for `/`.

- [ ] **Step 6: Preserve and run the landing regression tests**

Port the two existing Node tests from `/Users/gaurangbhatia/Desktop/Projects/hl/tests` into `web/tests/landing`, adjusting file paths to `web/index.html` and `web/public/marketing`. Run:

`npm run test:web -- --run web/tests/landing && npm run build`

Expected: the original testimonial and Instagram guarantees pass and the build emits both HTML entries.

- [ ] **Step 7: Browser-compare the unified landing page**

Capture `/` at the same desktop and mobile dimensions used for the existing site. Compare against the current deployed/local source screenshots with `view_image`. Verify the hero, next-section preview, navigation, transformation images, reels, enquiry form, typography, asset framing, motion, and mobile horizontal reels. Repair every material regression.

- [ ] **Step 8: Commit the unified landing build**

```bash
git add web/index.html web/app.html web/public/marketing web/vite.config.ts web/tests/landing server/src/app.ts server/tests/app/static-routing.test.ts vercel.json
git commit -m "feat: merge landing page into CRM deployment"
```

---

### Task 8: Verify the Complete Cross-Surface Journey and Document Operations

**Files:**
- Create: `tests/e2e/unified-funnel.spec.ts`
- Create: `playwright.config.ts`
- Modify: `README.md`
- Modify: `TECHNICAL_ARCHITECTURE.md`
- Modify: `docs/superpowers/specs/2026-09-09-website-crm-meeting-tracker-design.md`

**Interfaces:**
- Consumes: every route and UI from Tasks 1-7.
- Produces: release evidence, coach operating instructions, and updated architecture documentation.

- [ ] **Step 1: Write the end-to-end acceptance test**

```ts
async function loginAsCoach(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Username or Email').fill('admin');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/crm/today');
}

test('website enquiry and meeting journey appear in the CRM', async ({ page, context }) => {
  await context.route('https://wa.me/**', route => route.abort());
  await context.route('https://zoom.us/**', route => route.abort());
  await context.route('https://*.zoom.us/**', route => route.abort());
  await page.goto('/');
  await page.locator('input[name="name"]').fill('E2E Visitor');
  await page.locator('input[name="phone"]').fill('9897258859');
  await page.locator('input[name="city"]').fill('Dehradun');
  await page.locator('select[name="goal"]').selectOption({ label: 'Energy & Vitality' });
  const whatsappNavigation = page.waitForRequest(request => request.url().startsWith('https://wa.me/'));
  await page.getByRole('button', { name: /Apply for a Private Consultation/i }).click();
  expect((await whatsappNavigation).url()).toContain('Lifestyle%20Mantra');

  await page.goto('/join');
  await page.getByRole('button', { name: 'Join Zoom' }).click();
  await page.getByLabel('Full name').fill('E2E Visitor');
  await page.getByLabel('Phone / WhatsApp number').fill('9897258859');
  await page.getByRole('button', { name: 'Continue to meeting' }).click();

  const destinationRequest = page.waitForResponse(/\/api\/public\/meetings\/visits\/.+\/join/);
  await page.getByRole('button', { name: 'Open Zoom Meeting' }).click();
  expect((await destinationRequest).ok()).toBe(true);

  const crm = await context.newPage();
  await loginAsCoach(crm);
  await crm.goto('/crm/meetings');
  await expect(crm.getByText('E2E Visitor')).toBeVisible();
  await expect(crm.getByText('Joined')).toBeVisible();
});
```

Use route interception for the external WhatsApp and Zoom navigations so the test does not contact those services. Seed the active test Zoom link through the authenticated API.

Create `playwright.config.ts` with `testDir: './tests/e2e'`, `baseURL: 'http://127.0.0.1:5173'`, and two web servers: `npm run dev:api` on port 3000 and `npm run dev:web` on port 5173. Set `APP_RUNTIME_MODE=test` and the existing development-safe environment values on the API server command so the suite uses in-memory storage.

- [ ] **Step 2: Run the test and repair integration failures**

Run: `npm run test:e2e -- tests/e2e/unified-funnel.spec.ts`

Expected: PASS through landing save, WhatsApp handoff, meeting registration, join tracking, and CRM visibility.

- [ ] **Step 3: Update coach-facing documentation**

Document these exact operating steps in `README.md`:

1. Sign in at `/login`.
2. Open `/crm/meetings`.
3. Paste the Zoom link from the WhatsApp group into **Replace Link**.
4. Copy the permanent `/join` URL once and continue sharing it.
5. Use the status and date filters to review visits, incomplete details, registrations, and join clicks.
6. Disable meeting access only when no customer should be sent to Zoom.

Document `CRON_SECRET`, the 30-day draft retention, 90-day anonymous retention, and the meaning of “Joined.” Update the architecture diagram to include Landing → Public Lead API → Leads and `/join` → Meeting APIs → Tracker tables → CRM.

- [ ] **Step 4: Mark the written specification implemented**

Change the spec status to `Implemented and verified` only after all checks in Step 5 pass. Add a short implementation-notes section recording the static landing entry and React app entry filenames.

- [ ] **Step 5: Run the release verification once**

Run: `npm test && npm run build && npm run test:e2e -- tests/e2e/unified-funnel.spec.ts && git diff --check`

Expected: all tests pass, both frontend entries build, the end-to-end funnel passes, and `git diff --check` prints no errors.

- [ ] **Step 6: Complete visual fidelity QA**

Capture final screenshots for landing desktop/mobile, meeting invitation/details/ready/unavailable at 390×844 and 1440×900, and CRM meeting overview/detail at desktop/mobile. Inspect the accepted meeting concept and latest renders with `view_image`. Record at least five comparisons for copy, layout, typography, palette, spacing, asset treatment, responsive behavior, and motion. Confirm the above-the-fold landing copy is unchanged and list any intentional deviation; fix every unintentional mismatch.

- [ ] **Step 7: Commit final verification and documentation**

```bash
git add tests/e2e playwright.config.ts README.md TECHNICAL_ARCHITECTURE.md docs/superpowers/specs/2026-09-09-website-crm-meeting-tracker-design.md
git commit -m "test: verify unified customer funnel"
```
