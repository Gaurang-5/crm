import { Router, RequestHandler } from "express";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import { AppError } from "../shared/errors";
import { captureLead } from "./capture-lead";
import {
  allLinks,
  changeLink,
  event,
  exclusive,
  listVisits,
  readVisit,
  saveVisit,
  Visit,
  prune,
} from "./store";

const wrap =
  (fn: (req: any, res: any) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const parse = <S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): z.output<S> => {
  const r = schema.safeParse(data);
  if (!r.success)
    throw new AppError("INVALID_INPUT", r.error.issues[0].message);
  return r.data;
};
const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()+-]/g, ""))
  .refine(
    (s) => /^(?:[6-9]\d{9}|91[6-9]\d{9}|[1-9]\d{10,14})$/.test(s),
    "Enter a valid phone number",
  )
  .transform((s) => (s.length === 10 ? `91${s}` : s));
const registration = z.object({
  name: z.string().trim().min(2).max(100),
  phone,
});
const clean = (v: Visit) => ({
  id: v.id,
  status: v.status,
  draft_revision: v.draft_revision,
  registered: !!v.registered_at,
});
export const meetingPublic = Router();
meetingPublic.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
meetingPublic.use(
  rateLimit({
    windowMs: 900000,
    limit: 600,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
meetingPublic.get(
  "/status",
  wrap(async (_req, res) =>
    res.json({
      available: (await allLinks()).some((l) => l.status === "ACTIVE"),
    }),
  ),
);
meetingPublic.post(
  "/visits",
  wrap(async (req, res) => {
    const input = parse(
      z.object({
        visitorId: z.string().uuid(),
        visitToken: z.string().uuid(),
        pageId: z.string().uuid(),
        source: z.string().max(100).default("Direct"),
        campaign: z.string().max(100).default(""),
      }),
      req.body,
    );
    const result = await exclusive(async (client) => {
      const key = hash(input.visitToken),
        now = new Date().toISOString();
      let v = await readVisit(key, client);
      if (!v)
        v = {
          id: randomUUID(),
          visitor_hash: hash(input.visitorId),
          status: "VISITED",
          draft_name: "",
          draft_phone: "",
          draft_revision: 0,
          first_seen_at: now,
          last_seen_at: now,
          source: input.source,
          campaign: input.campaign,
          events: [],
        };
      if (!v.events.some((e) => e.pageId === input.pageId))
        v.events.push({
          event_type: "VISIT",
          created_at: now,
          pageId: input.pageId,
        });
      v.last_seen_at = now;
      await saveVisit(key, v, client);
      return clean(v);
    });
    res.status(201).json(result);
  }),
);
meetingPublic.all(
  "/visits/:token/:action",
  wrap(async (req, res) => {
    const token = parse(z.string().uuid(), req.params.token),
      key = hash(token),
      action = req.params.action;
    if (
      !["intent", "draft", "register", "join"].includes(action) ||
      req.method !== (action === "draft" ? "PATCH" : "POST")
    )
      throw new AppError("NOT_FOUND", "Action not found", 404);
    const result = await exclusive(async (client) => {
      const v = await readVisit(key, client);
      if (!v)
        throw new AppError(
          "NOT_FOUND",
          "Please refresh the page to start again",
          404,
        );
      const now = new Date().toISOString();
      v.last_seen_at = now;
      if (action === "intent") {
        v.intent_at ||= now;
        if (v.status === "VISITED") v.status = "STARTED";
        event(v, "INTENT");
      }
      if (action === "draft") {
        if (v.registered_at)
          throw new AppError(
            "REGISTERED",
            "Details have already been confirmed",
            409,
          );
        const d = parse(
          z.object({
            name: z.string().max(100),
            phone: z.string().max(30),
            revision: z.number().int().positive(),
          }),
          req.body,
        );
        if (d.revision > v.draft_revision) {
          v.draft_name = d.name;
          v.draft_phone = d.phone;
          v.draft_revision = d.revision;
          v.status = d.name || d.phone ? "DETAILS_INCOMPLETE" : "STARTED";
          event(v, "DRAFT_SAVED");
        }
      }
      if (action === "register" && !v.registered_at) {
        const d = parse(registration, req.body);
        await captureLead(client, { ...d, campaign: "Zoom Link Tracker" });
        v.draft_name = d.name;
        v.draft_phone = d.phone;
        v.lead_phone_number = d.phone;
        v.registered_at = now;
        v.status = "REGISTERED";
        event(v, "REGISTERED");
      }
      if (action === "join") {
        if (!v.registered_at)
          throw new AppError(
            "REGISTRATION_REQUIRED",
            "Confirm your details first",
            409,
          );
        const link = (await allLinks(client)).find(
          (l) => l.status === "ACTIVE",
        );
        if (!link)
          throw new AppError(
            "MEETING_UNAVAILABLE",
            "The meeting link is being updated",
            409,
          );
        if (!v.joined_at) {
          v.joined_at = now;
          v.meeting_link_id = link.id;
          v.destinationUrl = link.destination_url;
          v.status = "JOINED";
          event(v, "JOINED");
        }
        await saveVisit(key, v, client);
        return { destinationUrl: link.destination_url, joinedAt: v.joined_at };
      }
      await saveVisit(key, v, client);
      return clean(v);
    });
    res.json(result);
  }),
);
export const meetingAdmin = Router();
meetingAdmin.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
export const publicLead = Router();
const submissions = new Set<string>();
publicLead.use(
  rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
publicLead.post(
  "/",
  wrap(async (req, res) => {
    const d = parse(
      registration.extend({
        submissionId: z.string().uuid(),
        city: z.string().trim().max(100).optional(),
        interest: z.string().trim().max(100).optional(),
      }),
      req.body,
    );
    await exclusive(async (client) => {
      if (client) {
        const inserted = await client.query(
          "INSERT INTO public_submissions(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
          [d.submissionId],
        );
        if (!inserted.rowCount) return;
      } else if (submissions.has(d.submissionId)) return;
      await captureLead(client, {
        ...d,
        campaign: "Public Website Consultation Form",
      });
      if (!client) submissions.add(d.submissionId);
    });
    res.set("Cache-Control", "no-store").status(201).json({ success: true });
  }),
);
meetingAdmin.get(
  "/links",
  wrap(async (_req, res) => res.json(await allLinks())),
);
meetingAdmin.post(
  "/links",
  wrap(async (req, res) => {
    const { destinationUrl } = parse(
      z.object({ destinationUrl: z.string().url().max(2048) }),
      req.body,
    );
    const u = new URL(destinationUrl);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.port ||
      !(u.hostname === "zoom.us" || u.hostname.endsWith(".zoom.us"))
    )
      throw new AppError("INVALID_INPUT", "Enter a valid Zoom HTTPS link");
    res.status(201).json(await changeLink(req.coach.id, u.href));
  }),
);
meetingAdmin.post(
  "/links/:id/disable",
  wrap(async (req, res) =>
    res.json(
      await changeLink(
        req.coach.id,
        undefined,
        parse(z.string().uuid(), req.params.id),
      ),
    ),
  ),
);
async function filtered(query: any) {
  const q = parse(
    z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      status: z
        .enum([
          "VISITED",
          "STARTED",
          "DETAILS_INCOMPLETE",
          "REGISTERED",
          "JOINED",
        ])
        .optional(),
      search: z.string().max(100).optional(),
    }),
    query,
  );
  return (await listVisits()).filter(
    (v) =>
      (!q.from || v.first_seen_at >= q.from) &&
      (!q.to || v.first_seen_at <= q.to) &&
      (!q.status || v.status === q.status) &&
      (!q.search ||
        `${v.draft_name} ${v.draft_phone}`
          .toLowerCase()
          .includes(q.search.toLowerCase())),
  );
}
meetingAdmin.get(
  "/summary",
  wrap(async (req, res) => {
    const vs = await filtered(req.query);
    res.json({
      totalVisits: vs.reduce(
        (n, v) => n + v.events.filter((e) => e.event_type === "VISIT").length,
        0,
      ),
      uniqueVisits: new Set(vs.map((v) => v.visitor_hash)).size,
      intentClicks: vs.filter((v) => v.intent_at).length,
      registrations: vs.filter((v) => v.registered_at).length,
      joinClicks: vs.filter((v) => v.joined_at).length,
    });
  }),
);
meetingAdmin.get(
  "/visits",
  wrap(async (req, res) => {
    const { offset, limit } = parse(
      z.object({
        offset: z.coerce.number().int().min(0).default(0),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      }),
      req.query,
    );
    const vs = await filtered(req.query);
    res.json({
      items: vs
        .slice(offset, offset + limit)
        .map(({ events, destinationUrl, visitor_hash, ...v }) => v),
      total: vs.length,
    });
  }),
);
meetingAdmin.get(
  "/visits/:id",
  wrap(async (req, res) => {
    const v = (await listVisits()).find((v) => v.id === req.params.id);
    if (!v) throw new AppError("NOT_FOUND", "Visit not found", 404);
    const { events, destinationUrl, visitor_hash, ...visit } = v;
    res.json({ visit, events });
  }),
);
export const maintenance = Router();
maintenance.all(
  "/meeting-visits",
  wrap(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`)
      throw new AppError("AUTH_REQUIRED", "Authentication required", 401);
    res.json({ pruned: await prune() });
  }),
);
