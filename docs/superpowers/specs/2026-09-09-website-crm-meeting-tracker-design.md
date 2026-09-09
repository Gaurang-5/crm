# Unified Website, CRM, and Meeting Tracker Design

**Date:** 2026-09-09
**Status:** Approved in chat; pending written-spec review

## Objective

Combine the existing Lifestyle Mantra landing page and wellness CRM into one deployed application and one public origin. Website enquiries must become CRM leads. A permanent customer meeting URL must track the journey from page visit through registration and the final Zoom-open action. The coach must be able to replace the destination Zoom URL from a dedicated CRM page whenever the link received through WhatsApp changes.

For the first version, a recorded click on the final **Open Zoom Meeting** button is the system's attendance signal. The system does not claim to verify that Zoom admitted the visitor or that the visitor remained in the meeting.

## Product Structure

The CRM repository becomes the single application and deployment:

- `/` serves the public Lifestyle Mantra landing page.
- `/join` serves the public tracked meeting experience.
- `/crm/*` serves the authenticated coach portal.
- `/api/public/*` serves narrowly scoped public ingestion and meeting endpoints.
- `/api/*` continues to serve authenticated CRM endpoints.

The existing landing page's visual identity, content, responsive behavior, transformation galleries, Instagram section, and motion are preserved as an isolated static entry inside the CRM's Vite build. The authenticated CRM and public meeting page remain in the React entry. This multi-page build prevents the landing page's broad CSS and document-level interactions from affecting the CRM while still producing one project, origin, deployment, and API. CRM routes move below `/crm`, with `/login` retained as the authentication entry point and successful login redirecting to `/crm/today`.

## Public Landing Enquiry Flow

The consultation form collects the existing name, phone or WhatsApp number, city, and wellness goal fields. On a valid submission:

1. The browser sends the form to `POST /api/public/leads`.
2. The API normalizes the phone number and upserts the lead through the existing lead service.
3. The source is recorded as `Website Consultation`, and an activity records the form submission.
4. A repeated submission from the same phone updates the existing lead instead of creating a duplicate.
5. After a successful CRM response, the existing WhatsApp conversation link opens with the prepared message.

If the CRM request fails, the form retains all entered values and offers a retry. WhatsApp is not opened until the CRM has accepted the enquiry, preventing a silent loss of the lead. The public endpoint uses schema validation, a small request-body limit, and rate limiting.

## Customer Meeting Experience

The customer receives one permanent URL, `/join`, regardless of how often the underlying Zoom URL changes.

### Stage 1: Visit

Opening `/join` creates or resumes a meeting visit. A random opaque visitor ID is stored in the browser and sent to the server; it contains no personal data. Refreshing the page updates the same visit instead of increasing the unique-visitor count. The server records first seen, last seen, referral and campaign parameters, and a coarse device category.

The initial screen uses the Lifestyle Mantra brand with editorial typography, restrained emerald accents, soft translucent surfaces, generous spacing, and subtle motion. It presents the session context and one primary **Join Zoom** action.

### Stage 2: Intent and details

The first **Join Zoom** click records an intent event and reveals the name and phone form in place. The form does not navigate to a separate page.

Name and phone drafts autosave after a short pause and on field blur. Draft requests are ordered by a client revision number so a delayed request cannot overwrite newer input. This allows the CRM to show an unfinished visit when someone types and leaves without submitting. The page includes a short disclosure that entered details are saved to arrange and track session access.

Partially entered data remains attached to the meeting visit and does not become a CRM lead. A lead is created or matched only after the form has a valid name and phone and registration succeeds. Draft data has a 30-day retention period; anonymous visits without any entered details have a 90-day retention period.

### Stage 3: Registration

Submitting valid details calls `POST /api/public/meetings/visits/:visitToken/register`. The API normalizes the phone, marks the visit registered, upserts a CRM lead with source `Zoom Link Tracker`, and records a meeting-registration activity. Returning visitors on the same device see locally remembered details prefilled but must confirm them for each meeting visit.

### Stage 4: Open Zoom

After registration, the interface transitions to a calm confirmation state with one primary **Open Zoom Meeting** action. Clicking it calls `POST /api/public/meetings/visits/:visitToken/join`. The server records the join event and returns the active Zoom destination. The browser then opens that URL. The raw destination is not embedded in the initial HTML or returned by pre-registration endpoints.

If no active Zoom destination exists, the public page shows a branded link-update state and a WhatsApp contact action. Links do not expire automatically after 24 hours; the active destination remains valid until the coach replaces or disables it.

## Meeting Tracker CRM Page

The authenticated `/crm/meetings` page contains four areas.

### Current link

The coach can see the masked current Zoom destination, when it was set, and who changed it. **Replace Link** validates a Zoom HTTPS URL, creates a new link version, and deactivates the previous version in one transaction. A coach can also disable meeting access. Link history remains available for audit and historical analytics.

The page prominently shows the permanent `/join` URL with **Copy Link** and **Share on WhatsApp** actions. Customers never need a new public URL.

### Summary and funnel

Date-scoped summary metrics show:

- Total page visits and unique visitors
- First Join Zoom clicks
- Completed registrations
- Final Open Zoom Meeting clicks

A funnel displays conversion and drop-off between Visit, Intent, Registration, and Join. Counts distinguish total events from unique visits.

### Activity table

The table includes name, phone, first visit, last activity, acquisition source, current link version, and status. Supported statuses are `VISITED`, `STARTED`, `DETAILS_INCOMPLETE`, `REGISTERED`, and `JOINED`. Filters cover date range and status, with search by name or phone. Rows with partial details are visually identified without treating them as qualified leads.

### Visit detail

