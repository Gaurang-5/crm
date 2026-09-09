import { useEffect, useRef, useState } from "react";
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
type MeetingLink = {
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
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [detail, setDetail] = useState<any>(null),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0);
  const generation = useRef(0),
    closeButton = useRef<HTMLButtonElement>(null);
  const publicUrl = `${location.origin}/join`;
  const active = links.find((l) => l.status === "ACTIVE");
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
  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice("Public join link copied. Ready to paste into WhatsApp.");
    } catch {
      setNotice(`Copy this link: ${publicUrl}`);
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
    <div className="tracker">
      <header className="tracker-header">
        <div>
          <h1>Zoom Invitations</h1>
          <p>Paste the meeting message, share one link, and see who responded.</p>
        </div>
        <div className="tracker-controls">
          <a
            className="tracker-button"
            href="/join"
            target="_blank"
            rel="noreferrer"
          >
            Preview join page ↗
          </a>
          <button className="tracker-button primary" onClick={copy}>
            Copy invitation link
          </button>
        </div>
      </header>
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
      <section className="tracker-panel">
        <h2>Meeting details</h2>
        <p>
          Share <a href={publicUrl}>{publicUrl}</a> in your WhatsApp groups.
          Paste the message below whenever the meeting changes.
        </p>
        <p className="tracker-link">
          <strong>
            {active ? "Current Zoom meeting" : "No meeting published yet"}
          </strong>
          <br />
          {active?.destination_url ||
            "Paste a WhatsApp meeting message below to begin."}
        </p>
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
        <form
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
          {active && (
            <button
              type="button"
              className="tracker-button"
              disabled={busy}
              onClick={() => change(undefined, active.id)}
            >
              Pause link
            </button>
          )}
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
      <section className="tracker-panel">
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
                setFrom(e.target.value);
                setPage(0);
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
                setTo(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <button className="tracker-button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </section>
      <section className="tracker-metrics" aria-label="Visitor funnel">
        {[
          ["totalVisits", "Page visits"],
          ["uniqueVisits", "Unique browsers"],
          ["intentClicks", "Join clicks"],
          ["registrations", "Registered"],
          ["joinClicks", "Opened Zoom"],
        ].map(([key, label]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{loading ? "—" : (summary[key] ?? 0)}</strong>
          </div>
        ))}
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
                visits.map((v) => (
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
