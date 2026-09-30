const BASE = process.env.BASE ?? "http://localhost:3001";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name} -> ${detail}`);
    console.log(`FAIL  ${name} -> ${detail}`);
  }
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  if (text.length) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { _raw: text.slice(0, 120) };
    }
  }
  return { status: res.status, ok: res.ok, data };
}

const stamp = Date.now();
const email = `reset_${stamp}@example.com`;

const reg = await post("/api/auth/register", { name: "Reset User", email, password: "password123" });
check("setup: register", reg.ok, JSON.stringify(reg.data));

const forgot = await post("/api/auth/forgot-password", { email });
check(
  "reset code is not returned by default",
  forgot.ok && forgot.data?.devCode === undefined && forgot.data?.devNote === undefined,
  JSON.stringify(forgot.data)
);
check(
  "forgot-password response stays generic",
  forgot.ok && typeof forgot.data?.message === "string" && forgot.data.message.includes("registered"),
  JSON.stringify(forgot.data?.message)
);

const unknown = await post("/api/auth/forgot-password", { email: `nobody_${stamp}@example.com` });
check(
  "unknown email response matches known email response",
  unknown.ok && unknown.data?.message === forgot.data?.message && unknown.data?.devCode === undefined,
  `known=${forgot.data?.message} unknown=${unknown.data?.message}`
);

// A wrong code must be rejected.
const wrong = await post("/api/auth/reset-password", { email, code: "definitely-wrong", password: "newpassword123" });
check("wrong reset code rejected", wrong.status === 400, `status=${wrong.status}`);

// The known-account path must not be distinguishable from an unknown one.
const unknownReset = await post("/api/auth/reset-password", {
  email: `nobody_${stamp}@example.com`,
  code: "definitely-wrong",
  password: "newpassword123"
});
check(
  "reset error is identical for unknown account",
  unknownReset.status === wrong.status && unknownReset.data?.error === wrong.data?.error,
  `known=${wrong.data?.error} unknown=${unknownReset.data?.error}`
);

// login must not reveal whether an address is registered either
const loginUnknown = await post("/api/auth/login", { email: `nobody2_${stamp}@example.com`, password: "password123" });
check(
  "login error is identical for unknown account",
  loginUnknown.status === 401 &&
    loginUnknown.data?.error === "invalid email or password",
  `unknown=${loginUnknown.data?.error} status=${loginUnknown.status}`
);

let limited = false;
let limitedStatus = 0;
for (let i = 0; i < 14; i += 1) {
  const r = await post("/api/auth/forgot-password", { email: `flood_${stamp}_${i}@example.com` });
  if (r.status === 429) {
    limited = true;
    limitedStatus = r.status;
    break;
  }
}
check("forgot-password is rate limited", limited, `never limited, last=${limitedStatus}`);

// Login must still work and the old password must be unchanged.
const loginOld = await post("/api/auth/login", { email, password: "password123" });
check("existing password still works", loginOld.ok, JSON.stringify(loginOld.data).slice(0, 100));

console.log(`\nPASS: ${pass}   FAIL: ${fail}`);
if (failures.length) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(` - ${f}`));
}
process.exit(fail > 0 ? 1 : 0);
