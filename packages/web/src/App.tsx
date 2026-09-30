import { useEffect, useState, type CSSProperties } from "react";

export function App() {
  const [health, setHealth] = useState<string>("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setHealth(`${data.status} (database ${data.database})`))
      .catch(() => setHealth("offline"));
  }, []);

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Rural Help</h1>
      <p style={styles.subtitle}>AI-assisted healthcare support for rural communities</p>
      <div style={styles.card}>
        <label htmlFor="symptom" style={styles.label}>What is troubling you?</label>
        <textarea id="symptom" style={styles.input} placeholder="Describe your symptoms in your own words..." />
        <button style={styles.primary}>Show next step</button>
        <p style={styles.status}>API: {health}</p>
      </div>
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
    maxWidth: 420,
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
  label: { fontSize: 14, fontWeight: 600 },
  input: {
    fontFamily: "inherit",
    fontSize: 16,
    padding: "12px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
    minHeight: 90,
    resize: "vertical"
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
  status: { fontSize: 13, color: "#6b7280", margin: 0 }
};