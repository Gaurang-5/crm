import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";
import "./meetings.css";

const labels: Record<string, string> = {
  VISITED: "Visited only",
  STARTED: "Join clicked",
  DETAILS_INCOMPLETE: "Details incomplete",
  REGISTERED: "Registered",
  JOINED: "Opened Zoom",
};
const time = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export type MeetingLink = {
  id: string;
  destination_url: string;
  status: string;
  created_at: string;
  topic: string;
  meeting_date: string;
  meeting_time: string;
  meeting_id: string;
  passcode: string;
};

type ActivityPreset = "today" | "7d" | "30d" | "all" | "custom";

const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const readableDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));

export function activityDateRange(
  preset: Exclude<ActivityPreset, "custom">,
  now = new Date(),
) {
  if (preset === "all") {
    return { from: "", to: "", label: "All recorded activity" };
  }
  const days = preset === "today" ? 1 : preset === "7d" ? 7 : 30;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - (days - 1));
  const from = dateInputValue(start);
  const to = dateInputValue(now);
  const fromLabel = readableDate(from);
  const toLabel = readableDate(to);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const label = preset === "today"
    ? `Today · ${toLabel}`
    : sameMonth
      ? `${start.getDate()}–${toLabel}`
      : `${fromLabel}–${toLabel}`;
  return { from, to, label };
}

export function buildInvitationMessage(active: MeetingLink, publicUrl: string) {
  return [
    "*Lifestyle Mantra*",
    "_You’re invited to a wellness session._",
    "",
    `*Topic:* ${active.topic}`,
    `*Date:* ${active.meeting_date}`,
    `*Time:* ${active.meeting_time}`,
    "",
    "*Join the session here:*",
    publicUrl,
    "",
    "We look forward to seeing you!",
    "_Wellness, every day._",
  ].join("\n");
}

export const funnelPercent = (value: number, previous: number) =>
  previous > 0 ? Math.round((value / previous) * 100) : 0;

