# Lifestyle Mantra: website, CRM and meeting invitations

## One deployment

- `/`: the original landing website, preserved as a separate HTML entry.
- `/join`: public invitation page. Share this stable URL in WhatsApp groups.
- `/crm/login`: coach sign-in.
- `/crm/meetings`: meeting destination, history, visitor funnel, filters and timelines.
- `/crm/*`: existing CRM pages.
- `/body-analysis` and `/report`: existing customer report routes.

Run `npm run dev` for the local website (5173) and API (3000). Without a database, development uses temporary in-memory records; restarting the API clears them. `npm run build` builds both HTML entries, the API and its SQL migrations. `NODE_ENV=production npm run start:web` serves the build and API together. Production requires a working PostgreSQL `DATABASE_URL` and the existing server environment settings. Production fails closed if database initialization fails.

For Vercel, deploy this repository with its checked-in `vercel.json`, configure the existing environment variables and attach the chosen domain to this single project. Do not deploy the old landing-only Sites build for the combined application: it does not include the API. No live deployment or domain change is included in these local changes.

## How the flows work

The consultation form saves a validated enquiry before opening WhatsApp. A submission UUID prevents duplicate leads/source touchpoints on concurrent retries. Existing lead stages are retained. Public capture does not trigger automatic outbound messages.

The invitation records a page visit before any button click. Join Zoom reveals name and phone fields. A notice explains that partial details are saved while typing; the browser debounces saves and attempts a keepalive save when hidden. Registration validates the fields and creates a CRM lead. The separate Open Zoom Meeting button records the final click before returning the current Zoom destination. Only authenticated coaches can read visitors or change links. Unauthenticated responses do not expose the destination before registration.

Zoom destinations persist until explicitly replaced or paused, with one active link enforced by the database. There is no 24-hour expiry. Updates retain link history. The page remains available when no Zoom destination is active and explains that the next link is coming.

## Meaning of the counts

- Page visits: fresh page loads; network retries of the same page are deduplicated.
- Unique browsers: anonymous random browser IDs, not verified people.
- Join clicks: visit sessions that clicked the first button.
- Registered: visit sessions that confirmed valid details.
- Opened Zoom: visit sessions that clicked the final button, **not confirmed Zoom attendance**.

A tab starts a new visit session after four hours on a subsequent page load. Names/phones are stored only when entered; anonymous visitors cannot be identified from WhatsApp group membership. Clearing browser storage or using another browser changes the anonymous ID. Failed/offline requests cannot be guaranteed to reach the server; the page surfaces failures and keeps entered details available for retry.

## Storage and retention

Migration `003_meeting_tracker.sql` adds meeting destinations, visit JSON records and submission deduplication IDs. Database writes use a transaction and advisory lock so registration, CRM identity/attribution and visit state commit together. Partial drafts do not create CRM leads. The server's database role owns access; browser clients never connect to these tables directly.

`GET /api/maintenance/meeting-visits` requires `Authorization: Bearer <CRON_SECRET>`. Configure `CRON_SECRET` for the Vercel daily cleanup. This removes unregistered partial visits after 30 inactive days and anonymous visits after 90 inactive days. The standalone Node deployment needs an equivalent external scheduler. Registered records are retained. Rate limits are per server process; multi-instance abuse protection should also be configured at the hosting edge.

## Verification

API tests cover anonymous visit capture, authentication, stale draft ordering, registration gating, invalid Zoom hosts, replacement/pause, retry deduplication and suppression of message automations. UI tests cover delayed detail collection, partial autosave, registration and the unavailable-session state.

The in-app browser was used at desktop and 390px mobile widths to verify the invitation, partial visitor table, registration, final redirect, and consultation-to-CRM-to-WhatsApp flow with synthetic local data. PostgreSQL persistence and the live hosting configuration still require deployment verification. The repository has pre-existing standalone frontend TypeScript errors; the normal API TypeScript and Vite production builds pass.
