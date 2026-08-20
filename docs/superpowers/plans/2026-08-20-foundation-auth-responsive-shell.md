# Foundation, Authentication, and Responsive Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, testable foundation for the single-coach operating system while preserving the existing WhatsApp, analysis, customer-intake, and profit logic.

**Architecture:** Split the current root-level Express application into an `api/` TypeScript service and a Vite/React `web/` client. PostgreSQL migrations become authoritative, authenticated `/api/*` routes replace the open dashboard API, and a responsive application shell provides stable feature boundaries for later CRM phases.

**Tech Stack:** Node.js 20, TypeScript 5, Express 4, PostgreSQL, Redis/BullMQ, React 18, Vite 5, React Router 6, TanStack Query 5, Zod 3, Vitest, Supertest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-20-single-coach-operating-system-design.md`

## Global Constraints

- Phase one supports exactly one independent coach; no team, territory, or commission features.
- Existing WhatsApp workflows, AI analysis, PDF generation, home-visit intake, and profit calculations must remain operational during migration.
- PostgreSQL is the only production source of truth; in-memory storage is allowed only when `APP_RUNTIME_MODE=test`.
- All dashboard APIs require an authenticated coach session; Meta webhook routes remain signature-verified public endpoints.
- Customer health reports and photos must not be served from a public static directory.
- Mobile critical workflows must work at 390x844; desktop critical workflows must work at 1440x900.
- Every task follows red-green-refactor TDD and ends with its own reviewable commit when Git is available.

## Planned File Structure

```text
api/
  src/app.ts                    Express middleware and route composition
  src/server.ts                 startup and graceful shutdown only
  src/config/env.ts             validated environment configuration
  src/db/pool.ts                PostgreSQL pool
  src/db/migrate.ts             migration runner
  src/db/migrations/001_base.sql
  src/auth/auth.repository.ts   coach credential/session persistence
  src/auth/auth.service.ts      password and session rules
  src/auth/auth.routes.ts       login/logout/session endpoints
  src/auth/require-auth.ts      API authorization middleware
  src/health/health.routes.ts   real readiness status
  src/legacy/legacy.routes.ts   temporary adapter around existing services
  src/shared/errors.ts          typed errors and response mapping
  src/shared/validate.ts        Zod request validation
  tests/
web/
  src/app/App.tsx               route tree and providers
  src/app/AppShell.tsx          responsive navigation shell
  src/app/navigation.ts         route metadata
  src/api/client.ts             authenticated JSON client
  src/features/auth/LoginPage.tsx
  src/features/today/TodayPage.tsx
  src/features/legacy/LegacyOverviewPage.tsx
  src/styles/tokens.css
  src/styles/global.css
  tests/
