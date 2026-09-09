import { randomUUID } from "crypto";
import { pool, useInMemory } from "../../../db";
import { AppError } from "../shared/errors";

export interface Event {
  event_type: string;
  created_at: string;
  pageId?: string;
}
export interface Visit {
  id: string;
  visitor_hash: string;
  status: string;
  draft_name: string;
  draft_phone: string;
  draft_revision: number;
  first_seen_at: string;
  last_seen_at: string;
  intent_at?: string;
  registered_at?: string;
  joined_at?: string;
  lead_phone_number?: string;
  meeting_link_id?: string;
  destinationUrl?: string;
  source: string;
  campaign: string;
  events: Event[];
}
export interface Link {
  id: string;
  destination_url: string;
  status: string;
  created_by: string;
  created_at: string;
  deactivated_at?: string;
  topic: string;
  meeting_date: string;
  meeting_time: string;
  meeting_id: string;
  passcode: string;
}
export type MeetingDetails = Pick<
  Link,
  "topic" | "meeting_date" | "meeting_time" | "meeting_id" | "passcode"
>;
const visits = new Map<string, Visit>();
const links: Link[] = [];
let lock = Promise.resolve();
export async function exclusive<T>(
  fn: (client: any) => Promise<T>,
): Promise<T> {
  if (pool && !useInMemory) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(826025)");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  const previous = lock;
  let release!: () => void;
  lock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await fn(null);
  } finally {
    release();
  }
}
export async function readVisit(
  hash: string,
  client?: any,
): Promise<Visit | undefined> {
  const db = client || (pool && !useInMemory ? pool : null);
  if (db)
    return (
      await db.query("SELECT data FROM meeting_visits WHERE token_hash=$1", [
        hash,
      ])
    ).rows[0]?.data;
  const visit = visits.get(hash);
  return visit ? structuredClone(visit) : undefined;
}
export async function saveVisit(hash: string, visit: Visit, client: any) {
  if (client)
    await client.query(
      `INSERT INTO meeting_visits(id,token_hash,visitor_hash,data) VALUES($1,$2,$3,$4)
    ON CONFLICT(token_hash) DO UPDATE SET data=EXCLUDED.data,updated_at=now()`,
      [visit.id, hash, visit.visitor_hash, JSON.stringify(visit)],
    );
  else visits.set(hash, structuredClone(visit));
}
export function event(visit: Visit, kind: string) {
  if (!visit.events.some((e) => e.event_type === kind))
    visit.events.push({
      event_type: kind,
      created_at: new Date().toISOString(),
    });
}
export async function allLinks(client?: any): Promise<Link[]> {
  const db = client || (pool && !useInMemory ? pool : null);
  return db
    ? (await db.query("SELECT * FROM meeting_links ORDER BY created_at DESC"))
        .rows
    : [...links].reverse();
}
export async function changeLink(
  coach: string,
  url?: string,
  disableId?: string,
  details?: MeetingDetails,
) {
  return exclusive(async (client) => {
    const now = new Date().toISOString();
    if (disableId && !(await allLinks(client)).some((l) => l.id === disableId))
      throw new AppError("NOT_FOUND", "Link not found", 404);
    if (client)
      await client.query(
        "UPDATE meeting_links SET status='INACTIVE',deactivated_at=now() WHERE status='ACTIVE' AND ($1::uuid IS NULL OR id=$1)",
        [disableId || null],
      );
    else
      links.forEach((l) => {
        if (l.status === "ACTIVE" && (!disableId || l.id === disableId)) {
          l.status = "INACTIVE";
          l.deactivated_at = now;
        }
      });
    const link: Link = {
      id: randomUUID(),
      destination_url: url || "",
      status: "ACTIVE",
      created_by: coach,
      created_at: now,
      topic: details?.topic || "Wellness Session",
      meeting_date: details?.meeting_date || "",
      meeting_time: details?.meeting_time || "",
      meeting_id: details?.meeting_id || "",
      passcode: details?.passcode || "",
    };
    if (url) {
      if (client)
        await client.query(
          `INSERT INTO meeting_links(
            id,destination_url,status,created_by,topic,meeting_date,meeting_time,meeting_id,passcode
          ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            link.id,
            url,
            "ACTIVE",
            coach,
            link.topic,
            link.meeting_date,
            link.meeting_time,
            link.meeting_id,
            link.passcode,
          ],
        );
      else links.push(link);
    }
    if (client)
      await client.query(
        "INSERT INTO audit_events(coach_id,event_type,entity_type,entity_id,payload) VALUES($1,$2,'MEETING_LINK',$3,'{}')",
        [
          coach,
          url ? "MEETING_LINK_REPLACED" : "MEETING_LINK_DISABLED",
          url ? link.id : disableId,
        ],
      );
    return url ? link : { success: true };
  });
}
export async function listVisits(): Promise<Visit[]> {
  if (pool && !useInMemory)
    return (
      await pool.query(
        "SELECT data FROM meeting_visits ORDER BY updated_at DESC",
      )
    ).rows.map((r) => r.data);
  return [...visits.values()].map((v) => structuredClone(v)).reverse();
}
export async function prune() {
  const now = Date.now();
  if (pool && !useInMemory)
    return (
      await pool.query(`DELETE FROM meeting_visits WHERE data->>'registered_at' IS NULL AND updated_at < now() -
    CASE WHEN coalesce(data->>'draft_name','') <> '' OR coalesce(data->>'draft_phone','') <> '' THEN interval '30 days' ELSE interval '90 days' END`)
    ).rowCount;
  let count = 0;
  for (const [key, v] of visits)
    if (
      !v.registered_at &&
      now - Date.parse(v.last_seen_at) >
        (v.draft_name || v.draft_phone ? 30 : 90) * 86400000
    ) {
      visits.delete(key);
      count++;
    }
  return count;
}