const DEFAULT_ACTIVITY_RANGE = activityDateRange("7d");
type Visit = {
  id: string;
  draft_name: string;
  draft_phone: string;
  status: string;
  first_seen_at: string;
  source: string;
  lead_phone_number?: string;
};
export function parseWhatsAppMeeting(message: string) {
  const value = message.replace(/\r/g, "");
  const field = (label: string) =>
    value.match(new RegExp(`^\\s*${label}\\s*[:：-]\\s*(.+)$`, "im"))?.[1]?.trim() || "";
  const zoomUrl = value.match(/https:\/\/[^\s\])>]*zoom\.us\/[^\s\])>]*/i)?.[0] || "";
  const combined = value.match(/^\s*Meeting\s*ID\s*[:：-]\s*(.+?)\s+Passcode\s*[:：-]\s*(.+?)\|?\s*$/im);
  return {
    topic: field("Topic"),
    date: field("Date"),
    time: field("Time"),
    meetingId: combined?.[1]?.trim() || field("Meeting\\s*ID"),
    passcode: (combined?.[2]?.trim() || field("Passcode")).replace(/\|$/, "").trim(),
    destinationUrl: zoomUrl,
  };
}
export function MeetingTrackerPage() {
  const [links, setLinks] = useState<MeetingLink[]>([]),
    [visits, setVisits] = useState<Visit[]>([]),
    [summary, setSummary] = useState<any>({});
  const [url, setUrl] = useState(""),
    [message, setMessage] = useState(""),
    [topic, setTopic] = useState(""),
    [meetingDate, setMeetingDate] = useState(""),
    [meetingTime, setMeetingTime] = useState(""),
    [meetingId, setMeetingId] = useState(""),
    [passcode, setPasscode] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(DEFAULT_ACTIVITY_RANGE.from),
    [to, setTo] = useState(DEFAULT_ACTIVITY_RANGE.to);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [detail, setDetail] = useState<any>(null),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [view, setView] = useState<"meeting" | "editor" | "activity">("meeting");
  const [manualOpen, setManualOpen] = useState(false);
  const [activityPreset, setActivityPreset] = useState<ActivityPreset>("7d");
  const [activityRangeLabel, setActivityRangeLabel] = useState(
    DEFAULT_ACTIVITY_RANGE.label,
  );
  const generation = useRef(0),
    closeButton = useRef<HTMLButtonElement>(null);
  const publicUrl = `${location.origin}/join`;
  const active = links.find((l) => l.status === "ACTIVE");
  const invitationMessage = active
    ? buildInvitationMessage(active, publicUrl)
    : "";
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(invitationMessage)}`;
  const displayedVisits = useMemo(
    () =>
      [...visits].sort((a, b) => {
        const namedDifference = Number(Boolean(b.draft_name)) - Number(Boolean(a.draft_name));
        if (namedDifference) return namedDifference;
        return new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime();
      }),
    [visits],
  );

  function selectActivityRange(preset: Exclude<ActivityPreset, "custom">) {
    const range = activityDateRange(preset);
    setActivityPreset(preset);
    setActivityRangeLabel(range.label);
    setFrom(range.from);
    setTo(range.to);
    setPage(0);
  }

  function selectCustomDate(nextFrom: string, nextTo: string) {
    setActivityPreset("custom");
    setActivityRangeLabel(
      nextFrom && nextTo
        ? `${readableDate(nextFrom)}–${readableDate(nextTo)}`
        : "Custom date range",
    );
    setFrom(nextFrom);
    setTo(nextTo);
    setPage(0);
  }
  function switchView(next: "meeting" | "editor" | "activity") {
    if (next === "editor" && active && !url && !message) {
      setUrl(active.destination_url);
      setTopic(active.topic);
      setMeetingDate(active.meeting_date);
      setMeetingTime(active.meeting_time);
      setMeetingId(active.meeting_id || "");
      setPasscode(active.passcode || "");
    }
    if (next === "editor" && active) setManualOpen(true);
    setView(next);
    setEditorOpen(next === "editor");
    requestAnimationFrame(() => document.querySelector('.page-main')?.scrollTo({ top: 0 }));
  }
  async function refresh() {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (status) q.set("status", status);
      if (from) q.set("from", new Date(`${from}T00:00:00`).toISOString());
      if (to) q.set("to", new Date(`${to}T23:59:59.999`).toISOString());
      const [l, s, v] = await Promise.all([
        apiRequest("/api/meetings/links"),
        apiRequest(`/api/meetings/summary?${q}`),
        apiRequest(`/api/meetings/visits?${q}&offset=${page * 50}&limit=50`),
      ]);
      if (current === generation.current) {
        setLinks(l);
        setSummary(s);
        setVisits(v.items);
        setTotal(v.total);
      }
    } catch (e: any) {
      if (current === generation.current) setError(e.message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    const id = setTimeout(() => void refresh(), 200);
    return () => clearTimeout(id);
  }, [search, status, from, to, page]);
  useEffect(() => {
    if (detail) closeButton.current?.focus();
  }, [detail]);
  function parseMessage() {
    const parsed = parseWhatsAppMeeting(message);
    setManualOpen(true);
    setTopic(parsed.topic);
    setMeetingDate(parsed.date);
    setMeetingTime(parsed.time);
    setMeetingId(parsed.meetingId);
    setPasscode(parsed.passcode);
    setUrl(parsed.destinationUrl);
    setNotice(parsed.destinationUrl && parsed.topic ? "Message parsed. Check the details, then save the session." : "Some details could not be found. Fill in the missing fields below.");
  }
  async function change(destinationUrl?: string, id?: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        id ? `/api/meetings/links/${id}/disable` : "/api/meetings/links",
        {
          method: "POST",
          body: JSON.stringify({
            destinationUrl,
            topic,
            date: meetingDate,
            time: meetingTime,
            meetingId,
            passcode,
          }),
        },
      );
      setUrl("");
      setMessage("");
      setEditorOpen(false);
      setView("meeting");
      setManualOpen(false);
      setNotice(
        id
          ? "The session link is paused."
          : "Zoom link updated. Your public share link stays the same.",
      );
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function inspect(id: string) {
    try {
      setDetail(await apiRequest(`/api/meetings/visits/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  }
  return (
    <div className={`tracker tracker-view-${view}`}>
      <header className="tracker-header">
        <div>
          <h1>Zoom Invitations</h1>
          <p>Paste the meeting message, share one link, and see who responded.</p>
        </div>
      </header>
      <nav className="invitation-view-nav" aria-label="Invitation sections">
        {([['meeting', 'Meeting & share'], ['editor', 'Edit invitation'], ['activity', 'Visitor activity']] as const).map(([key, label]) => <button type="button" key={key} aria-current={view === key ? 'page' : undefined} onClick={() => switchView(key)}>{label}</button>)}
      </nav>
      {error && (
        <div role="alert" className="meeting-error">
          {error} <button onClick={refresh}>Retry</button>
        </div>
      )}
      {notice && (
        <div role="status" className="tracker-notice">
          {notice}
        </div>
      )}
      <div className="invitation-workbench" hidden={view === "activity"}>
      <section className="session-overview" hidden={view !== "meeting"}>
        <div className="session-overview-top"><span className="session-state">{active ? '● Invitation is live' : '○ No active meeting'}</span><span>ZOOM SESSION</span></div>
        <h2>{active?.topic || 'Your next gathering starts here.'}</h2>
        <div className="session-overview-meta"><div><span>Date</span><strong>{active?.meeting_date || 'Set a date'}</strong></div><div><span>Time</span><strong>{active?.meeting_time || 'Set a time'}</strong></div></div>
        <div className="session-share"><label htmlFor="invitation-share-url">Your invitation link</label><input id="invitation-share-url" readOnly value={publicUrl}/><p>The same invitation link works whenever you update the meeting.</p></div>
        {active && <details className="whatsapp-message-preview"><summary>Preview WhatsApp invitation</summary><pre>{invitationMessage}</pre></details>}
        <div className="session-overview-actions">
          {active && <a className="tracker-button primary whatsapp-share-button" href={whatsappShareUrl} target="_blank" rel="noreferrer">Share on WhatsApp ↗</a>}
          <button type="button" className="tracker-button" onClick={() => switchView("editor")}>{active ? 'Update meeting' : 'Create invitation'}</button>
          <a href="/join" target="_blank" rel="noreferrer" className="tracker-button">Preview join page ↗</a>
          {active && <button type="button" className="tracker-button" disabled={busy} onClick={() => change(undefined, active.id)}>Pause link</button>}
        </div>
        <details className="session-technical"><summary>Zoom connection details</summary><p className="tracker-link">{active?.destination_url || 'No meeting published yet'}</p><p>Meeting ID: {active?.meeting_id || '—'} · Passcode: {active?.passcode || '—'}</p></details>
      </section>
      <section className={`tracker-panel session-editor${editorOpen ? ' is-open' : ''}`} hidden={view !== "editor"}>
        <header className="session-editor-heading"><span>01 / PREPARE YOUR INVITATION</span><h2>Paste. Check. Share.</h2><p>Start with the WhatsApp message. We’ll fill in the meeting details for you.</p></header>
        <div className="message-parser">
          <label>
            Paste the complete WhatsApp message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={"Topic: Mind, Body and Soul\nDate: 7th Sep 2026\nTime: 7:30am\nJoin Zoom Meeting\nhttps://…zoom.us/j/…\nMeeting ID: 816 0793 8844 Passcode: 1234"}
            />
          </label>
          <button type="button" className="tracker-button" disabled={!message.trim()} onClick={parseMessage}>
            Read message
          </button>
        </div>
        <button type="button" className="manual-toggle" aria-expanded={manualOpen} onClick={() => setManualOpen(!manualOpen)}>{manualOpen ? 'Hide meeting fields ↑' : 'Or enter meeting details manually →'}</button>
        <form
          hidden={!manualOpen}
          className="tracker-session-form"
          onSubmit={(e) => {
            e.preventDefault();
            void change(url);
          }}
        >
          <label className="tracker-wide">
            Paste a Zoom meeting link
            <input
              type="url"
              required
              value={url}
              maxLength={2048}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…zoom.us/j/…"
            />
          </label>
          <label>
            Topic
            <input required value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)} placeholder="Mind, Body and Soul" />
          </label>
          <label>
            Date
            <input required value={meetingDate} maxLength={80} onChange={(e) => setMeetingDate(e.target.value)} placeholder="7th Sep 2026" />
          </label>
          <label>
            Time
            <input required value={meetingTime} maxLength={80} onChange={(e) => setMeetingTime(e.target.value)} placeholder="7:30am" />
          </label>
          <label>
            Meeting ID
            <input value={meetingId} maxLength={80} onChange={(e) => setMeetingId(e.target.value)} placeholder="816 0793 8844" />
          </label>
          <label>
            Passcode
            <input value={passcode} maxLength={100} onChange={(e) => setPasscode(e.target.value)} placeholder="1234" />
          </label>
          <div className="tracker-form-actions">
          <button className="tracker-button primary" disabled={busy}>
            {busy ? "Saving…" : "Save session"}
          </button>
          </div>
        </form>
        <details>
          <summary>Link history ({links.length})</summary>
          {links.map((l) => (
            <div className="tracker-history" key={l.id}>
              <strong>
                {l.status === "ACTIVE" ? "Active" : "Inactive"} ·{" "}
                {time(l.created_at)}
              </strong>
              <div className="tracker-link">{l.destination_url}</div>
              <div className="tracker-link">
                {l.topic} · {l.meeting_date} · {l.meeting_time}
              </div>
            </div>
          ))}
        </details>
      </section>
      </div>
      <div className="invitation-activity" hidden={view !== "activity"}>
      <header className="activity-heading">
        <div>
          <span>02 / FOLLOW THE RESPONSE</span>
          <h2>Invitation activity</h2>
          <p>See how people moved from opening the invitation to opening Zoom.</p>
        </div>
        <div className="activity-range-summary">
          <span>SHOWING</span>
          <strong>{activityRangeLabel}</strong>
        </div>
      </header>
      <nav className="activity-periods" aria-label="Activity date range">
        {([
          ["today", "Today"],
          ["7d", "7 days"],
          ["30d", "30 days"],
          ["all", "All time"],
        ] as const).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={activityPreset === value}
            onClick={() => selectActivityRange(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="tracker-panel visitor-filters">
        <div className="tracker-controls">
          <label>
            Search visitors
            <input
              type="search"
              value={search}
              placeholder="Name or phone number"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Progress
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All visitors</option>
              {Object.entries(labels).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input
              aria-label="From date"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                selectCustomDate(e.target.value, to);
              }}
            />
          </label>
          <label>
            To
            <input
              aria-label="To date"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                selectCustomDate(from, e.target.value);
              }}
            />
          </label>
          <button className="tracker-button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </section>
      <section className="activity-funnel-panel" aria-label="Visitor funnel">
        <header>
          <div><span>RESPONSE JOURNEY</span><h3>From invitation to Zoom</h3></div>
          <div className="page-view-total"><span>Page views</span><strong>{loading ? "—" : (summary.totalVisits ?? 0)}</strong><small>Includes repeat opens</small></div>
        </header>
        <div className="activity-funnel">
          {[
            ["uniqueVisits", "Unique visitors", "Opened the invitation"],
            ["intentClicks", "Join clicks", "Wanted to continue"],
            ["registrations", "Details saved", "Shared their details"],
            ["joinClicks", "Opened Zoom", "Pressed the final button"],
          ].map(([key, label, description], index, steps) => {
            const value = Number(summary[key] ?? 0);
            const previous = index
              ? Number(summary[steps[index - 1][0]] ?? 0)
              : value;
            return (
              <div className="funnel-step" key={key}>
                <span className="funnel-number">0{index + 1}</span>
                <strong>{loading ? "—" : value}</strong>
                <h4>{label}</h4>
                <p>{description}</p>
                <small>{index ? `${funnelPercent(value, previous)}% from previous step` : "Distinct browsers"}</small>
              </div>
            );
          })}
        </div>
        <p className="activity-definition">“Opened Zoom” records the final button click. Zoom attendance itself is not available here.</p>
      </section>
      <section className="tracker-panel tracker-visitor-panel">
        <h2>Who responded</h2>
        <p>
          See who opened the invitation, shared their details, and pressed the
          final Zoom button.
        </p>
        <div className="tracker-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Phone</th>
                <th>Progress</th>
                <th>First visit</th>
                <th>Source</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                displayedVisits.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Visitor">{v.draft_name || "Anonymous visitor"}</td>
                    <td data-label="Phone">{v.draft_phone || "Not provided"}</td>
                    <td data-label="Progress">
                      <span className="tracker-status">
                        {labels[v.status] || v.status}
                      </span>
                    </td>
                    <td data-label="First visit">{time(v.first_seen_at)}</td>
                    <td data-label="Source">{v.source}</td>
                    <td data-label="Details">
                      <button
                        className="tracker-button"
                        onClick={() => inspect(v.id)}
                      >
                        View timeline
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <div className="tracker-empty" role="status">
            Loading visitor activity…
          </div>
        ) : !visits.length ? (
          <div className="tracker-empty">
            No visits match these filters. Share your invitation link to get
            started.
          </div>
        ) : null}
        <div className="tracker-controls" style={{ marginTop: 18 }}>
          <span>{total} matching visits</span>
          <button
            className="tracker-button"
            disabled={!page || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <button
            className="tracker-button"
            disabled={(page + 1) * 50 >= total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>
      </div>
      {detail && (
        <div className="tracker-modal" onClick={() => setDetail(null)}>
          <section
            className="tracker-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visit-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setDetail(null);
              if (e.key === "Tab") {
                const items =
                  e.currentTarget.querySelectorAll<HTMLElement>("button,a");
                const first = items[0],
                  last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              ref={closeButton}
              className="tracker-button"
              onClick={() => setDetail(null)}
            >
              Close
            </button>
            <h2 id="visit-title" style={{ marginTop: 28 }}>
              {detail.visit.draft_name || "Anonymous visitor"}
            </h2>
            <p>{detail.visit.draft_phone || "Phone not provided"}</p>
            <span className="tracker-status">
              {labels[detail.visit.status]}
            </span>
            {detail.visit.lead_phone_number && (
              <p>
                <Link to={`/crm/leads/${detail.visit.lead_phone_number}`}>
                  Open CRM lead →
                </Link>
              </p>
            )}
            <ol>
              {detail.events.map((e: any, i: number) => (
                <li key={i}>
                  {(
                    {
                      VISIT: "Opened invitation page",
                      INTENT: "Clicked Join Zoom",
                      DRAFT_SAVED: "Started entering details",
                      REGISTERED: "Confirmed details",
                      JOINED: "Clicked Open Zoom Meeting",
                    } as any
                  )[e.event_type] || e.event_type}
                  <small>{time(e.created_at)}</small>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
