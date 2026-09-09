import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api/client";
import "./meetings.css";

type Meeting = { topic: string; date: string; time: string; meetingId: string; passcode: string };

function identity(storageName: "localStorage" | "sessionStorage", key: string) {
  try {
    const storage = window[storageName];
    const old = storage.getItem(key);
    if (old) return old;
    const id = crypto.randomUUID();
    storage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function JoinPage() {
  const [step, setStep] = useState(0);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saveState, setSaveState] = useState("");
  const context = useRef<{ token: string; visitor: string; page: string } | null>(null);

  if (!context.current) {
    try {
      const started = Number(sessionStorage.getItem("lm-meeting-started"));
      if (!started || Date.now() - started > 4 * 60 * 60 * 1000) {
        sessionStorage.removeItem("lm-meeting-session");
        sessionStorage.setItem("lm-meeting-started", String(Date.now()));
      }
    } catch {}
    context.current = {
      token: identity("sessionStorage", "lm-meeting-session"),
      visitor: identity("localStorage", "lm-meeting-visitor"),
      page: crypto.randomUUID(),
    };
  }

  const revision = useRef(0);
  const draft = useRef({ name: "", phone: "" });
  const confirmed = useRef(false);
  const endpoint = `/api/public/meetings/visits/${context.current.token}`;

  async function initialize() {
    setError("");
    try {
      const q = new URLSearchParams(location.search);
      const [visit, status] = await Promise.all([
        apiRequest("/api/public/meetings/visits", {
          method: "POST",
          body: JSON.stringify({
            visitToken: context.current!.token,
            visitorId: context.current!.visitor,
            pageId: context.current!.page,
            source: q.get("utm_source")?.slice(0, 100) || "WhatsApp",
            campaign: q.get("utm_campaign")?.slice(0, 100) || "",
          }),
        }),
        apiRequest("/api/public/meetings/status"),
      ]);
      revision.current = visit.draft_revision;
      confirmed.current = visit.registered;
      if (visit.registered) setStep(2);
      setAvailable(status.available);
      setMeeting(status.meeting);
      setReady(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { void initialize(); }, []);

  async function saveDraft(keepalive = false) {
    if (!ready || confirmed.current) return;
    const rev = ++revision.current;
    setSaveState("Saving…");
    try {
      await apiRequest(`${endpoint}/draft`, {
        method: "PATCH",
        keepalive,
        body: JSON.stringify({ ...draft.current, revision: rev }),
      });
      if (rev === revision.current) setSaveState("Details saved");
    } catch {
      if (!confirmed.current) setSaveState("Could not save yet. We’ll retry when you continue.");
    }
  }

  useEffect(() => {
    if (step !== 1) return;
    const timeout = setTimeout(() => void saveDraft(), 400);
    return () => clearTimeout(timeout);
  }, [name, phone, step]);

  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") void saveDraft(true); };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [ready]);

  async function act(action: "intent" | "register" | "join") {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(`${endpoint}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "register" ? { name, phone } : {}),
      });
      if (action === "intent") setStep(1);
      if (action === "register") {
        confirmed.current = true;
        setStep(2);
      }
      if (action === "join") window.location.assign(result.destinationUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="join-page">
      <header className="join-header">
        <a href="/" className="join-brand">LIFESTYLE MANTRA<small>WELLNESS, EVERY DAY.</small></a>
        <a href="/">lifestylemantra.in</a>
      </header>

      <article className="invitation-card" aria-label="Join your wellness session">
        <div className="invitation-photo">
          <img src="/marketing/assets/lifestyle-mantra-sculpture.png" alt="Flowing Lifestyle Mantra sculpture" />
          <span>Live wellness session</span>
        </div>
        <div className="invitation-body">
          <p className="invitation-eyebrow">You’re invited</p>
          <h1>{meeting?.topic || "Wellness Session"}</h1>
          <div className="event-meta" aria-label="Session date and time">
            <div><span>Date</span><strong>{meeting?.date || "To be announced"}</strong></div>
            <div><span>Time</span><strong>{meeting?.time || "To be announced"}</strong></div>
          </div>

          {step === 0 && (
            <section className="invitation-step">
              <p>Reserve your place and continue to the live Zoom session.</p>
              <button className="meeting-primary" disabled={!ready || !available || busy} onClick={() => act("intent")}>
                {busy ? "One moment…" : "Continue to Join"}<span aria-hidden="true">→</span>
              </button>
              {available === false && <p className="session-unavailable">The next session details will be available soon.</p>}
            </section>
          )}

          {step === 1 && (
            <section className="invitation-step">
              <h2>Your details</h2>
              <p>Tell us who is joining today.</p>
              <form onSubmit={(e) => { e.preventDefault(); void act("register"); }}>
                <label>Full name
                  <input autoFocus required minLength={2} maxLength={100} autoComplete="name" value={name} placeholder="Your full name" onChange={(e) => { setName(e.target.value); draft.current.name = e.target.value; }} onBlur={() => void saveDraft()} />
                </label>
                <label>Phone / WhatsApp number
                  <input required maxLength={30} autoComplete="tel" inputMode="tel" value={phone} placeholder="+91 98765 43210" onChange={(e) => { setPhone(e.target.value); draft.current.phone = e.target.value; }} onBlur={() => void saveDraft()} />
                </label>
                <small className="draft-state" role="status">{saveState || "Your details are shared only with Lifestyle Mantra."}</small>
                <button className="meeting-primary" disabled={busy}>{busy ? "Confirming…" : "Continue"}<span aria-hidden="true">→</span></button>
              </form>
            </section>
          )}

          {step === 2 && (
            <section className="invitation-step invitation-ready">
              <span className="ready-mark" aria-hidden="true">✓</span>
              <h2>You’re ready to join</h2>
              <p>Your details are confirmed. The session will open in Zoom.</p>
              <button className="meeting-primary" disabled={busy || !available} onClick={() => act("join")}>
                {busy ? "Opening Zoom…" : "Join Meeting"}<span aria-hidden="true">↗</span>
              </button>
              {(meeting?.meetingId || meeting?.passcode) && (
                <div className="meeting-details">
                  {meeting.meetingId && <p><span>Meeting ID</span><strong>{meeting.meetingId}</strong></p>}
                  {meeting.passcode && <p><span>Passcode</span><strong>{meeting.passcode}</strong></p>}
                </div>
              )}
            </section>
          )}

          {error && <div className="meeting-error" role="alert">{error}{!ready && <button onClick={initialize}>Try again</button>}</div>}
        </div>
      </article>
      <footer className="join-footer">© {new Date().getFullYear()} Lifestyle Mantra</footer>
    </main>
  );
}
