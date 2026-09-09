import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api/client";
import "./meetings.css";

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
  const [step, setStep] = useState(0),
    [available, setAvailable] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [saveState, setSaveState] = useState("");
  const context = useRef<{
    token: string;
    visitor: string;
    page: string;
  } | null>(null);
  if (!context.current) {
    // A new four-hour visit session lets returning guests register again on later days.
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
  const revision = useRef(0),
    draft = useRef({ name: "", phone: "" }),
    confirmed = useRef(false);
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
      setReady(true);
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    void initialize();
  }, []);
  async function saveDraft(keepalive = false) {
    if (
      !ready ||
      confirmed.current
    )
      return;
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
      if (!confirmed.current)
        setSaveState(
          "Could not save yet. Your details will be retried when you continue.",
        );
    }
  }
  useEffect(() => {
    if (step !== 1) return;
    const timeout = setTimeout(() => void saveDraft(), 400);
    return () => clearTimeout(timeout);
  }, [name, phone, step]);
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") void saveDraft(true);
    };
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
        <a href="/" className="join-brand">
          Lifestyle<span>Mantra</span>
          <small>WELLNESS, EVERY DAY.</small>
        </a>
        <a href="/">
          Back to website <span aria-hidden="true">↗</span>
        </a>
      </header>
      <div className="join-layout">
        <section className="join-story">
          <h1>
            A little time
            <br />
            for a <em>better you.</em>
          </h1>
          <p>
            Step into a space for healthier habits, meaningful guidance, and a
            community that grows with you.
          </p>
          <div className="join-art">
            <span>
              Small steps.
              <br />
              Lasting change.
            </span>
          </div>
          <div className="join-host">
            <span className="host-monogram">DB</span>
            <div>
              Your host<strong>Deepa Bhatia</strong>
              <small>Wellness coach · Lifestyle Mantra</small>
            </div>
          </div>
        </section>
        <section className="join-card" aria-label="Join your wellness session">
          <ol className="join-steps" aria-label="Your progress">
            {["Welcome", "Your details", "Join session"].map((s, i) => (
              <li
                key={s}
                aria-current={step === i ? "step" : undefined}
                className={step >= i ? "active" : ""}
              >
                <span>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="join-content" key={step}>
            {step === 0 && (
              <>
                <h2>
                  Your next step
                  <br />
                  starts here.
                </h2>
                <p>
                  Join our wellness session on Zoom. Take a moment for yourself
                  — we’ll see you inside.
                </p>
                <div className="session-note">
                  <span className="session-dot" />{" "}
                  {available === null
                    ? "Getting your session ready…"
                    : available
                      ? "Your session link is ready"
                      : "The next session link is on its way"}
                </div>
                <button
                  className="meeting-primary"
                  disabled={!ready || !available || busy}
                  onClick={() => act("intent")}
                >
                  {busy ? "One moment…" : "Join Zoom"}{" "}
                  <span aria-hidden="true">↗</span>
                </button>
                <small className="join-caption">
                  A quick introduction, then you’re ready to join.
                </small>
              </>
            )}
            {step === 1 && (
              <>
                <h2>
                  Let’s get to
                  <br />
                  know you.
                </h2>
                <p>
                  Share your name and phone number so your host can welcome you.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act("register");
                  }}
                >
                  <p className="join-privacy">
                    As you type, your details are saved for your coach to help
                    with registration and follow-up, even if you leave before
                    finishing.
                  </p>
                  <label>
                    Full name
                    <input
                      autoFocus
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={name}
                      placeholder="Your full name"
                      onChange={(e) => {
                        setName(e.target.value);
                        draft.current.name = e.target.value;
                      }}
                      onBlur={() => void saveDraft()}
                    />
                  </label>
                  <label>
                    Phone / WhatsApp number
                    <input
                      required
                      maxLength={30}
                      autoComplete="tel"
                      inputMode="tel"
                      value={phone}
                      placeholder="+91 98765 43210"
                      onChange={(e) => {
                        setPhone(e.target.value);
                        draft.current.phone = e.target.value;
                      }}
                      onBlur={() => void saveDraft()}
                    />
                  </label>
                  <small className="draft-state" role="status">
                    {saveState ||
                      "Your details are shared only with your coach."}
                  </small>
                  <button className="meeting-primary" disabled={busy}>
                    {busy ? "Confirming…" : "Continue to session"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                </form>
              </>
            )}
            {step === 2 && (
              <>
                <div className="join-check" aria-hidden="true">
                  ✓
                </div>
                <h2>You’re all set.</h2>
                <p>
                  Your details have been saved. Open Zoom whenever you’re ready
                  to join your session.
                </p>
                <button
                  className="meeting-primary"
                  disabled={busy}
                  onClick={() => act("join")}
                >
                  {busy ? "Opening Zoom…" : "Open Zoom Meeting"}{" "}
                  <span aria-hidden="true">↗</span>
                </button>
                <small className="join-caption">
                  Zoom will open in this tab or in the Zoom app.
                </small>
              </>
            )}
            {error && (
              <div className="meeting-error" role="alert">
                {error}
                {!ready && <button onClick={initialize}>Try again</button>}
              </div>
            )}
          </div>
          <footer className="join-card-footer">
            A welcoming space. A healthier tomorrow.
          </footer>
        </section>
      </div>
      <footer className="join-footer">
        <span>© {new Date().getFullYear()} Lifestyle Mantra</span>
        <span>Page visits and session button clicks are recorded.</span>
      </footer>
    </main>
  );
}
