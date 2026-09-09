import { it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { createApp } from "../../src/app";
import { memLeadSources, memAutomationRuns, memLeads } from "../../../db";

it("tracks a visitor without exposing Zoom until registration and protects administration", async () => {
  const app = createApp({});
  await request(app).get("/api/meetings/visits").expect(401);
  const admin = request.agent(app);
  await admin
    .post("/api/auth/login")
    .send({ email: "admin", password: "Correct-Horse-2026" })
    .expect(200);
  await admin
    .post("/api/meetings/links")
    .send({ destinationUrl: "https://zoom.us/j/123456789" })
    .expect(201);
  const visitToken = randomUUID();
  const created = await request(app)
    .post("/api/public/meetings/visits")
    .send({ visitorId: randomUUID(), visitToken, pageId: randomUUID() })
    .expect(201);
  expect(JSON.stringify(created.body)).not.toContain("123456789");
  const base = `/api/public/meetings/visits/${visitToken}`;
  await request(app).post(`${base}/join`).expect(409);
  await request(app).post(`${base}/intent`).expect(200);
  await request(app)
    .patch(`${base}/draft`)
    .send({ name: "Asha", phone: "987", revision: 2 })
    .expect(200);
  await request(app)
    .patch(`${base}/draft`)
    .send({ name: "A", phone: "9", revision: 1 })
    .expect(200);
  const partial = await admin
    .get("/api/meetings/visits?status=DETAILS_INCOMPLETE")
    .expect(200);
  expect(partial.body.items[0].draft_name).toBe("Asha");
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Asha Test", phone: "9876543210" })
    .expect(200);
  const joined = await request(app).post(`${base}/join`).expect(200);
  expect(joined.body.destinationUrl).toBe("https://zoom.us/j/123456789");
  const count = memLeadSources.length;
  await request(app)
    .post(`${base}/register`)
    .send({ name: "Duplicate", phone: "9876543210" })
    .expect(200);
  expect(memLeadSources.length).toBe(count);
  await request(app).post(`${base}/join`).expect(200);
  const timeline = await admin
    .get(`/api/meetings/visits/${created.body.id}`)
    .expect(200);
  expect(
    timeline.body.events.filter((e: any) => e.event_type === "JOINED"),
  ).toHaveLength(1);
  await admin
    .post("/api/meetings/links")
    .send({ destinationUrl: "https://zoom.us.evil.test/j/123" })
    .expect(400);
  await admin
    .post("/api/meetings/links")
    .send({ destinationUrl: "javascript:alert(1)" })
    .expect(400);
  const replacement = await admin
    .post("/api/meetings/links")
    .send({ destinationUrl: "https://us02web.zoom.us/j/987654321" })
    .expect(201);
  expect(
    (await request(app).post(`${base}/join`).expect(200)).body.destinationUrl,
  ).toBe("https://us02web.zoom.us/j/987654321");
  await admin
    .post(`/api/meetings/links/${replacement.body.id}/disable`)
    .expect(200);
  await request(app).post(`${base}/join`).expect(409);
});

it("saves a consultation once on concurrent retries and does not start message automations", async () => {
  const app = createApp({}),
    before = memLeadSources.length,
    runs = memAutomationRuns.length;
  const payload = {
    submissionId: randomUUID(),
    name: "Website QA",
    phone: "9876543299",
    city: "Delhi",
    interest: "Energy & Vitality",
  };
  const results = await Promise.all([
    request(app).post("/api/public/lead").send(payload),
    request(app).post("/api/public/lead").send(payload),
  ]);
  results.forEach((r) => {
    expect(r.status).toBe(201);
    expect(r.body).toEqual({ success: true });
  });
  expect(memLeadSources.length).toBe(before + 1);
  expect(memAutomationRuns.length).toBe(runs);
  expect(
    memLeads.find((l) => l.phone_number === "919876543299")?.display_name,
  ).toBe("Website QA");
  await request(app)
    .post("/api/public/lead")
    .send({ ...payload, submissionId: randomUUID(), phone: "12" })
    .expect(400);
});

it("deduplicates a retried page view but counts a fresh page load", async () => {
  const app = createApp({}),
    admin = request.agent(app);
  await admin
    .post("/api/auth/login")
    .send({ email: "admin", password: "Correct-Horse-2026" })
    .expect(200);
  const input = {
    visitorId: randomUUID(),
    visitToken: randomUUID(),
    pageId: randomUUID(),
  };
  const created = await request(app)
    .post("/api/public/meetings/visits")
    .send(input)
    .expect(201);
  await request(app)
    .post("/api/public/meetings/visits")
    .send(input)
    .expect(201);
  await request(app)
    .post("/api/public/meetings/visits")
    .send({ ...input, pageId: randomUUID() })
    .expect(201);
  const detail = await admin
    .get(`/api/meetings/visits/${created.body.id}`)
    .expect(200);
  expect(
    detail.body.events.filter((e: any) => e.event_type === "VISIT"),
  ).toHaveLength(2);
  expect(detail.body.visit.draft_name).toBe("");
  await request(app).get(`/api/meetings/visits/${created.body.id}`).expect(401);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "admin", password: "admin" })
    .expect(401);
});
