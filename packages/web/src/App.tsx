import { useState, type CSSProperties, type FormEvent } from "react";

type AuthResult = {
  id: string;
  name?: string;
  role: string;
  accessToken: string;
  refreshToken: string;
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
    return (
      <main style={styles.main}>
        <h1 style={styles.title}>Rural Help</h1>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Signed in</h2>
          <p style={styles.line}>Name: {session.name ?? "—"}</p>
          <p style={styles.line}>Role: {session.role}</p>
          <button
            style={styles.secondary}
            onClick={() => setSession(null)}
          >
            Sign out
          </button>
        </div>
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

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
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
  error: { fontSize: 14, color: "#b91c1c", margin: 0 }
};