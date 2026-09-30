import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent
} from "react";

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
  conditions: string[];
  medicines: string[];
  allergies: string[];
  shareLocation: boolean;
  allowEmergencyAccess: boolean;
};

const SESSION_KEY = "ruralhelp.session";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const SERVER_DOWN =
  "Cannot reach the Rural Help server. Make sure the API is running on port 3001, then try again.";

/**
 * Reads a response body without assuming it is JSON. A stopped API makes the
 * dev proxy answer with an empty body, which makes a bare res.json() throw
 * "Unexpected end of JSON input" instead of showing a useful message.
 */
export async function readJson(res: Response): Promise<any> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    return null;
  }
  if (text.trim().length === 0) {
    if (!res.ok) throw new ApiError(SERVER_DOWN, res.status);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) throw new ApiError(`Server error (${res.status}).`, res.status);
    return null;
  }
}

export async function api(
  url: string,
  options: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    throw new ApiError(SERVER_DOWN, 0);
  }
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(data?.error ?? `Request failed (${res.status}).`, res.status);
  return data;
}

function storeSession(s: AuthResult, remember: boolean) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(s));
}

const REMEMBER_KEY = "ruralhelp.remember";

function isPersistentSession(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

function setPersistentSession(value: boolean) {
  if (value) localStorage.setItem(REMEMBER_KEY, "1");
  else localStorage.removeItem(REMEMBER_KEY);
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
  const [resetNotice, setResetNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<AuthResult | null>(null);

  const saveSession = (s: AuthResult, rememberChecked: boolean) => storeSession(s, rememberChecked);

  useEffect(() => {
    const stored = readSession();
    if (!stored) return;
    (async () => {
      try {
        const data = await api("/api/auth/refresh", { method: "POST", body: { refreshToken: stored.refreshToken } });
        if (data) {
          const next = {
            id: data.id,
            name: stored.name,
            role: data.role,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          } as AuthResult;
          setSession(next);
          storeSession(next, isPersistentSession());
        } else {
          clearSession();
        }
      } catch {
        setSession(null);
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
      const data = await api(url, { method: "POST", body });
      setSession(data as AuthResult);
      setPersistentSession(remember);
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
      const data = await api("/api/auth/forgot-password", { method: "POST", body: { email } });
      if (data.devCode) setDevCode(data.devCode);
      setResetStep("code");
      if (!data.devCode) {
        setResetNotice(
          "If that email is registered, a reset code is on its way. It is valid for 30 minutes."
        );
      }
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
      const data = await api("/api/auth/reset-password", {
        method: "POST",
        body: { email, code: resetCode, password }
      });
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
    return <AppSignedIn session={session} onSignOut={signOut} />;
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
              {devCode ? (
                <div style={styles.codeBox}>
                  <p style={styles.status}>Local development reset code (no email is sent yet):</p>
                  <p style={styles.code}>{devCode}</p>
                </div>
              ) : (
                resetNotice && <p style={styles.status}>{resetNotice}</p>
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
              setResetNotice("");
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

function listToText(v: string[] | null | undefined) {
  return (v ?? []).join(", ");
}

function textToList(v: string) {
  return v
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ListEditor({
  id,
  label,
  hint,
  values,
  onChange
}: {
  id: string;
  label: string;
  hint: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState(listToText(values));
  useEffect(() => setText(listToText(values)), [values.join("|")]);

  return (
    <>
      <label style={styles.label} htmlFor={id}>
        {label}
      </label>
      <p style={styles.hint} id={`${id}-hint`}>
        {hint}
      </p>
      <textarea
        id={id}
        style={styles.input}
        rows={2}
        aria-describedby={`${id}-hint`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(textToList(e.target.value));
        }}
        placeholder="Separate each one with a comma"
      />
    </>
  );
}

function ProfileCard({
  session,
  onSaved,
  onSignOut
}: {
  session: AuthResult;
  onSaved: () => void;
  onSignOut: () => void;
}) {
  const [dob, setDob] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [summary, setSummary] = useState("");
  const [contactName, setContactName] = useState("");
  const [contact, setContact] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [shareLocation, setShareLocation] = useState(false);
  const [msg, setMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);
  const token = session.accessToken;

  useEffect(() => {
    (async () => {
      try {
        const p = (await api("/api/patient/profile", { token })) as Profile | null;
        setDob(p?.dateOfBirth ?? "");
        setBloodType(p?.bloodType ?? "");
        setSummary(p?.emergencySummary ?? "");
        setContactName(p?.emergencyContactName ?? "");
        setContact(p?.emergencyContactPhone ?? "");
        setConditions(p?.conditions ?? []);
        setMedicines(p?.medicines ?? []);
        setAllergies(p?.allergies ?? []);
        setShareLocation(p?.shareLocation ?? false);
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Could not load your profile");
      }
    })();
  }, [token]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setProfileError("");
    setSaving(true);
    try {
      await api("/api/patient/profile", {
        method: "PUT",
        token,
        body: {
          dateOfBirth: dob || null,
          bloodType: bloodType || null,
          emergencySummary: summary,
          emergencyContactName: contactName,
          emergencyContactPhone: contact,
          conditions,
          medicines,
          allergies,
          shareLocation
        }
      });
      setMsg("Saved. This is your health information — you decide what is shared.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={styles.card} aria-labelledby="profile-heading">
      <h2 style={styles.cardTitle} id="profile-heading">
        Your profile
      </h2>
      <p style={styles.line}>
        Name: {session.name ?? "—"} · Role: {session.role}
      </p>
      <p style={styles.hint}>
        Only you can see this. It is shared with a healthcare worker only if you approve a review request.
      </p>
      <form onSubmit={save} style={styles.formBlock}>
        <label style={styles.label} htmlFor="dob">
          Date of birth
        </label>
        <input
          id="dob"
          type="date"
          style={styles.input}
          value={dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDob(e.target.value)}
        />
        <label style={styles.label} htmlFor="blood">
          Blood type
        </label>
        <select id="blood" style={styles.input} value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
          <option value="">Not known</option>
          {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <ListEditor
          id="conditions"
          label="Ongoing health conditions"
          hint="For example: asthma, hypertension, diabetes."
          values={conditions}
          onChange={setConditions}
        />
        <ListEditor
          id="medicines"
          label="Medicines you are taking"
          hint="Include the dose if you know it, for example: amoxicillin 500mg, twice a day."
          values={medicines}
          onChange={setMedicines}
        />
        <ListEditor
          id="allergies"
          label="Allergies"
          hint="For example: penicillin, peanuts. Write none if you have none."
          values={allergies}
          onChange={setAllergies}
        />

        <label style={styles.label} htmlFor="summary">
          Emergency summary
        </label>
        <textarea
          id="summary"
          style={styles.input}
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Anything a helper should know quickly"
        />
        <label style={styles.label} htmlFor="contact-name">
          Emergency contact name
        </label>
        <input
          id="contact-name"
          style={styles.input}
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="e.g. Amina Bello"
        />
        <label style={styles.label} htmlFor="contact">
          Emergency contact phone
        </label>
        <input
          id="contact"
          style={styles.input}
          inputMode="tel"
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
        {profileError && <p style={styles.error}>{profileError}</p>}
        {msg && <p style={styles.status}>{msg}</p>}
        <button style={styles.primary} type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save my health information"}
        </button>
      </form>
      <button style={styles.secondary} type="button" onClick={onSignOut}>
        Sign out
      </button>
    </section>
  );
}

type TabId = "check" | "history" | "documents" | "visit" | "reminders" | "review" | "services" | "offline" | "profile";

const TABS: { id: TabId; label: string }[] = [
  { id: "check", label: "Check symptoms" },
  { id: "history", label: "My conversations" },
  { id: "documents", label: "My documents" },
  { id: "visit", label: "Visit preparation" },
  { id: "reminders", label: "Reminders" },
  { id: "review", label: "Professional review" },
  { id: "services", label: "Nearby services" },
  { id: "offline", label: "Offline pack" },
  { id: "profile", label: "My profile" }
];

function AppSignedIn({ session, onSignOut }: { session: AuthResult; onSignOut: () => void }) {
  const [tab, setTab] = useState<TabId>("check");
  const [reviewKey, setReviewKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resume, setResume] = useState<ResumeRequest | null>(null);
  const token = session.accessToken;

  const go = (next: TabId) => {
    setTab(next);
    setRefreshKey((k) => k + 1);
  };

  const resumeConversation = (item: ConversationItem) => {
    setResume({
      id: item.id,
      symptomText: item.symptomText,
      intakeMode: (["typed", "voice", "guided", "icons"] as const).includes(item.intakeMode as ResumeRequest["intakeMode"])
        ? (item.intakeMode as ResumeRequest["intakeMode"])
        : "typed"
    });
    setTab("check");
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Rural Help</h1>
      <p style={styles.subtitle}>Health information you can read, save, and share only when you choose.</p>

      <nav style={styles.nav} aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            style={tab === t.id ? styles.navActive : styles.navIdle}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => go(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "check" && (
        <SymptomGuidance
          token={token}
          onReviewCreated={() => setReviewKey((k) => k + 1)}
          onSaved={() => setRefreshKey((k) => k + 1)}
          onResumed={() => setResume(null)}
          resume={resume}
        />
      )}
      {tab === "history" && (
        <ConversationMemory token={token} refreshKey={refreshKey} onResume={resumeConversation} />
      )}
      {tab === "documents" && <HealthDocuments token={token} refreshKey={refreshKey} onChanged={() => setRefreshKey((k) => k + 1)} />}
      {tab === "visit" && <VisitPreparation token={token} refreshKey={refreshKey} />}
      {tab === "reminders" && <RemindersPanel token={token} refreshKey={refreshKey} onChanged={() => setRefreshKey((k) => k + 1)} />}
      {tab === "review" && <ReviewRequestCard token={token} refreshKey={reviewKey} />}
      {tab === "services" && <FacilitiesCard token={token} />}
      {tab === "offline" && <OfflinePackCard token={token} />}
      {tab === "profile" && <ProfileCard session={session} onSaved={() => setRefreshKey((k) => k + 1)} onSignOut={onSignOut} />}
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
  sources: SourceItem[];
  disclaimer: string;
};

type RefineResult = {
  urgency: "routine" | "urgent";
  urgencyReason?: string;
  firstAid?: FirstAid;
  notes: string[];
  nextStep: string;
  sources: SourceItem[];
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

const ICON_CHIPS = [
  { id: "fever", emoji: "🤒", label: "Fever or hot body", phrase: "I have a fever" },
  { id: "cough", emoji: "😮‍💨", label: "Cough", phrase: "I have a cough" },
  { id: "headache", emoji: "😣", label: "Headache", phrase: "I have a headache" },
  { id: "stomach_pain", emoji: "😖", label: "Stomach pain", phrase: "I have stomach pain" },
  { id: "diarrhea", emoji: "💧", label: "Diarrhoea", phrase: "I have diarrhoea" },
  { id: "injury", emoji: "🩹", label: "Injury or wound", phrase: "I have an injury" },
  { id: "rash", emoji: "🔴", label: "Rash", phrase: "I have a rash" },
  { id: "tiredness", emoji: "😴", label: "Tiredness", phrase: "I feel very tired" }
];

type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function createVoiceRecognition(): VoiceRecognition | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => VoiceRecognition;
    webkitSpeechRecognition?: new () => VoiceRecognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

type SourceItem = { title: string; detail: string; kind: string };

function SourcesBlock({ sources, title = "Where to learn more" }: { sources: SourceItem[]; title?: string }) {
  if (!sources || sources.length === 0) return null;
  return (
    <details style={styles.details}>
      <summary style={styles.summary}>{title}</summary>
      {sources.map((s) => (
        <div key={s.title} style={styles.reviewItem}>
          <p style={styles.line}>
            <strong>{s.title}</strong>
          </p>
          <p style={styles.line}>{s.detail}</p>
        </div>
      ))}
    </details>
  );
}

function EmergencySupportPanel({ token, contact }: { token: string; contact: Profile | null }) {
  const [facilities, setFacilities] = useState<FacilitiesResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api("/api/facilities", { token });
        if (active) setFacilities(data);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div style={styles.details}>
      <p style={styles.label}>If you cannot reach anyone</p>
      <p style={styles.line}>
        Call <strong>112</strong> from any phone. It works on most mobile networks even without credit.
      </p>
      {contact?.emergencyContactName && contact.emergencyContactPhone && (
        <p style={styles.line}>
          Your emergency contact is <strong>{contact.emergencyContactName}</strong> on {contact.emergencyContactPhone}.
        </p>
      )}
      {contact?.emergencySummary ? (
        <p style={styles.line}>Your emergency summary: {contact.emergencySummary}</p>
      ) : (
        <p style={styles.hint}>
          You have not saved an emergency summary yet. Add one in My profile so helpers can read it.
        </p>
      )}
      <p style={styles.label}>Where to go</p>
      {failed && <p style={styles.hint}>Could not load nearby services. Call 112 instead.</p>}
      {!failed && facilities === null && <p style={styles.hint}>Loading services…</p>}
      {facilities &&
        (facilities.facilities ?? []).slice(0, 3).map((f) => (
          <p key={f.id} style={styles.line}>
            <strong>{f.name}</strong> — {f.type} · {f.phone}
            {typeof f.distanceKm === "number" ? ` · about ${f.distanceKm} km` : ""}
          </p>
        ))}
      {facilities && facilities.facilities?.length === 0 && (
        <p style={styles.hint}>No services are listed yet. Call 112.</p>
      )}
    </div>
  );
}

function SymptomGuidance({
  token,
  onReviewCreated,
  onSaved,
  onResumed,
  resume
}: {
  token: string;
  onReviewCreated: () => void;
  onSaved: () => void;
  onResumed: () => void;
  resume: ResumeRequest | null;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"typed" | "voice" | "guided" | "icons">("typed");
  const [chips, setChips] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AssessResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refined, setRefined] = useState<RefineResult | null>(null);
  const [err, setErr] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const recognition = useRef<VoiceRecognition | null>(null);

  useEffect(() => {
    api("/api/patient/profile", { token })
      .then((p) => setProfile(p as Profile | null))
      .catch(() => setProfile(null));
  }, [token]);

  useEffect(() => {
    if (!resume) return;
    setText(resume.symptomText);
    setMode(resume.intakeMode);
    setChips([]);
    setResult(null);
    setRefined(null);
    setAnswers({});
    setSaveMsg("");
    setErr("");
    onResumed();
  }, [resume?.id]);

  function stopVoice() {
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
  }

  function startVoice() {
    setVoiceError("");
    const rec = createVoiceRecognition();
    if (!rec) {
      setVoiceError("This browser cannot listen. Type your answer instead.");
      return;
    }
    rec.lang = "en-NG";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i += 1) {
        transcript += e.results[i][0]?.transcript ?? "";
      }
      setText((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript.trim()));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setVoiceError("Listening stopped. Please type your answer instead.");
    };
    recognition.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setVoiceError("Could not start listening. Type your answer instead.");
    }
  }

  function toggleChip(phrase: string) {
    setChips((prev) => (prev.includes(phrase) ? prev.filter((p) => p !== phrase) : [...prev, phrase]));
  }

  function switchMode(next: "typed" | "voice" | "guided" | "icons") {
    stopVoice();
    setMode(next);
    setResult(null);
    setRefined(null);
    setAnswers({});
  }

  function composedText(): string {
    const parts: string[] = [];
    if (text.trim()) parts.push(text.trim());
    if (chips.length) parts.push(chips.join(". "));
    if (mode === "guided") parts.push(`It started ${answers["general_when"] ?? "recently"}.`);
    return parts.join(". ");
  }

  async function requestReview() {
    if (!result) return;
    setBusy(true);
    setErr("");
    try {
      await api("/api/review/requests", {
        method: "POST",
        token,
        body: {
          symptomText: composedText(),
          possibleCauses: result.possibleCauses,
          urgency: refined?.urgency ?? "routine",
          emergency: result.isEmergency
        }
      });
      setReviewMsg("Review request created. Open Professional review to approve sharing.");
      onReviewCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the review request");
    } finally {
      setBusy(false);
    }
  }

  async function saveConversation() {
    if (!result) return;
    setBusy(true);
    setErr("");
    setSaveMsg("");
    try {
      await api("/api/conversations", {
        method: "POST",
        token,
        body: {
          symptomText: composedText(),
          intakeMode: mode,
          categoryIds: result.categories,
          possibleCauses: result.possibleCauses,
          urgency: refined?.urgency ?? "routine",
          isEmergency: result.isEmergency,
          notes: [...Object.values(answers), ...(refined?.notes ?? [])]
        }
      });
      setSaveMsg("Saved to My conversations. You can pause it and continue later.");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save this conversation");
    } finally {
      setBusy(false);
    }
  }

  async function assess() {
    const payload = composedText();
    if (payload.trim().length < 3) {
      setErr("Tell us what is bothering you first.");
      return;
    }
    setBusy(true);
    setErr("");
    setRefined(null);
    try {
      const data = await api("/api/symptom/assess", { method: "POST", token, body: { text: payload } });
      setResult(data);
      setAnswers({});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not get guidance");
    } finally {
      setBusy(false);
    }
  }

  async function refine() {
    if (!result) return;
    setBusy(true);
    setErr("");
    try {
      const data = await api("/api/symptom/refine", {
        method: "POST",
        token,
        body: { categories: result.categories, answers }
      });
      setRefined(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not refine");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={styles.card} aria-labelledby="symptom-heading">
      <h2 style={styles.cardTitle} id="symptom-heading">
        Check your symptoms
      </h2>
      <p style={styles.subtitle}>
        Choose how to answer. This gives information, not a diagnosis.
      </p>

      <div style={styles.buttonRow} role="group" aria-label="How to answer">
        {(
          [
            ["typed", "Type it"],
            ["voice", "Speak"],
            ["guided", "Guided questions"],
            ["icons", "Choose pictures"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            style={mode === id ? styles.chipActive : styles.chipIdle}
            aria-pressed={mode === id}
            onClick={() => switchMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "typed" && (
        <textarea
          style={styles.input}
          rows={3}
          aria-label="Describe what is bothering you"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. I have had a fever and headache since yesterday"
        />
      )}

      {mode === "voice" && (
        <div style={styles.formBlock}>
          <button
            type="button"
            style={listening ? styles.danger : styles.primary}
            onClick={listening ? stopVoice : startVoice}
          >
            {listening ? "Stop listening" : "Start speaking"}
          </button>
          {voiceError && <p style={styles.error}>{voiceError}</p>}
          <p style={styles.hint}>
            Speak in your own words. Your words are typed into the box below so you can read and correct them.
          </p>
          <textarea
            style={styles.input}
            rows={3}
            aria-label="Words you said"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What you say appears here"
          />
        </div>
      )}

      {mode === "guided" && (
        <div style={styles.formBlock}>
          <p style={styles.line}>Answer with the buttons below. You do not need to type anything.</p>
          {[
            { id: "general_when", text: "When did it start?", options: ["Today", "This week", "This month", "Longer ago"] },
            { id: "general_severe", text: "How bad is it?", options: ["Mild", "Moderate", "Severe"] }
          ].map((q) => (
            <div key={q.id} style={styles.formBlock}>
              <p style={styles.label}>{q.text}</p>
              <div style={styles.buttonRow}>
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    style={answers[q.id] === opt ? styles.chipActive : styles.chipIdle}
                    aria-pressed={answers[q.id] === opt}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <label style={styles.label} htmlFor="guided-note">
            Anything else to add? (optional)
          </label>
          <textarea
            id="guided-note"
            style={styles.input}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Optional"
          />
        </div>
      )}

      {mode === "icons" && (
        <div style={styles.formBlock}>
          <p style={styles.line}>Tap everything that feels wrong today. You can tap more than one.</p>
          <div style={styles.iconGrid}>
            {ICON_CHIPS.map((c) => {
              const on = chips.includes(c.phrase);
              return (
                <button
                  key={c.id}
                  type="button"
                  style={on ? styles.iconTileOn : styles.iconTile}
                  aria-pressed={on}
                  onClick={() => toggleChip(c.phrase)}
                >
                  <span aria-hidden="true" style={styles.iconEmoji}>
                    {c.emoji}
                  </span>
                  <span style={styles.iconLabel}>{c.label}</span>
                </button>
              );
            })}
          </div>
          {chips.length > 0 && (
            <p style={styles.line}>
              You chose: {chips.join(", ")}.
            </p>
          )}
        </div>
      )}

      <button style={styles.primary} type="button" onClick={assess} disabled={busy}>
        {busy ? "Working…" : "Get guidance"}
      </button>
      {err && <p style={styles.error}>{err}</p>}

      {result?.isEmergency && (
        <div style={styles.banner} role="alert">
          <strong>{result.emergencyLabel}</strong>
          <p style={styles.bannerText}>{result.safetyGuidance}</p>
          <p style={styles.bannerText}>{result.nextStep}</p>
          {result.firstAid && <FirstAidBlock topic={result.firstAid} />}
          <EmergencySupportPanel token={token} contact={profile} />
        </div>
      )}

      {result && !result.isEmergency && (
        <>
          <div style={styles.formBlock}>
            <p style={styles.label}>Possible causes to consider</p>
            {result.possibleCauses.map((c) => (
              <p key={c} style={styles.line}>
                {c}
              </p>
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
                <div style={styles.banner} role="alert">
                  <strong>Urgent</strong>
                  <p style={styles.bannerText}>{refined.urgencyReason}</p>
                  {refined.firstAid && <FirstAidBlock topic={refined.firstAid} />}
                </div>
              )}
              {refined.notes.map((n) => (
                <p key={n} style={styles.line}>
                  {n}
                </p>
              ))}
              <p style={styles.line}>{refined.nextStep}</p>
              <SourcesBlock sources={refined.sources} />
            </div>
          )}

          <SourcesBlock sources={result.sources} />

          <div style={styles.buttonRow}>
            <button style={styles.secondary} type="button" onClick={saveConversation} disabled={busy}>
              Save this conversation
            </button>
            <button style={styles.secondary} type="button" onClick={requestReview} disabled={busy}>
              Ask a healthcare worker to review this
            </button>
          </div>
          {saveMsg && <p style={styles.status}>{saveMsg}</p>}
          {reviewMsg && <p style={styles.status}>{reviewMsg}</p>}
        </>
      )}
      {result?.disclaimer && <p style={styles.status}>{result.disclaimer}</p>}
    </section>
  );
}

function ReviewRequestCard({ token, refreshKey }: { token: string; refreshKey: number }) {
  const [items, setItems] = useState<ReviewRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () => {
    api("/api/review/requests", { token })
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setErr("");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load your review requests."));
  };

  useEffect(() => {
    load();
  }, [token, refreshKey]);

  async function decide(id: string, action: "approve" | "decline") {
    setBusy(true);
    setErr("");
    try {
      await api(`/api/review/requests/${id}/${action}`, { method: "POST", token });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Ask a healthcare worker to review</h2>
      <p style={styles.subtitle}>
        A summary is prepared from your symptom guidance. Nothing is shared until you approve it.
      </p>
      {err && <p style={styles.error}>{err}</p>}
      {items.length === 0 && <p style={styles.line}>No review requests yet.</p>}
      {items.map((item) => (
        <div key={item.id} style={styles.reviewItem}>
          <p style={styles.line}>{item.symptomText}</p>
          <p style={styles.status}>
            Urgency: {item.urgency} · Status: {item.status}
          </p>
          {item.status === "pending" ? (
            <div style={styles.buttonRow}>
              <button
                style={styles.primary}
                type="button"
                disabled={busy}
                onClick={() => decide(item.id, "approve")}
              >
                Approve sharing
              </button>
              <button
                style={styles.secondary}
                type="button"
                disabled={busy}
                onClick={() => decide(item.id, "decline")}
              >
                Do not share
              </button>
            </div>
          ) : (
            <p style={styles.line}>
              {item.status === "approved"
                ? "You approved this. A healthcare worker can now see the summary."
                : "You declined. Nothing was shared."}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

type ReviewRequest = {
  id: string;
  symptomText: string;
  summary: string;
  possibleCauses: string[];
  urgency: string;
  status: string;
  createdAt: string;
};

function FacilitiesCard({ token }: { token: string }) {
  const [data, setData] = useState<FacilitiesResponse | null>(null);
  const [err, setErr] = useState("");
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("");

  const load = useCallback(
    async (coords?: { lat: number; lng: number }) => {
      setErr("");
      try {
        const query = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
        const d = (await api(`/api/facilities${query}`, { token })) as (FacilitiesResponse & { error?: string }) | null;
        if (d && Array.isArray(d.facilities)) {
          setData(d);
          setLocationNote(d.note);
        } else {
          setErr(d?.error ?? "Could not load services near you");
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load services near you");
      }
    },
    [token]
  );

  useEffect(() => {
    (async () => {
      try {
        const p = (await api("/api/patient/profile", { token })) as Profile | null;
        setLocationAllowed(p?.shareLocation === true);
      } catch {
        setLocationAllowed(false);
      }
      await load();
    })();
  }, [token, load]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationNote("This device cannot share a location. Distances stay hidden.");
      return;
    }
    setLocating(true);
    setLocationNote("Asking your device for your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void load({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setLocationNote(
          "Your location was not shared, so distances stay hidden. You can allow location in your device settings and try again."
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  return (
    <section style={styles.card} aria-labelledby="services-heading">
      <h2 style={styles.cardTitle} id="services-heading">
        Health services
      </h2>
      <p style={styles.subtitle}>Facilities, pharmacies, laboratories, and ambulance services.</p>
      {locationAllowed ? (
        <>
          <button style={styles.secondary} type="button" onClick={useMyLocation} disabled={locating}>
            {locating ? "Finding your location…" : "Use my location to show distances"}
          </button>
          <p style={styles.hint}>
            Your location is only sent when you press this button, and only if location sharing is on in your profile.
          </p>
        </>
      ) : (
        <p style={styles.hint}>
          Distances stay hidden until you turn on location sharing in your profile.
        </p>
      )}
      {err && <p style={styles.error}>{err}</p>}
      {(locationNote || data?.note) && <p style={styles.status}>{locationNote || data?.note}</p>}
      {data?.facilities.map((f) => (
        <div key={f.id} style={styles.reviewItem}>
          <p style={styles.line}>
            <strong>{f.name}</strong>
            {typeof f.distanceKm === "number" && ` — about ${f.distanceKm} km away`}
          </p>
          <p style={styles.status}>{f.capability}</p>
          <p style={styles.status}>
            {f.address}
            {f.openHours ? ` · ${f.openHours}` : ""}
          </p>
          {f.phone && <p style={styles.status}>Phone: {f.phone}</p>}
        </div>
      ))}
    </section>
  );
}

type FacilitiesResponse = {
  locationUsed: boolean;
  note: string;
  facilities: {
    id: string;
    name: string;
    type: string;
    capability: string;
    address: string;
    phone: string | null;
    openHours: string | null;
    distanceKm?: number;
  }[];
};

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

type ResumeRequest = {
  id: string;
  symptomText: string;
  intakeMode: "typed" | "voice" | "guided" | "icons";
};

type ConversationItem = {
  id: string;
  title: string;
  symptomText: string;
  intakeMode: string;
  status: string;
  isIncomplete: boolean;
  possibleCauses: string[];
  urgency: string;
  isEmergency: boolean;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function ConversationMemory({
  token,
  refreshKey,
  onResume
}: {
  token: string;
  refreshKey: number;
  onResume: (item: ConversationItem) => void;
}) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/conversations", { token })
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setErr("");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load your conversations"));
  }, [token, refreshKey]);

  async function act(id: string, action: "pause" | "continue" | "complete") {
    setBusyId(id);
    setErr("");
    try {
      await api(`/api/conversations/${id}/${action}`, { method: "POST", token });
      const d = await api("/api/conversations", { token });
      setItems(Array.isArray(d) ? d : []);
      setMsg(
        action === "pause"
          ? "Paused. It stays saved until you come back."
          : action === "continue"
            ? "Continued. You can answer the remaining questions."
            : "Marked as finished."
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update this conversation");
    } finally {
      setBusyId("");
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setErr("");
    try {
      await api(`/api/conversations/${id}`, { method: "DELETE", token });
      setItems((prev) => prev.filter((c) => c.id !== id));
      setMsg("Deleted. Nothing about it is kept.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete this conversation");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section style={styles.card} aria-labelledby="convo-heading">
      <h2 style={styles.cardTitle} id="convo-heading">
        My conversations
      </h2>
      <p style={styles.subtitle}>
        Every check you save stays here so you can pause it and finish later.
      </p>
      {err && <p style={styles.error}>{err}</p>}
      {msg && <p style={styles.status}>{msg}</p>}
      {items.length === 0 && (
        <p style={styles.line}>Nothing saved yet. Check your symptoms and choose Save this conversation.</p>
      )}

      {items.map((c) => (
        <div key={c.id} style={styles.reviewItem}>
          <p style={styles.line}>
            <strong>{c.title}</strong>
          </p>
          <p style={styles.status}>
            {formatWhen(c.updatedAt)} · answered by {c.intakeMode} · {c.urgency}
            {c.isEmergency ? " · emergency warning shown" : ""}
          </p>
          {c.isIncomplete && <p style={styles.warning}>Not finished yet. You can continue where you left off.</p>}
          {!c.isIncomplete && c.status === "active" && (
            <p style={styles.status}>Answered. You can read the causes again below.</p>
          )}
          {c.possibleCauses.map((p) => (
            <p key={p} style={styles.line}>
              {p}
            </p>
          ))}
          {c.notes.length > 0 && (
            <details style={styles.details}>
              <summary style={styles.summary}>Your answers ({c.notes.length})</summary>
              {c.notes.map((n) => (
                <p key={n} style={styles.line}>
                  {n}
                </p>
              ))}
            </details>
          )}
          <div style={styles.buttonRow}>
            {c.status !== "completed" && (
              <button
                style={styles.primary}
                type="button"
                disabled={busyId === c.id}
                onClick={async () => {
                  if (c.status !== "active") await act(c.id, "continue");
                  onResume(c);
                }}
              >
                Continue in Check your symptoms
              </button>
            )}
            {c.status === "active" ? (
              <button style={styles.secondary} type="button" disabled={busyId === c.id} onClick={() => act(c.id, "pause")}>
                Pause
              </button>
            ) : null}
            {c.status !== "completed" && (
              <button
                style={styles.secondary}
                type="button"
                disabled={busyId === c.id}
                onClick={() => act(c.id, "complete")}
              >
                Mark finished
              </button>
            )}
            <button style={styles.dangerGhost} type="button" disabled={busyId === c.id} onClick={() => remove(c.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

type DocumentExplanation = {
  testName: string;
  excerpt: string;
  plainMeaning: string;
  whyItMatters: string;
  normalRange: string;
  concerningWhen: string;
};

type DocumentItem = {
  id: string;
  title: string;
  documentType: string;
  rawText: string;
  explanation: DocumentExplanation[];
  clarifyItems: string[];
  createdAt: string;
};

function HealthDocuments({
  token,
  refreshKey,
  onChanged
}: {
  token: string;
  refreshKey: number;
  onChanged: () => void;
}) {
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [fileNote, setFileNote] = useState("");

  useEffect(() => {
    api("/api/documents", { token })
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load your documents"));
  }, [token, refreshKey]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/documents", { method: "POST", token, body: { rawText } });
      setRawText("");
      setFileNote("");
      const d = await api("/api/documents", { token });
      setItems(Array.isArray(d) ? d : []);
      setReadAloud(false);
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not read that document");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFileNote("That file is larger than 2 MB. Please choose a smaller file.");
      return;
    }
    const looksLikeImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name);
    if (looksLikeImage) {
      setFileNote(
        "Rural Help cannot read words from a photo yet. Type or paste the words from the result instead, and the explanation will still be ready for you."
      );
      return;
    }
    setFileNote("");
    try {
      const text = await file.text();
      if (text.replace(/\s+/g, "").length < 10) {
        setFileNote("No readable words were found in that file. Type or paste the words instead.");
        return;
      }
      setRawText(text.slice(0, 5000));
      setFileNote(`Loaded words from ${file.name}. Check them before you add the document.`);
    } catch {
      setFileNote("Could not read that file. Type or paste the words instead.");
    }
  }

  async function remove(id: string) {
    setErr("");
    try {
      await api(`/api/documents/${id}`, { method: "DELETE", token });
      setItems((prev) => prev.filter((d) => d.id !== id));
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete this document");
    }
  }

  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-NG";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <section style={styles.card} aria-labelledby="docs-heading">
      <h2 style={styles.cardTitle} id="docs-heading">
        My documents
      </h2>
      <p style={styles.subtitle}>
        Add a test result or prescription and Rural Help explains what the words mean in plain language. It does not
        tell you what is wrong.
      </p>

      <form onSubmit={submit} style={styles.formBlock}>
        <label style={styles.label} htmlFor="doc-text">
          Type or paste the words from the document
        </label>
        <textarea
          id="doc-text"
          style={styles.input}
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="e.g. Haemoglobin 9.8 g/dL, Malaria test positive"
        />
        <label style={styles.label} htmlFor="doc-file">
          Or choose a text file with the words in it
        </label>
        <input id="doc-file" type="file" accept="text/plain,.txt,.csv" style={styles.input} onChange={onFile} />
        {fileNote && <p style={styles.hint}>{fileNote}</p>}
        <label style={styles.consentRow}>
          <input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} />
          <span>Offer to read each explanation aloud</span>
        </label>
        {err && <p style={styles.error}>{err}</p>}
        <button style={styles.primary} type="submit" disabled={busy}>
          {busy ? "Reading…" : "Explain this document"}
        </button>
      </form>

      {items.length === 0 && <p style={styles.line}>No documents added yet.</p>}

      {items.map((d) => (
        <div key={d.id} style={styles.reviewItem}>
          <p style={styles.line}>
            <strong>{d.title}</strong>
          </p>
          <p style={styles.status}>Added {formatWhen(d.createdAt)}</p>
          {d.explanation.length === 0 && (
            <p style={styles.hint}>
              These words are not ones Rural Help knows yet, so nothing was explained. Ask a healthcare professional to
              read the document with you.
            </p>
          )}
          {d.explanation.map((x) => (
            <div key={x.testName} style={styles.details}>
              <p style={styles.label}>{x.testName}</p>
              {readAloud && (
                <button
                  style={styles.ghost}
                  type="button"
                  onClick={() =>
                    speak(
                      `${x.testName}. ${x.plainMeaning} Why it matters. ${x.whyItMatters} Often normal range. ${x.normalRange} Get checked if. ${x.concerningWhen}`
                    )
                  }
                >
                  Read this aloud
                </button>
              )}
              <p style={styles.line}>{x.plainMeaning}</p>
              <p style={styles.line}>
                <strong>Why it matters:</strong> {x.whyItMatters}
              </p>
              <p style={styles.line}>
                <strong>Often normal range:</strong> {x.normalRange}
              </p>
              <p style={styles.line}>
                <strong>Get checked if:</strong> {x.concerningWhen}
              </p>
            </div>
          ))}
          {d.clarifyItems.length > 0 && (
            <>
              <p style={styles.label}>Ask a healthcare professional</p>
              <ul style={styles.stepList}>
                {d.clarifyItems.map((c) => (
                  <li key={c} style={styles.step}>
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}
          <button style={styles.dangerGhost} type="button" onClick={() => remove(d.id)}>
            Delete
          </button>
        </div>
      ))}
    </section>
  );
}
type VisitPreparationData = {
  generatedAt: string;
  patient: {
    age: string | null;
    bloodType: string | null;
    conditions: string[];
    medicines: string[];
    allergies: string[];
    emergencyContact: { name: string; phone: string | null } | null;
    emergencySummary: string | null;
    locationSharing: boolean;
  };
  symptoms: {
    title: string;
    reported: string;
    urgency: string;
    isEmergency: boolean;
    isIncomplete: boolean;
    since: string;
  }[];
  documents: { title: string; addedAt: string }[];
  reminders: { label: string; nextDueAt: string; instructions: string }[];
  reviewRequests: { symptomText: string; urgency: string; status: string; createdAt: string }[];
  questionsToAsk: string[];
  missingInformation: string[];
  privacy: { sharedWith: string; note: string };
  disclaimer: string;
};

function VisitPreparation({ token, refreshKey }: { token: string; refreshKey: number }) {
  const [data, setData] = useState<VisitPreparationData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/api/offline/preparation", { token })
      .then((d) => {
        setData(d);
        setErr("");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not build your visit sheet"));
  }, [token, refreshKey]);

  return (
    <section style={styles.card} aria-labelledby="visit-heading">
      <h2 style={styles.cardTitle} id="visit-heading">
        Visit preparation
      </h2>
      <p style={styles.subtitle}>
        A summary you can read on your phone or show at the clinic. It is built from what you saved.
      </p>
      {err && <p style={styles.error}>{err}</p>}
      {!data && !err && <p style={styles.line}>Building your summary…</p>}

      {data && (
        <>
          <div style={styles.details}>
            <p style={styles.label}>About you</p>
            <p style={styles.line}>Date of birth: {data.patient.age ?? "not saved"}</p>
            <p style={styles.line}>Blood type: {data.patient.bloodType ?? "not saved"}</p>
            <p style={styles.line}>Conditions: {data.patient.conditions.join(", ") || "not saved"}</p>
            <p style={styles.line}>Medicines: {data.patient.medicines.join(", ") || "not saved"}</p>
            <p style={styles.line}>Allergies: {data.patient.allergies.join(", ") || "not saved"}</p>
            <p style={styles.line}>
              Emergency contact:{" "}
              {data.patient.emergencyContact
                ? `${data.patient.emergencyContact.name} ${data.patient.emergencyContact.phone ?? ""}`.trim()
                : "not saved"}
            </p>
            <p style={styles.line}>Emergency summary: {data.patient.emergencySummary ?? "not saved"}</p>
          </div>

          <p style={styles.label}>What you have been feeling</p>
          {data.symptoms.length === 0 && <p style={styles.line}>No symptoms saved yet.</p>}
          {data.symptoms.map((s) => (
            <div key={`${s.since}-${s.title}`} style={styles.reviewItem}>
              <p style={styles.line}>
                <strong>{s.title}</strong> ({s.urgency}
                {s.isEmergency ? ", emergency warning shown" : ""})
              </p>
              <p style={styles.line}>{s.reported}</p>
              {s.isIncomplete && <p style={styles.warning}>You did not finish answering this one.</p>}
            </div>
          ))}

          {data.documents.length > 0 && (
            <>
              <p style={styles.label}>Documents to show</p>
              <ul style={styles.stepList}>
                {data.documents.map((d) => (
                  <li key={`${d.addedAt}-${d.title}`} style={styles.step}>
                    {d.title}
                  </li>
                ))}
              </ul>
            </>
          )}

          {data.reminders.length > 0 && (
            <>
              <p style={styles.label}>Reminders you set</p>
              <ul style={styles.stepList}>
                {data.reminders.map((r) => (
                  <li key={r.label} style={styles.step}>
                    {r.label} — next {formatWhen(r.nextDueAt)}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p style={styles.label}>Questions to ask the healthcare worker</p>
          <ol style={styles.stepList}>
            {data.questionsToAsk.map((q) => (
              <li key={q} style={styles.step}>
                {q}
              </li>
            ))}
          </ol>

          {data.missingInformation.length > 0 && (
            <div style={styles.details}>
              <p style={styles.label}>Still missing. You can add these in My profile.</p>
              <ul style={styles.stepList}>
                {data.missingInformation.map((m) => (
                  <li key={m} style={styles.step}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p style={styles.label}>Who has seen this</p>
          <p style={styles.line}>{data.privacy.note}</p>
          <p style={styles.status}>{data.disclaimer}</p>
        </>
      )}
    </section>
  );
}

type ReminderItem = {
  id: string;
  conversationId: string | null;
  label: string;
  instructions: string;
  intervalDays: number;
  nextDueAt: string;
  status: string;
  isOverdue: boolean;
  escalationNote: string | null;
  createdAt: string;
};

function RemindersPanel({
  token,
  refreshKey,
  onChanged
}: {
  token: string;
  refreshKey: number;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [convos, setConvos] = useState<ConversationItem[]>([]);
  const [label, setLabel] = useState("");
  const [instructions, setInstructions] = useState("");
  const [interval, setIntervalDays] = useState("3");
  const [linked, setLinked] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    api("/api/reminders", { token })
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setErr("");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load your reminders"));
  };

  useEffect(() => {
    load();
    api("/api/conversations", { token })
      .then((d) => setConvos(Array.isArray(d) ? d : []))
      .catch(() => setConvos([]));
  }, [token, refreshKey]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/reminders", {
        method: "POST",
        token,
        body: {
          label,
          instructions,
          intervalDays: Number(interval),
          conversationId: linked || undefined
        }
      });
      setLabel("");
      setInstructions("");
      setLinked("");
      setMsg("Reminder saved. You will see it on this page when it is due.");
      load();
      onChanged();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not save the reminder");
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "snooze" | "pause" | "resume" | "complete") {
    setErr("");
    try {
      await api(`/api/reminders/${id}/${action}`, {
        method: "POST",
        token,
        body: action === "snooze" ? { intervalDays: 3 } : undefined
      });
      load();
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update the reminder");
    }
  }

  async function remove(id: string) {
    setErr("");
    try {
      await api(`/api/reminders/${id}`, { method: "DELETE", token });
      load();
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete the reminder");
    }
  }

  const due = items.filter((r) => r.status === "active");
  const notActive = items.filter((r) => r.status !== "active");

  return (
    <section style={styles.card} aria-labelledby="reminders-heading">
      <h2 style={styles.cardTitle} id="reminders-heading">
        Reminders
      </h2>
      <p style={styles.subtitle}>
        Ask to be reminded to check how you are feeling. If a reminder passes its date and your symptoms are the same
        or worse, it tells you to contact a healthcare professional.
      </p>
      {err && <p style={styles.error}>{err}</p>}
      {msg && <p style={styles.status}>{msg}</p>}

      <form onSubmit={create} style={styles.formBlock}>
        <label style={styles.label} htmlFor="rem-label">
          What should we remind you about?
        </label>
        <input
          id="rem-label"
          style={styles.input}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Check whether my cough is better"
        />
        <label style={styles.label} htmlFor="rem-instructions">
          What should you do when it comes?
        </label>
        <textarea
          id="rem-instructions"
          style={styles.input}
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Note if I still have a fever, and visit the clinic if it is not improving"
        />
        <label style={styles.label} htmlFor="rem-interval">
          Check every how many days?
        </label>
        <input
          id="rem-interval"
          type="number"
          min={1}
          max={90}
          inputMode="numeric"
          style={styles.input}
          value={interval}
          onChange={(e) => setIntervalDays(e.target.value)}
        />
        {convos.length > 0 && (
          <>
            <label style={styles.label} htmlFor="rem-link">
              Link it to a saved conversation (optional)
            </label>
            <select id="rem-link" style={styles.input} value={linked} onChange={(e) => setLinked(e.target.value)}>
              <option value="">No conversation</option>
              {convos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </>
        )}
        <button style={styles.primary} type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save reminder"}
        </button>
      </form>

      <p style={styles.label}>Reminders due now</p>
      {due.length === 0 && <p style={styles.line}>No active reminders.</p>}
      {due.map((r) => (
        <div key={r.id} style={styles.reviewItem}>
          <p style={styles.line}>
            <strong>{r.label}</strong>
          </p>
          <p style={r.isOverdue ? styles.warning : styles.status}>
            {r.isOverdue ? "Due now" : `Next: ${formatWhen(r.nextDueAt)}`}
          </p>
          <p style={styles.line}>{r.instructions}</p>
          {r.isOverdue && r.escalationNote && (
            <div style={styles.warningBox}>
              <p style={styles.line}>{r.escalationNote}</p>
            </div>
          )}
          {!r.isOverdue && r.escalationNote && (
            <p style={styles.hint}>
              If it is still not better when this comes up, contact a healthcare professional.
            </p>
          )}
          <div style={styles.buttonRow}>
            <button style={styles.secondary} type="button" onClick={() => act(r.id, "complete")}>
              I checked, I am better
            </button>
            <button style={styles.secondary} type="button" onClick={() => act(r.id, "snooze")}>
              Remind me in 3 days
            </button>
            <button style={styles.secondary} type="button" onClick={() => act(r.id, "pause")}>
              Stop
            </button>
            <button style={styles.dangerGhost} type="button" onClick={() => remove(r.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {notActive.length > 0 && (
        <>
          <p style={styles.label}>Paused and finished</p>
          {notActive.map((r) => (
            <div key={r.id} style={styles.reviewItem}>
              <p style={styles.line}>
                {r.label} — {r.status}
              </p>
              <div style={styles.buttonRow}>
                {r.status !== "completed" && (
                  <button style={styles.secondary} type="button" onClick={() => act(r.id, "resume")}>
                    Start again
                  </button>
                )}
                <button style={styles.dangerGhost} type="button" onClick={() => remove(r.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

const PACK_KEY = "ruralhelp.offline.pack";
const PROFILE_KEY = "ruralhelp.offline.profile";

type OfflineProfile = {
  savedAt: string;
  dateOfBirth: string | null;
  bloodType: string | null;
  emergencySummary: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  conditions: string[];
  medicines: string[];
  allergies: string[];
};

function readStoredPack(): OfflinePack | null {
  try {
    const raw = localStorage.getItem(PACK_KEY);
    return raw ? (JSON.parse(raw) as OfflinePack) : null;
  } catch {
    return null;
  }
}

function readStoredProfile(): OfflineProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as OfflineProfile) : null;
  } catch {
    return null;
  }
}

type OfflinePack = {
  version: number;
  generatedAt: string;
  disclaimer: string;
  emergencyNumbers: { label: string; value: string; note: string }[];
  redFlagWarnings: { label: string; guidance: string; firstAidKey: string | null }[];
  firstAid: { key: string; title: string; whenToUse: string; steps: string[]; avoid: string[] }[];
};

function OfflinePackCard({ token }: { token: string }) {
  const [pack, setPack] = useState<OfflinePack | null>(null);
  const [stored, setStored] = useState<OfflinePack | null>(() => readStoredPack());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStored, setProfileStored] = useState<OfflineProfile | null>(() => readStoredProfile());
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/offline")
      .then((d) => {
        setPack(d);
        setErr("");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load the offline pack"));
    api("/api/patient/profile", { token })
      .then((p) => setProfile(p as Profile | null))
      .catch(() => setProfile(null));
  }, [token]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  function saveOffline() {
    if (!pack) return;
    try {
      localStorage.setItem(PACK_KEY, JSON.stringify(pack));
      setStored(pack);
      if (profile) {
        const snapshot: OfflineProfile = {
          savedAt: new Date().toISOString(),
          dateOfBirth: profile.dateOfBirth ?? null,
          bloodType: profile.bloodType ?? null,
          emergencySummary: profile.emergencySummary ?? null,
          emergencyContactName: profile.emergencyContactName ?? null,
          emergencyContactPhone: profile.emergencyContactPhone ?? null,
          conditions: profile.conditions ?? [],
          medicines: profile.medicines ?? [],
          allergies: profile.allergies ?? []
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(snapshot));
        setProfileStored(snapshot);
      }
      setMsg("Saved on this phone. You can read it even without internet.");
      setErr("");
    } catch {
      setErr("This browser would not let the pack be saved. Keep this page open instead.");
    }
  }

  const active = pack ?? stored;
  const isStale = stored ? stored.version !== (pack?.version ?? stored.version) : false;
  const daysSince = stored ? Math.floor((Date.now() - new Date(stored.generatedAt).getTime()) / 86_400_000) : null;
  const activeProfile = profile ?? profileStored;
  const profileAgeDays = profileStored
    ? Math.floor((Date.now() - new Date(profileStored.savedAt).getTime()) / 86_400_000)
    : null;

  return (
    <section style={styles.card} aria-labelledby="offline-heading">
      <h2 style={styles.cardTitle} id="offline-heading">
        Offline emergency pack
      </h2>
      <p style={styles.subtitle}>
        Save emergency numbers, warning signs, and first-aid steps on this phone so they work without internet.
      </p>
      {!online && (
        <p style={styles.warning}>
          This phone is offline. You can still read the copy saved here, but changes you make will not reach Rural Help
          until the connection returns.
        </p>
      )}
      {err && <p style={styles.error}>{err}</p>}
      {msg && <p style={styles.status}>{msg}</p>}

      {stored && (
        <p style={isStale || (daysSince ?? 0) > 30 ? styles.warning : styles.status}>
          Saved version {stored.version}
          {daysSince === 0 ? " today" : ` ${daysSince} days ago`}.
          {(isStale || (daysSince ?? 0) > 30) && " It may be out of date. Reconnect and update it."}
        </p>
      )}

      <button style={styles.primary} type="button" onClick={saveOffline} disabled={!pack}>
        {stored ? "Update the pack on this phone" : "Save the pack on this phone"}
      </button>
      {!pack && stored && <p style={styles.hint}>Showing the copy saved on this phone.</p>}
      {!pack && !stored && <p style={styles.hint}>No pack saved yet.</p>}

      {activeProfile && (
        <>
          <p style={styles.label}>My health summary (saved on this phone)</p>
          <p style={styles.hint}>
            So you can show a health worker this summary without internet. Only you can see it.
            {profileAgeDays !== null &&
              ` Saved ${profileAgeDays === 0 ? "today" : `${profileAgeDays} days ago`}.` +
                (profileAgeDays > 30 ? " Update it so it stays correct." : "")}
          </p>
          {activeProfile.emergencySummary && <p style={styles.line}>{activeProfile.emergencySummary}</p>}
          {activeProfile.conditions.length > 0 && (
            <p style={styles.line}>
              <strong>Ongoing conditions:</strong> {activeProfile.conditions.join(", ")}
            </p>
          )}
          {activeProfile.medicines.length > 0 && (
            <p style={styles.line}>
              <strong>Medicines:</strong> {activeProfile.medicines.join(", ")}
            </p>
          )}
          {activeProfile.allergies.length > 0 && (
            <p style={styles.line}>
              <strong>Allergies:</strong> {activeProfile.allergies.join(", ")}
            </p>
          )}
          {(activeProfile.bloodType || activeProfile.dateOfBirth) && (
            <p style={styles.line}>
              {activeProfile.bloodType && `Blood type: ${activeProfile.bloodType}. `}
              {activeProfile.dateOfBirth && `Date of birth: ${activeProfile.dateOfBirth}.`}
            </p>
          )}
          {(activeProfile.emergencyContactName || activeProfile.emergencyContactPhone) && (
            <p style={styles.line}>
              <strong>Emergency contact:</strong>{" "}
              {[activeProfile.emergencyContactName, activeProfile.emergencyContactPhone].filter(Boolean).join(" — ")}
            </p>
          )}
        </>
      )}

      {active && (
        <>
          <p style={styles.label}>Emergency numbers</p>
          {active.emergencyNumbers.map((n) => (
            <p key={n.value} style={styles.line}>
              <strong>{n.value}</strong> — {n.label}. {n.note}
            </p>
          ))}

          <p style={styles.label}>Warning signs to act on now</p>
          {active.redFlagWarnings.map((f) => (
            <div key={f.label} style={styles.details}>
              <p style={styles.label}>{f.label}</p>
              <p style={styles.line}>{f.guidance}</p>
            </div>
          ))}

          <p style={styles.label}>First aid steps</p>
          {active.firstAid.map((t) => (
            <details key={t.key} style={styles.details}>
              <summary style={styles.summary}>{t.title}</summary>
              <p style={styles.line}>{t.whenToUse}</p>
              <ol style={styles.stepList}>
                {t.steps.map((s) => (
                  <li key={s} style={styles.step}>
                    {s}
                  </li>
                ))}
              </ol>
              <p style={styles.avoidTitle}>Do not:</p>
              <ul style={styles.stepList}>
                {t.avoid.map((s) => (
                  <li key={s} style={styles.step}>
                    {s}
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <p style={styles.status}>{active.disclaimer}</p>
        </>
      )}
    </section>
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
  reviewItem: {
    borderTop: "1px solid #E3EAE5",
    paddingTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  buttonRow: { display: "flex", gap: 10, flexWrap: "wrap" },
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
  },
  hint: { fontSize: 13, color: "#66736C", margin: 0 },
  nav: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    gap: 8,
    marginTop: 20,
    overflowX: "auto",
    paddingBottom: 4,
    WebkitOverflowScrolling: "touch"
  },
  navIdle: {
    flex: "0 0 auto",
    background: "#FFFFFF",
    color: "#1F5C43",
    border: "2px solid #DCE5DF",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    minHeight: 44
  },
  navActive: {
    flex: "0 0 auto",
    background: "#2E7D5B",
    color: "#FFFFFF",
    border: "2px solid #2E7D5B",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    minHeight: 44
  },
  chipIdle: {
    background: "#FFFFFF",
    color: "#1F5C43",
    border: "2px solid #DCE5DF",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    minHeight: 44
  },
  chipActive: {
    background: "#E3F1E8",
    color: "#1F5C43",
    border: "2px solid #2E7D5B",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    minHeight: 44
  },
  iconGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10
  },
  iconTile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#FFFFFF",
    border: "2px solid #DCE5DF",
    borderRadius: 16,
    padding: 16,
    cursor: "pointer",
    fontFamily: "inherit",
    minHeight: 96
  },
  iconTileOn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#E3F1E8",
    border: "2px solid #2E7D5B",
    borderRadius: 16,
    padding: 16,
    cursor: "pointer",
    fontFamily: "inherit",
    minHeight: 96
  },
  iconEmoji: { fontSize: 34, lineHeight: 1 },
  iconLabel: { fontSize: 14, fontWeight: 600, color: "#26332D", textAlign: "center" },
  warning: { fontSize: 14, color: "#8A6100", fontWeight: 600, margin: 0 },
  warningBox: {
    background: "#FFF6E0",
    border: "1px solid #F2C94C",
    borderRadius: 12,
    padding: 12
  },
  danger: {
    background: "#D9534F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "13px 22px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer"
  },
  dangerGhost: {
    background: "transparent",
    color: "#8C2F2C",
    border: "2px solid #F0C8C6",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer"
  }
};