Opening a row shows the chronological event timeline, draft state, registration linkage, lead linkage, referral data, and the link version used. This view helps the coach distinguish a simple page view from real intent.

## Data Model

### `meeting_links`

- `id` UUID primary key
- `destination_url` stored as application data and accessible only through protected server operations
- `status` with `ACTIVE` or `INACTIVE`
- `created_by` references the authenticated coach
- `created_at`, `activated_at`, and `deactivated_at`

At most one row is active. Replacement runs inside a database transaction and preserves prior rows.

### `meeting_visits`

- `id` UUID primary key
- `public_token_hash` stores a hash of the opaque client token
- `meeting_link_id` references the link version active at the final join
- `lead_phone_number` is nullable until successful registration
- `draft_name` and `draft_phone` are nullable
- `draft_revision` prevents stale autosave writes
- `status`
- `source`, `campaign`, `referrer`, and coarse `device_category`
- `first_seen_at`, `last_seen_at`, `intent_at`, `registered_at`, and `joined_at`
- `created_at` and `updated_at`

Indexes cover status and date reporting, normalized-phone lookup, and token lookup. Raw IP addresses and browser fingerprints are not stored.

### `meeting_visit_events`

- `id` big integer primary key
- `meeting_visit_id` foreign key
- `event_type` with `VISIT`, `INTENT`, `DRAFT_SAVED`, `REGISTERED`, or `JOINED`
- `metadata` JSONB limited to event-specific non-secret data
- `created_at`

Registration and join events use idempotency constraints so retries and double clicks do not inflate metrics.

## API Boundaries

Public endpoints are unauthenticated but rate limited and accept only allowlisted fields:

- `POST /api/public/leads`
- `POST /api/public/meetings/visits`
- `PATCH /api/public/meetings/visits/:visitToken/draft`
- `POST /api/public/meetings/visits/:visitToken/intent`
- `POST /api/public/meetings/visits/:visitToken/register`
- `POST /api/public/meetings/visits/:visitToken/join`
- `GET /api/public/meetings/status`

CRM endpoints require the existing session authentication:

- `GET /api/meetings/summary`
- `GET /api/meetings/visits`
- `GET /api/meetings/visits/:id`
- `GET /api/meetings/links`
- `POST /api/meetings/links`
- `POST /api/meetings/links/:id/disable`

Public responses never expose historical links, coach identity data, private lead records, or the active destination before registration and the final join action.

## Validation, Security, and Privacy

- Phone numbers are normalized through the existing phone helper and validated for a usable Indian mobile number while retaining support for an explicit international prefix.
- Zoom destinations must use HTTPS and match approved Zoom hostnames such as `zoom.us` and `*.zoom.us`.
- Database credentials and authenticated route controls protect stored destinations; public endpoints reveal the active destination only in a successful final join response.
- Public endpoints use separate rate limits for visit creation, draft saving, registration, and join actions.
- The visit token is random, unguessable, and stored server-side as a hash.
- Authenticated link changes create audit events.
- The customer form states that typed details are saved for session access and follow-up.
- Anonymous tracking avoids raw IP storage and invasive fingerprinting.
- A maintenance operation removes anonymous visits after 90 days and unfinished personal drafts after 30 days.

## Visual and Interaction Design

The landing page keeps its accepted public design in its isolated static entry. The `/join` page is designed first for WhatsApp mobile browsers and scales to desktop. It uses one focal action per stage, visible keyboard focus, correct autocomplete attributes, clear validation, and an ARIA live region for save and submission status. Motion respects `prefers-reduced-motion`.

The CRM meeting page follows the existing dashboard components and density. The public page may share brand tokens with the landing page but does not import CRM dashboard styles that would create visual collisions.

## Error Handling

- Draft autosave is debounced, aborts superseded requests, and retries transient failures with a bounded delay.
- Registration failures retain all inputs and show a direct retry action.
- A join request is idempotent; repeated final clicks return the same active destination without duplicate metrics.
- If a link is changed between registration and join, the join endpoint returns the currently active link and associates that version with the visit.
- If the active link is disabled, the join endpoint returns a typed unavailable response and the page shows the branded update state.
- Link replacement either completes fully or leaves the previous active link untouched.

## Testing and Acceptance Criteria

Automated API tests verify public validation and rate limits, authenticated CRM access, visit deduplication, stale draft rejection, partial-data retention, lead upsert behavior, registration and join idempotency, link replacement, disabled-link behavior, and funnel counts.

Frontend tests verify each customer stage, retained form values on failure, autosave state, returning-visitor prefill, landing form submission followed by WhatsApp opening, CRM filtering, and link replacement feedback.

Browser verification covers the complete path on desktop and a mobile-sized viewport:

1. Submit a landing enquiry and confirm the lead and source in CRM.
2. Open `/join` and confirm one unique visit.
3. Click the first action, type partial details, leave, and confirm `DETAILS_INCOMPLETE` in CRM.
4. Register with valid details and confirm lead matching or creation.
5. Click the final action and confirm one join event before Zoom opens.
6. Replace the destination in CRM and confirm the permanent public URL uses the new link.
7. Disable the link and confirm the public unavailable state.

The final visual QA compares the accepted landing appearance, the new customer meeting concept, and rendered desktop and mobile screenshots. It checks copy, hierarchy, typography, palette, spacing, interaction states, responsive behavior, focus visibility, and reduced motion.

## Out of Scope

- Zoom API attendance verification, meeting duration, or participant reports
- Automatic extraction of links from a WhatsApp group
- OTP verification of visitor phone numbers
- Per-recipient private invitation URLs
- Automatic daily link expiry or replacement
- Marketing automation triggered by unfinished drafts
