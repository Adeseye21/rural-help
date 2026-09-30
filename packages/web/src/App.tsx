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

export function App() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<AuthResult | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return <SignedIn session={session} onSignOut={() => setSession(null)} />;
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
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
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
    </main>
  );
}

type Question = { id: string; text: string; options: string[] };

type AssessResult = {
  isEmergency: boolean;
  emergencyLabel?: string;
  safetyGuidance?: string;
  categories: string[];
  possibleCauses: string[];
  questions: Question[];
  nextStep: string;
  disclaimer: string;
};

type RefineResult = {
  urgency: "routine" | "urgent";
  urgencyReason?: string;
  notes: string[];
  nextStep: string;
  disclaimer: string;
};

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

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    background: "#f3f4f6",
    fontFamily: `"Segoe UI", system-ui, sans-serif`,
    color: "#1f2937",
    padding: 24
  },
  title: { fontSize: 34, letterSpacing: -0.5, color: "#115d55", margin: 0 },
  subtitle: { color: "#6b7280", fontSize: 15, marginTop: 4 },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)",
    padding: 24,
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  cardTitle: { fontSize: 18, fontWeight: 600, margin: 0 },
  line: { fontSize: 15, margin: 0, color: "#1f2937" },
  formBlock: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 14, fontWeight: 600 },
  consentRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 14 },
  input: {
    fontFamily: "inherit",
    fontSize: 16,
    padding: "12px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: 10,
    outline: "none"
  },
  primary: {
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 22px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  secondary: {
    background: "#ccfbf1",
    color: "#115d55",
    border: "none",
    borderRadius: 10,
    padding: "12px 22px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8
  },
  ghost: {
    background: "transparent",
    color: "#0f766e",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    padding: 4
  },
  error: { fontSize: 14, color: "#b91c1c", margin: 0 },
  status: { fontSize: 13, color: "#0f766e", margin: 0 },
  banner: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "8px 2px",
    color: "#7f1d1d",
    marginTop: 8
  },
  bannerText: { fontSize: 14, margin: "6px 0 0 0" }
};