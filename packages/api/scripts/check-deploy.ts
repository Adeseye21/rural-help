/**
 * Boots the real API against the real web build and checks that it actually
 * serves things.
 *
 * This exists because a middleware that forgets to call next() hangs every
 * request while unit tests and audits still pass, and because the production
 * single-origin setup (API serving the web build) is otherwise never exercised
 * on a developer's machine.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = Number(process.env.SMOKE_PORT ?? 3199);
const BASE = `http://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

async function waitForServer(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const dataDir = mkdtempSync(path.join(tmpdir(), "rural-help-smoke-"));

const child = spawn(
  process.execPath,
  ["--import", "tsx", "src/index.ts"],
  {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: process.env.SMOKE_NODE_ENV ?? "production",
      JWT_SECRET: process.env.JWT_SECRET ?? "smoke-test-secret-not-for-real-use",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://rural_help:rural_help_dev@localhost:5432/rural_help",
      // Tests the gate in both states across the two runs of this script.
      SITE_BASIC_AUTH_PASSWORD: process.env.SITE_BASIC_AUTH_PASSWORD ?? ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  }
);

let serverLog = "";
child.stdout.on("data", (d) => (serverLog += d.toString()));
child.stderr.on("data", (d) => (serverLog += d.toString()));

const password = process.env.SITE_BASIC_AUTH_PASSWORD ?? "";
const authHeader = password
  ? `Basic ${Buffer.from(`ruralhelp:${password}`).toString("base64")}`
  : undefined;

function get(pathname: string, withAuth = true) {
  return fetch(`${BASE}${pathname}`, {
    headers: withAuth && authHeader ? { Authorization: authHeader } : {}
  });
}

try {
  const started = await waitForServer(45_000);
  if (!started) {
    console.log("FAIL  server did not become healthy");
    console.log(serverLog.slice(-2000));
    fail += 1;
  } else {
    const health = await get("/health");
    const healthBody = await health.json();
    check("health responds", health.status === 200, `got ${health.status}`);

    // The gate must never hide the health endpoint or the platform check fails.
    check("health reachable without site password", (await get("/health", false)).status === 200);

    if (password) {
      check("site protected without password", (await get("/", false)).status === 401);
      check("api protected without password", (await get("/api/facilities", false)).status === 401);
      const authed = await get("/");
      check("site served with correct password", authed.status === 200);
      const wrong = await fetch(`${BASE}/`, {
        headers: { Authorization: `Basic ${Buffer.from("ruralhelp:wrong").toString("base64")}` }
      });
      check("site rejects wrong password", wrong.status === 401);

      // The app's logged-in calls carry `Authorization: Bearer <token>`, which
      // replaces the browser's cached Basic credentials instead of adding to
      // them. The gate cookie is what lets those calls through. This is the
      // exact flow that broke the live site once.
      const setCookie = authed.headers.get("set-cookie") ?? "";
      const gateCookie = setCookie.split(";")[0];
      check(
        "gate issues a session cookie on password entry",
        gateCookie.startsWith("__rh_gate=") && gateCookie.length > "__rh_gate=".length + 16,
        setCookie.slice(0, 60)
      );
      const appStyleBlocked = await fetch(`${BASE}/api/definitely-not-a-route`, {
        headers: { Authorization: "Bearer app-token-without-gate-cookie" }
      });
      check("app-style call without gate cookie is blocked", appStyleBlocked.status === 401);
      const appStyleAllowed = await fetch(`${BASE}/api/definitely-not-a-route`, {
        headers: { Authorization: "Bearer app-token-with-gate-cookie", Cookie: gateCookie }
      });
      const appStyleBody = await appStyleAllowed.text();
      check(
        "app-style call with gate cookie reaches the API",
        appStyleAllowed.status === 404 && !appStyleBody.includes("Authentication required"),
        `got ${appStyleAllowed.status}`
      );
    } else {
      console.log("SKIP  site password checks (SITE_BASIC_AUTH_PASSWORD not set)");
    }

    const index = await get("/");
    const html = await index.text();
    check("web app served from API origin", index.status === 200 && html.includes("<div id=\"root\">"));

    const deep = await get("/some/client/route");
    check("SPA deep link falls back to index.html", (await deep.text()).includes("<div id=\"root\">"));

    const missingApi = await get("/api/definitely-not-a-route");
    check("unknown API path is not the HTML shell", !((await missingApi.text()).includes("<div id=\"root\">")));

    const sw = await get("/sw.js");
    if (sw.status === 200) {
      const cc = sw.headers.get("cache-control") ?? "";
      check("service worker is not cached", /no-store|no-cache/.test(cc), `cache-control=${cc}`);
    } else {
      console.log("SKIP  service worker not built (run the web build first)");
    }

    check("database reachable", healthBody.database === "connected", JSON.stringify(healthBody));

    const corsHeader = (await fetch(`${BASE}/api/facilities`, { headers: { Origin: "https://evil.example" } })).headers.get(
      "access-control-allow-origin"
    );
    check(
      "unknown browser origin is not granted CORS",
      corsHeader === null || corsHeader !== "https://evil.example",
      `got ${corsHeader}`
    );
  }
} finally {
  // Wait for the child to actually exit before tearing down. Killing it and
  // immediately calling process.exit trips a libuv assertion on Windows.
  if (child.exitCode === null && child.signalCode === null) {
    await new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
      child.kill();
      setTimeout(resolve, 5000);
    });
  }
  rmSync(dataDir, { recursive: true, force: true });
}

console.log(`\nPASS: ${pass}   FAIL: ${fail}`);
process.exitCode = fail === 0 ? 0 : 1;