e2e/foundation.spec.ts
```

---

### Task 1: Workspace and test harness

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `api/tsconfig.json`
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `vitest.config.ts`
- Create: `api/tests/smoke.test.ts`
- Create: `web/tests/setup.ts`

**Interfaces:**
- Produces: root scripts `dev`, `build`, `test`, `test:api`, `test:web`, and `test:e2e`.
- Produces: TypeScript path aliases `@api/*` and `@web/*`.

- [ ] **Step 1: Write the failing workspace smoke test**

```ts
// api/tests/smoke.test.ts
import { describe, expect, it } from 'vitest';

describe('workspace', () => {
  it('runs API TypeScript tests', () => expect(process.version.startsWith('v20.')).toBe(true));
});
```

- [ ] **Step 2: Run the test before configuring Vitest**

Run: `npm run test:api -- --run api/tests/smoke.test.ts`

Expected: FAIL because `test:api` is not defined.

- [ ] **Step 3: Add workspace dependencies and scripts**

Run:

```bash
npm install react@18 react-dom@18 react-router-dom@6 @tanstack/react-query@5 zod@3 helmet express-rate-limit cookie-parser bcryptjs
npm install -D vite@5 vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom supertest @types/supertest @types/react @types/react-dom @types/cookie-parser playwright concurrently tsx
```

Set root scripts to:

```json
{
  "dev": "concurrently -k npm:dev:api npm:dev:web",
  "dev:api": "tsx watch api/src/server.ts",
  "dev:web": "vite --config web/vite.config.ts",
  "build": "npm run build:api && npm run build:web",
  "build:api": "tsc -p api/tsconfig.json",
  "build:web": "vite build --config web/vite.config.ts",
  "test": "npm run test:api && npm run test:web",
  "test:api": "vitest --config vitest.config.ts --project api",
  "test:web": "vitest --config vitest.config.ts --project web",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 4: Configure projects and verify the smoke test**

Configure Vitest with API `node` and web `jsdom` projects. Configure the API output at `dist/api` and Vite output at `dist/web`.

Run: `npm run test:api -- --run api/tests/smoke.test.ts`

Expected: PASS, 1 test.

- [ ] **Step 5: Verify both builds**

Run: `npm run build`

Expected: PASS and create `dist/api` plus `dist/web`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts api web
git commit -m "build: add api and web workspace foundation"
```

### Task 2: Validated configuration and production-safe runtime modes

**Files:**
- Create: `api/src/config/env.ts`
- Create: `api/tests/config/env.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `loadEnv(source?: NodeJS.ProcessEnv): AppEnv`.
- Produces: `AppEnv` with `NODE_ENV`, `APP_RUNTIME_MODE`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, and `APP_BASE_URL`.

- [ ] **Step 1: Write failing configuration tests**

```ts
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env';

const valid = {
  NODE_ENV: 'test', APP_RUNTIME_MODE: 'test', PORT: '3000',
  SESSION_SECRET: '12345678901234567890123456789012',
  META_APP_SECRET: 'meta-secret', META_VERIFY_TOKEN: 'verify-secret',
  APP_BASE_URL: 'http://localhost:3000'
};

it('accepts test mode without database services', () => {
  expect(loadEnv(valid).APP_RUNTIME_MODE).toBe('test');
});

it('rejects production without PostgreSQL', () => {
  expect(() => loadEnv({ ...valid, NODE_ENV: 'production', APP_RUNTIME_MODE: 'production' }))
    .toThrow(/DATABASE_URL/);
});

it('rejects the old default Meta token', () => {
  expect(() => loadEnv({ ...valid, META_VERIFY_TOKEN: 'herbalife_crm_verify_token' }))
    .toThrow(/META_VERIFY_TOKEN/);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm run test:api -- --run api/tests/config/env.test.ts`

Expected: FAIL because `loadEnv` does not exist.

- [ ] **Step 3: Implement Zod configuration validation**

Use a discriminated union: production requires non-empty `DATABASE_URL` and `REDIS_URL`; test mode permits them to be absent. Require a 32-character session secret and reject the legacy verification-token default with `refine`.

- [ ] **Step 4: Verify configuration tests**

Run: `npm run test:api -- --run api/tests/config/env.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Document exact variables**

Add all `AppEnv` keys to `.env.example` with blank secrets and `APP_RUNTIME_MODE=development`. Do not add real credentials.

- [ ] **Step 6: Commit**

```bash
git add api/src/config api/tests/config .env.example
git commit -m "feat: validate runtime configuration"
```

### Task 3: Versioned PostgreSQL migrations

**Files:**
- Create: `api/src/db/pool.ts`
- Create: `api/src/db/migrate.ts`
- Create: `api/src/db/migrations/001_base.sql`
- Create: `api/tests/db/migration.test.ts`
- Modify: `db.ts`

**Interfaces:**
- Produces: `createPool(env: AppEnv): Pool`.
- Produces: `runMigrations(pool: Pool): Promise<void>` using `schema_migrations(version text primary key, applied_at timestamptz)`.
- Consumes: existing table definitions from `initSchema()`.

- [ ] **Step 1: Write the failing migration-order test**

```ts
import { expect, it, vi } from 'vitest';
import { runMigrations } from '../../src/db/migrate';

it('applies each migration once inside a transaction', async () => {
  const query = vi.fn()
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] });
  await runMigrations({ query } as never, [{ version: '001', sql: 'select 1' }]);
  expect(query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
    'CREATE', 'BEGIN', 'select', 'INSERT', 'COMMIT'
  ]);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm run test:api -- --run api/tests/db/migration.test.ts`

Expected: FAIL because the migration runner is absent.

- [ ] **Step 3: Move the schema into `001_base.sql`**

Copy the current tables and indexes from `db.ts`, add foreign keys where existing data permits, and add `coaches.password_hash`, `coaches.last_login_at`, `coaches.created_at`, and `coaches.updated_at`. Keep existing table/column names so legacy services continue working.

- [ ] **Step 4: Implement a transactional migration runner**

Acquire PostgreSQL advisory lock `826024`, create `schema_migrations`, apply unapplied files in filename order, insert the filename version, commit, and always release the lock. Roll back on any error.

- [ ] **Step 5: Disable runtime DDL outside test mode**

Change legacy `initSchema()` to call the new runner in PostgreSQL modes and to initialize in-memory fixtures only when `APP_RUNTIME_MODE=test`.

- [ ] **Step 6: Run database and legacy build checks**

Run: `npm run test:api -- --run api/tests/db/migration.test.ts && npm run build:api`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/db api/tests/db db.ts
git commit -m "feat: add versioned database migrations"
```

### Task 4: Coach authentication and session authorization

**Files:**
- Create: `api/src/auth/auth.repository.ts`
- Create: `api/src/auth/auth.service.ts`
- Create: `api/src/auth/auth.routes.ts`
- Create: `api/src/auth/require-auth.ts`
- Create: `api/tests/auth/auth.service.test.ts`
- Create: `api/tests/auth/auth.routes.test.ts`

**Interfaces:**
- Produces: `authenticate(email: string, password: string): Promise<SafeCoach | null>`.
- Produces: `requireAuth(req, res, next)` and `AuthRequest.coach: SafeCoach`.
- Produces endpoints `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`.

- [ ] **Step 1: Write failing password-service tests**

```ts
import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/auth.service';

it('hashes and verifies without returning plaintext', async () => {
  const hash = await hashPassword('Correct-Horse-2026');
  expect(hash).not.toContain('Correct-Horse-2026');
  expect(await verifyPassword('Correct-Horse-2026', hash)).toBe(true);
  expect(await verifyPassword('wrong', hash)).toBe(false);
});
```

- [ ] **Step 2: Confirm failure, then implement bcrypt helpers**

Run: `npm run test:api -- --run api/tests/auth/auth.service.test.ts`

Expected before implementation: FAIL. Implement bcrypt cost 12. Run again; expected PASS.

- [ ] **Step 3: Write failing route tests**

```ts
it('rejects protected API access without a session', async () => {
  await request(app).get('/api/settings').expect(401)
    .expect(({ body }) => expect(body.error.code).toBe('AUTH_REQUIRED'));
});

it('creates and clears a secure coach session', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'coach@example.com', password: 'Correct-Horse-2026' }).expect(200);
  await agent.get('/api/auth/session').expect(200);
  await agent.post('/api/auth/logout').expect(204);
  await agent.get('/api/auth/session').expect(401);
});
```

- [ ] **Step 4: Implement session routes and middleware**

Use an opaque, random 32-byte session token stored only as a SHA-256 hash in `coach_sessions`. Send the raw token in an `HttpOnly`, `SameSite=Lax`, `Secure`-in-production cookie named `coach_session`, with a 12-hour expiry. Rotate the token on login and delete it on logout.

- [ ] **Step 5: Protect all `/api/*` routes except auth login, health, public form, and verified Meta webhooks**

Apply `requireAuth` at the router boundary. Do not trust a coach ID from query parameters or request bodies; obtain the single coach ID from `req.coach.id`.

- [ ] **Step 6: Run auth tests**

Run: `npm run test:api -- --run api/tests/auth`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/auth api/tests/auth
git commit -m "feat: secure dashboard with coach sessions"
```

### Task 5: Express application, validation, errors, and real health status

**Files:**
- Create: `api/src/app.ts`
- Create: `api/src/server.ts`
- Create: `api/src/shared/errors.ts`
- Create: `api/src/shared/validate.ts`
- Create: `api/src/health/health.routes.ts`
- Create: `api/tests/app/security.test.ts`
- Modify: `server.ts`

**Interfaces:**
- Produces: `createApp(deps: AppDependencies): Express` without binding a port.
- Produces error response `{ error: { code: string; message: string; traceId: string } }`.
- Produces `GET /health/live` and `GET /health/ready`.

- [ ] **Step 1: Write failing middleware tests**

```ts
it('sets security headers and rejects oversized JSON', async () => {
  const response = await request(app).get('/health/live').expect(200);
  expect(response.headers['x-content-type-options']).toBe('nosniff');
  await request(app).post('/api/auth/login')
    .set('content-type', 'application/json')
    .send({ email: 'a'.repeat(40_000), password: 'x' })
    .expect(413);
});

it('returns a traceable safe error shape', async () => {
  const response = await request(app).get('/api/missing').expect(404);
  expect(response.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Resource not found' });
  expect(response.body.error.traceId).toMatch(/^[0-9a-f-]{36}$/);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm run test:api -- --run api/tests/app/security.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement the app factory**

Use Helmet, exact-origin CORS from `APP_BASE_URL`, a 32 KB JSON limit, cookie parsing, per-request UUID, login rate limit of 10 attempts per 15 minutes, and centralized error mapping. `server.ts` validates config, migrates, starts the queue, binds the port, and handles SIGTERM/SIGINT gracefully.

- [ ] **Step 4: Implement readiness checks**

`/health/live` reports only process liveness. `/health/ready` queries PostgreSQL and Redis in production and returns 503 with component states if either required dependency fails. Never claim “System Online” from static frontend text.

- [ ] **Step 5: Convert the root `server.ts` to a compatibility export**

Remove port binding from the old file. Export its legacy handlers/services for Task 6, ensuring there is only one application startup path.

- [ ] **Step 6: Verify tests and startup failure behavior**

Run: `npm run test:api -- --run api/tests/app && NODE_ENV=production APP_RUNTIME_MODE=production npm run dev:api`

Expected: tests PASS; production startup exits with a clear configuration error when required secrets/services are absent.

- [ ] **Step 7: Commit**

```bash
git add api/src/app.ts api/src/server.ts api/src/shared api/src/health api/tests/app server.ts
git commit -m "feat: add hardened express application"
```

### Task 6: Authenticated compatibility API for existing features

**Files:**
- Create: `api/src/legacy/legacy.routes.ts`
- Create: `api/src/legacy/legacy.schemas.ts`
- Create: `api/tests/legacy/legacy.routes.test.ts`
- Modify: `api/src/app.ts`
- Modify: `db.ts`

**Interfaces:**
- Consumes: authenticated `req.coach.id` from Task 4.
- Produces: authenticated legacy endpoints for leads, analyses, home visits, profit sheets, entries, reports, and settings.
- Produces: `POST /api/settings` accepting `{ key, value }` for an allowlisted key.

- [ ] **Step 1: Write failing authorization and settings tests**

```ts
it('scopes lead listing to the authenticated coach', async () => {
  const response = await loggedInAgent.get('/api/leads').expect(200);
  expect(deps.getAllLeads).toHaveBeenCalledWith('coach-1');
  expect(response.body).toEqual([]);
});

it('updates only an allowlisted setting', async () => {
  await loggedInAgent.post('/api/settings').send({ key: 'zoom_link', value: 'https://zoom.us/j/123' }).expect(200);
  await loggedInAgent.post('/api/settings').send({ key: 'session_secret', value: 'stolen' }).expect(400);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm run test:api -- --run api/tests/legacy/legacy.routes.test.ts`

Expected: FAIL.

- [ ] **Step 3: Define Zod schemas for every mutation**

Use normalized phone strings of 10-15 digits, positive numeric ranges for measurements/money, ISO dates for payment/visit dates, enums for plan/order/payment states, and maximum text lengths. Reject unknown keys with `.strict()`.

- [ ] **Step 4: Port existing routes through validated services**

Preserve response fields needed by current workflows while removing coach ID input from clients. Add the missing settings mutation. Replace `any` request data at the route boundary with inferred Zod types.

- [ ] **Step 5: Move reports to private access**

Stop mounting `/reports` as static content. Add authenticated `GET /api/documents/:id/download`, authorize ownership, and stream the file with `Content-Disposition: attachment`. Reject `..`, absolute paths, and records not belonging to the authenticated coach.

- [ ] **Step 6: Run compatibility tests and TypeScript build**

Run: `npm run test:api -- --run api/tests/legacy && npm run build:api`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/legacy api/tests/legacy api/src/app.ts db.ts
git commit -m "feat: secure existing coach workflows"
```

### Task 7: Responsive React application shell and login

**Files:**
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/app/App.tsx`
- Create: `web/src/app/AppShell.tsx`
- Create: `web/src/app/navigation.ts`
- Create: `web/src/api/client.ts`
- Create: `web/src/features/auth/LoginPage.tsx`
- Create: `web/src/features/today/TodayPage.tsx`
- Create: `web/src/styles/tokens.css`
- Create: `web/src/styles/global.css`
- Create: `web/tests/AppShell.test.tsx`
- Create: `web/tests/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/logout`.
- Produces: authenticated route shell and navigation metadata `{ path, label, icon, end }[]`.

- [ ] **Step 1: Write failing responsive-navigation test**

```tsx
it('opens and closes mobile navigation accessibly', async () => {
  render(<AppShell><div>Today content</div></AppShell>);
  const trigger = screen.getByRole('button', { name: 'Open navigation' });
  await userEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Write failing login-state test**

```tsx
it('shows a safe error and retains the email after invalid login', async () => {
  server.use(http.post('/api/auth/login', () => HttpResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect', traceId: 'x' } }, { status: 401 })));
  render(<LoginPage />);
  await userEvent.type(screen.getByLabelText('Email'), 'coach@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
  expect(screen.getByLabelText('Email')).toHaveValue('coach@example.com');
});
```

- [ ] **Step 3: Confirm both tests fail**

Run: `npm run test:web -- --run web/tests/AppShell.test.tsx web/tests/LoginPage.test.tsx`

Expected: FAIL because components are absent.

- [ ] **Step 4: Implement authenticated routing and JSON client**

The client sends `credentials: 'include'`, parses the standard error shape, and redirects to `/login` only on `AUTH_REQUIRED`. App startup waits for `/api/auth/session`; it does not flash protected content.

- [ ] **Step 5: Implement desktop and mobile shells**

Desktop at widths >=1024px uses a 264px collapsible sidebar. Mobile uses a 56px header and modal navigation drawer with focus trapping, Escape close, scroll locking, and 44px touch targets. Content must have `min-width: 0`; no fixed sidebar may consume mobile width.

- [ ] **Step 6: Implement a real Today placeholder state**

Show authenticated coach name and sections for urgent tasks, new leads, appointments, payments, and renewals. Until later APIs exist, display explicit empty-state copy rather than fabricated metrics or “System Online.”

- [ ] **Step 7: Verify component tests and production build**

Run: `npm run test:web -- --run web/tests && npm run build:web`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add web
git commit -m "feat: add responsive authenticated coach shell"
```

### Task 8: Legacy feature overview and migration boundary

**Files:**
- Create: `web/src/features/legacy/LegacyOverviewPage.tsx`
- Create: `web/src/features/legacy/legacy.api.ts`
- Create: `web/tests/LegacyOverviewPage.test.tsx`
- Modify: `web/src/app/App.tsx`
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`

**Interfaces:**
- Consumes: authenticated compatibility endpoints from Task 6.
- Produces: working routes `/leads`, `/customers`, `/orders`, `/revenue`, and `/reports` with truthful empty/loading/error states.

- [ ] **Step 1: Write the failing overview test**

```tsx
it('renders existing counts and a retryable error independently', async () => {
  server.use(
    http.get('/api/leads', () => HttpResponse.json([{ phone_number: '919999999999' }])),
    http.get('/api/body-analyses', () => HttpResponse.json({ error: { code: 'UPSTREAM_FAILED', message: 'Could not load analyses', traceId: 'x' } }, { status: 503 }))
  );
  render(<LegacyOverviewPage />);
  expect(await screen.findByText('1 lead')).toBeVisible();
  expect(await screen.findByText('Could not load analyses')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Retry analyses' })).toBeVisible();
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm run test:web -- --run web/tests/LegacyOverviewPage.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement typed compatibility queries**

Create separate query keys for leads, analyses, visits, profit sheets, and settings so one failure does not blank the full page. Render server values as text nodes; do not use `innerHTML` for customer data.

- [ ] **Step 4: Remove the broken static dashboard from production routing**

Keep `public/` only as a temporary reference during this task. Express serves `dist/web/index.html`; delete inline event handlers from the production entry point. Do not expose the old page under an alternate unauthenticated route.

- [ ] **Step 5: Verify overview tests and absence of unsafe rendering**

Run: `npm run test:web -- --run web/tests/LegacyOverviewPage.test.tsx && rg -n "innerHTML|onclick=" web/src`

Expected: test PASS; ripgrep returns no matches.

- [ ] **Step 6: Commit**

```bash
git add web public api/src/app.ts
git commit -m "feat: migrate legacy overview into secure app"
```

### Task 9: End-to-end foundation verification

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/foundation.spec.ts`
- Create: `api/tests/webhook/signature.test.ts`
- Modify: `api/src/app.ts`
- Modify: `README.md`
- Modify: `TECHNICAL_ARCHITECTURE.md`

**Interfaces:**
- Consumes: completed API and web application.
- Produces: repeatable desktop/mobile release gate.

- [ ] **Step 1: Write failing Meta signature tests**

```ts
it('rejects an unsigned Meta webhook', async () => {
  await request(app).post('/webhook').send({ object: 'whatsapp_business_account' }).expect(401);
});

it('accepts a valid sha256 signature', async () => {
  const raw = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account', entry: [] }));
  const signature = 'sha256=' + createHmac('sha256', 'meta-secret').update(raw).digest('hex');
  await request(app).post('/webhook').set('x-hub-signature-256', signature).set('content-type', 'application/json').send(raw).expect(200);
});
```

- [ ] **Step 2: Confirm failure, then implement raw-body signature verification**

Run: `npm run test:api -- --run api/tests/webhook/signature.test.ts`

Expected before implementation: FAIL; after constant-time HMAC comparison: PASS.

- [ ] **Step 3: Write the browser release test**

```ts
test('coach signs in and uses responsive navigation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('coach@example.com');
  await page.getByLabel('Password').fill('Correct-Horse-2026');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/today');
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
});

test('mobile content keeps the full viewport width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/today');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  const box = await page.getByRole('main').boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(374);
});
```

- [ ] **Step 4: Run the complete release gate**

Run: `npm run test && npm run build && npm run test:e2e`

Expected: all unit, integration, build, desktop, and mobile checks PASS with no browser console errors.

- [ ] **Step 5: Update operational documentation**

Document one dashboard, the new directory layout, exact environment variables, migration command, development commands, production startup, backup expectations, and the fact that PostgreSQL/Redis are mandatory in production. Remove the outdated claim that there is no custom frontend.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e api/tests/webhook api/src/app.ts README.md TECHNICAL_ARCHITECTURE.md
git commit -m "test: add foundation release gate"
```

## Subsequent Phase Plans

After this plan passes its release gate, write and execute separate plans in this order:

1. `lead-ingestion-and-pipeline` — website, WhatsApp, manual, Meta Lead Ads, deduplication, campaign attribution, activities, appointments, and tasks.
2. `customer-journey` — transactional conversion, onboarding, complete progress tracking, photos, milestones, and customer timeline.
3. `orders-payments-and-profit` — product/plan catalog, historical pricing, manual/partial payments, refunds, expenses, outstanding balances, and profit sheets.
4. `automation-and-whatsapp` — rule engine, approval modes, templates, quiet hours, retries, renewals, recovery, and referrals.
5. `analytics-and-hardening` — Today intelligence, funnel/campaign/retention/profit analytics, accessibility, performance, backup restoration, monitoring, and security review.

