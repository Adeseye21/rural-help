import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

type AuthResult = {
  id: string;
  name?: string;
  role: string;
  accessToken: string;
  refreshToken: string;
};

type Profile = {
  dateOfBirth: string | null;
  bloodType: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencySummary: string | null;
  shareLocation: boolean;
  allowEmergencyAccess: boolean;
};

const SESSION_KEY = "ruralhelp.session";

function storeSession(s: AuthResult, remember: boolean) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(s));
}

function readSession(): AuthResult | null {
  const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResult;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function App() {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [resetCode, setResetCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<AuthResult | null>(null);

  const saveSession = (s: AuthResult, rememberChecked: boolean) => storeSession(s, rememberChecked);

  useEffect(() => {
    const stored = readSession();
    if (!stored) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: stored.refreshToken })
        });
        const data = await res.json();
        if (res.ok) {
          const next = {
            id: data.id,
            name: stored.name,
            role: data.role,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          } as AuthResult;
          setSession(next);
          storeSession(next, true);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    })();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = mode === "register" ? { name, email, password } : { email, password };
      const url = `/api/auth/${mode}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      setSession(data as AuthResult);
      saveSession(data as AuthResult, remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function sendResetCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (data.devCode) setDevCode(data.devCode);
      setResetStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function finishReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResetStep("email");
      setMode("login");
      setDevCode("");
      setResetCode("");
      setPassword("");
      setError("");
      alert(data.message ?? "Password updated. You can now sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    const s = readSession();
    clearSession();
    setSession(null);
    if (s) {
      void fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: s.refreshToken })
      }).catch(() => void 0);
    }
  }

  if (session) {
    return <SignedIn session={session} onSignOut={signOut} />;
  }

  if (mode === "reset") {
    return (
      <main style={styles.main}>
        <h1 style={styles.title}>Rural Help</h1>
        <p style={styles.subtitle}>Reset your password</p>
        <form style={styles.card} onSubmit={resetStep === "email" ? sendResetCode : finishReset}>
          <h2 style={styles.cardTitle}>Forgot password</h2>
          {resetStep === "email" ? (
            <>
              <input
                style={styles.input}
                type="email"
                placeholder="Email you registered with"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.primary} disabled={busy}>
                {busy ? "Please wait..." : "Send reset code"}
              </button>
            </>
          ) : (
            <>
              {devCode && (
                <div style={styles.codeBox}>
                  <p style={styles.status}>Dev mode reset code (no email is sent yet):</p>
                  <p style={styles.code}>{devCode}</p>
                </div>
              )}
              <input
                style={styles.input}
                placeholder="Reset code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
              />
              <div style={styles.passwordWrap}>
                <input
                  style={{ ...styles.input, paddingRight: 76 }}
                  type={showPassword ? "text" : "password"}
                  placeholder="New password (8+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.primary} disabled={busy}>
                {busy ? "Please wait..." : "Set new password"}
              </button>
            </>
          )}
          <button
            type="button"
            style={styles.ghost}
            onClick={() => {
              setMode("login");
              setResetStep("email");
              setDevCode("");
              setResetCode("");
              setError("");
            }}
          >
            Back to sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Rural Help</h1>
      <p style={styles.subtitle}>AI-assisted healthcare support for rural communities</p>
      <form style={styles.card} onSubmit={submit}>
        <h2 style={styles.cardTitle}>{mode === "login" ? "Sign in" : "Create account"}</h2>
        {mode === "register" && (
          <input
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        )}
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div style={styles.passwordWrap}>
          <input
            style={{ ...styles.input, paddingRight: 76 }}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="button"
            style={styles.passwordToggle}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <label style={styles.consentRow}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Stay logged in on this device</span>
        </label>
        {mode === "login" && (
          <button
            type="button"
            style={styles.ghost}
            onClick={() => {
              setMode("reset");
              setError("");
            }}
          >
            Forgot password?
          </button>
        )}
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.primary} disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          style={styles.ghost}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

function SignedIn({ session, onSignOut }: { session: AuthResult; onSignOut: () => void }) {
  const [summary, setSummary] = useState("");
  const [contact, setContact] = useState("");
  const [shareLocation, setShareLocation] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/patient/profile", { headers: { Authorization: `Bearer ${session.accessToken}` } })
      .then((r) => r.json())
      .then((p: Profile | null) => {
        setSummary(p?.emergencySummary ?? "");
        setContact(p?.emergencyContactPhone ?? "");
        setShareLocation(p?.shareLocation ?? false);
      })
      .catch(() => void 0);
  }, [session.accessToken]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/patient/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({ emergencySummary: summary, emergencyContactPhone: contact, shareLocation })
    });
    if (res.ok) {
      setMsg("Saved. This is your emergency information — you decide what is shared.");
    } else {
      const data = await res.json();
      setMsg(data.error ?? "Could not save");
    }
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Rural Help</h1>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Your profile</h2>
        <p style={styles.line}>Name: {session.name ?? "—"}</p>
        <p style={styles.line}>Role: {session.role}</p>
        <form onSubmit={save} style={styles.formBlock}>
          <label style={styles.label} htmlFor="summary">Emergency summary</label>
          <textarea
            id="summary"
            style={styles.input}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Allergies, medicines, important conditions"
          />
          <label style={styles.label} htmlFor="contact">Emergency contact phone</label>
          <input
            id="contact"
            style={styles.input}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. 08012345678"
          />
          <label style={styles.consentRow}>
            <input
              type="checkbox"
              checked={shareLocation}
              onChange={(e) => setShareLocation(e.target.checked)}
            />
            <span>Allow location use to find nearby services</span>
          </label>
          {msg && <p style={styles.status}>{msg}</p>}
          <button style={styles.primary} type="submit">Save emergency information</button>
        </form>
        <button style={styles.secondary} type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
      <SymptomGuidance token={session.accessToken} />
      <FirstAidGuides token={session.accessToken} />
    </main>
  );
}

type Question = { id: string; text: string; options: string[] };

type FirstAid = {
  key: string;
  title: string;
  whenToUse: string;
  steps: string[];
  avoid: string[];
};

type AssessResult = {
  isEmergency: boolean;
  emergencyLabel?: string;
  safetyGuidance?: string;
  firstAid?: FirstAid;
  categories: string[];
  possibleCauses: string[];
  questions: Question[];
  nextStep: string;
  disclaimer: string;
};

type RefineResult = {
  urgency: "routine" | "urgent";
  urgencyReason?: string;
  firstAid?: FirstAid;
  notes: string[];
  nextStep: string;
  disclaimer: string;
};

function FirstAidBlock({ topic }: { topic: FirstAid }) {
  return (
    <div style={styles.firstAid}>
      <p style={styles.firstAidTitle}>First aid: {topic.title}</p>
      <p style={styles.status}>{topic.whenToUse}</p>
      <ol style={styles.stepList}>
        {topic.steps.map((s) => (
          <li key={s} style={styles.step}>{s}</li>
        ))}
      </ol>
      <p style={styles.avoidTitle}>Do not:</p>
      <ul style={styles.stepList}>
        {topic.avoid.map((s) => (
          <li key={s} style={styles.step}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function SymptomGuidance({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssessResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refined, setRefined] = useState<RefineResult | null>(null);
  const [err, setErr] = useState("");

  async function assess() {
    if (text.trim().length < 3) return;
    setBusy(true);
    setErr("");
    setRefined(null);
    try {
      const res = await fetch("/api/symptom/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Could not get guidance");
      else {
        setResult(data);
        setAnswers({});
      }
    } catch {
      setErr("Network problem. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function refine() {
    if (!result) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/symptom/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categories: result.categories, answers })
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error ?? "Could not refine");
      else setRefined(data);
    } catch {
      setErr("Network problem. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Symptom guidance</h2>
      <p style={styles.subtitle}>
        Describe what is bothering you. This gives information, not a diagnosis.
      </p>
      <textarea
        style={styles.input}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. I have had a fever and headache since yesterday"
      />
      <button style={styles.primary} type="button" onClick={assess} disabled={busy}>
        {busy ? "Working…" : "Get guidance"}
      </button>
      {err && <p style={styles.error}>{err}</p>}
      {result?.isEmergency && (
        <div style={styles.banner}>
          <strong>{result.emergencyLabel}</strong>
          <p style={styles.bannerText}>{result.safetyGuidance}</p>
          <p style={styles.bannerText}>{result.nextStep}</p>
          {result.firstAid && <FirstAidBlock topic={result.firstAid} />}
        </div>
      )}
      {result && !result.isEmergency && (
        <>
          <div style={styles.formBlock}>
            <p style={styles.label}>Possible causes to consider</p>
            {result.possibleCauses.map((c) => (
              <p key={c} style={styles.line}>{c}</p>
            ))}
          </div>
          <p style={styles.label}>A few questions</p>
          {result.questions.map((q) => (
            <div key={q.id} style={styles.formBlock}>
              <p style={styles.line}>{q.text}</p>
              {q.options.map((opt) => (
                <label key={opt} style={styles.consentRow}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button style={styles.primary} type="button" onClick={refine} disabled={busy}>
            Refine my guidance
          </button>
          {refined && (
            <div style={styles.formBlock}>
              {refined.urgency === "urgent" && (
                <div style={styles.banner}>
                  <strong>Urgent</strong>
                  <p style={styles.bannerText}>{refined.urgencyReason}</p>
                  {refined.firstAid && <FirstAidBlock topic={refined.firstAid} />}
                </div>
              )}
              {refined.notes.map((n) => (
                <p key={n} style={styles.line}>{n}</p>
              ))}
              <p style={styles.line}>{refined.nextStep}</p>
            </div>
          )}
        </>
      )}
      {result?.disclaimer && <p style={styles.status}>{result.disclaimer}</p>}
    </div>
  );
}

function FirstAidGuides({ token }: { token: string }) {
  const [topics, setTopics] = useState<FirstAid[]>([]);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/symptom/first-aid", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.topics)) {
          setTopics(data.topics);
          setNote(data.note ?? "");
        } else {
          setErr(data?.error ?? "Could not load first-aid guides");
        }
      })
      .catch(() => setErr("Network problem. Try again."));
  }, [token]);

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>First-aid guides</h2>
      <p style={styles.subtitle}>Simple steps to take while you get to a health worker.</p>
      {err && <p style={styles.error}>{err}</p>}
      {topics.map((t) => (
        <details key={t.key} style={styles.details}>
          <summary style={styles.summary}>{t.title}</summary>
          <p style={styles.line}>{t.whenToUse}</p>
          <ol style={styles.stepList}>
            {t.steps.map((s) => (
              <li key={s} style={styles.step}>{s}</li>
            ))}
          </ol>
          <p style={styles.avoidTitle}>Do not:</p>
          <ul style={styles.stepList}>
            {t.avoid.map((s) => (
              <li key={s} style={styles.step}>{s}</li>
            ))}
          </ul>
        </details>
      ))}
      {note && <p style={styles.status}>{note}</p>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    background: "transparent",
    fontFamily: `"Inter", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif`,
    color: "#0f2e2b",
    padding: 24
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: -0.8,
    color: "#1F5C43",
    margin: 0
  },
  subtitle: { color: "#66736C", fontSize: 15, marginTop: 4, textAlign: "center" },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#FFFFFF",
    border: "1px solid #E3EAE5",
    borderRadius: 16,
    boxShadow: "0 1px 2px rgba(38,51,45,.04), 0 8px 20px rgba(38,51,45,.06)",
    padding: 26,
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  cardTitle: { fontSize: 20, fontWeight: 700, margin: 0, color: "#1F5C43" },
  line: { fontSize: 15, margin: 0, color: "#26332D" },
  formBlock: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 14, fontWeight: 600, color: "#1F5C43" },
  consentRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#26332D" },
  passwordWrap: { position: "relative" },
  passwordToggle: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#2E7D5B",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: 4
  },
  input: {
    fontFamily: "inherit",
    fontSize: 16,
    padding: "12px 14px",
    color: "#26332D",
    background: "#FFFFFF",
    border: "2px solid #DCE5DF",
    borderRadius: 12,
    outline: "none"
  },
  primary: {
    background: "#2E7D5B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "13px 22px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(46,125,91,.28)"
  },
  secondary: {
    background: "#FFFFFF",
    color: "#2E7D5B",
    border: "2px solid #2E7D5B",
    borderRadius: 12,
    padding: "12px 22px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    marginTop: 8
  },
  ghost: {
    background: "transparent",
    color: "#1F5C43",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    padding: 4,
    textAlign: "left"
  },
  error: { fontSize: 14, color: "#D9534F", margin: 0, fontWeight: 500 },
  status: { fontSize: 13, color: "#1F5C43", margin: 0 },
  codeBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    background: "#F1F8F2",
    border: "1px dashed #81C784",
    borderRadius: 12,
    padding: 12
  },
  code: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 6,
    color: "#1F5C43",
    margin: 0
  },
  banner: {
    background: "linear-gradient(180deg, #FDECEA 0%, #FBDAD7 100%)",
    border: "1px solid #D9534F",
    borderRadius: 12,
    padding: 14,
    color: "#8C2F2C",
    marginTop: 8,
    boxShadow: "0 4px 12px rgba(217,83,79,.2)"
  },
  bannerText: { fontSize: 14, margin: "6px 0 0 0" },
  firstAid: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(217,83,79,.4)",
    background: "rgba(255,255,255,.6)",
    borderRadius: 10,
    padding: 12
  },
  firstAidTitle: { fontSize: 15, fontWeight: 700, margin: 0, color: "#7F1D1D" },
  avoidTitle: { fontSize: 13, fontWeight: 700, margin: "8px 0 0 0", color: "#7F1D1D" },
  stepList: { margin: "6px 0 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 },
  step: { fontSize: 14, color: "#26332D" },
  details: {
    border: "1px solid #E3EAE5",
    borderRadius: 12,
    padding: "10px 12px",
    background: "#F7FAF7"
  },
  summary: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1F5C43",
    cursor: "pointer"
  }
};