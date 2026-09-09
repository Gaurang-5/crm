# Simple Mobile CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the CRM easy to use on a phone, centered on Body Analysis, Home Visits, and Zoom Invitations.

**Architecture:** Add a task-first CRM home route and replace the long mobile drawer with four simple sections. Preserve all existing routes and data, place secondary tools under More, and add shared responsive CSS for controls, tables, modals, and page headers.

**Tech Stack:** React 18, React Router, TypeScript, CSS, Vitest, Testing Library, Playwright.

**Spec:** Approved conversation design: Home, People, Activity, More; three primary task cards; secondary features remain accessible.

## Global Constraints

- Preserve every existing CRM route and feature.
- Keep the Lifestyle Mantra white, black, gray, and blue theme.
- Primary phone workflows are Body Analysis, Home Visits, and Zoom Invitations.
- Use plain language and touch targets of at least 44px on phones.

---

### Task 1: Task-first CRM home

**Files:**
- Create: `web/src/pages/CRMHomePage.tsx`
- Modify: `web/src/App.tsx`
- Test: `web/tests/pages/CRMHomePage.test.tsx`

**Interfaces:**
- Consumes: React Router links to `/crm/analyses`, `/crm/homevisit`, `/crm/meetings`.
- Produces: `CRMHomePage` with three primary task cards and recent-work shortcuts.

- [x] Write a failing render test asserting the three task names and destinations.
- [x] Run the focused test and confirm the missing component failure.
- [x] Implement the responsive home screen with plain action copy.
- [x] Run the focused test and confirm it passes.

### Task 2: Simplified navigation

**Files:**
- Modify: `web/src/components/layout/Sidebar.tsx`
- Modify: `web/src/components/layout/MobileNav.tsx`
- Modify: `web/src/components/layout/Layout.tsx`
- Test: `web/tests/components/MobileNav.test.tsx`

**Interfaces:**
- Consumes: existing route list and `Icons` collection.
- Produces: four mobile groups named Home, People, Activity, and More, with all secondary routes reachable from More.

- [x] Write a failing navigation test for the four primary labels and More expansion.
- [x] Run it and verify failure.
- [x] Implement grouped phone navigation and update the desktop labels to plain language.
- [x] Run the focused test and confirm it passes.

### Task 3: Shared phone layouts

**Files:**
- Modify: `web/src/design/base.css`
- Modify: `web/src/design/components.css`
- Modify: `web/src/pages/meetings.css`

**Interfaces:**
- Consumes: existing `.page-*`, `.card`, `.btn`, `.table-container`, `.modal-*`, `.tracker-*` classes.
- Produces: phone spacing, stacked controls, card-like table rows, full-screen modals, and responsive meeting tools.

- [x] Add shared rules under `@media (max-width: 640px)`.
- [x] Build the frontend to detect invalid selectors or CSS asset failures.
- [x] Exercise representative tables, forms, and meeting controls in a 390px viewport.

### Task 4: Verification and deployment

**Files:**
- Modify: `docs/superpowers/plans/2026-09-09-simple-mobile-crm.md`

**Interfaces:**
- Consumes: completed UI and tests.
- Produces: verified GitHub `main` and one Vercel production deployment.

- [x] Run `npm test`, `npm run build`, and `git diff --check`.
- [x] Use Playwright with installed Chrome to test `/crm`, `/crm/meetings`, `/crm/analyses`, and `/crm/homevisit` at 390px and desktop width.
- [x] Commit and push `main`.
- [x] Deploy `lifestyle-mantra-wellness` and verify live routes.
