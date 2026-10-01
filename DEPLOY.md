# Deploying Rural Help

The API and the web app are deployed as **one service on one origin**. The API
serves the built web app itself, so a tester needs a single link, CORS stays
closed, and there is no separate API base URL to configure or go wrong.

Host: [Render](https://render.com), described in `render.yaml` at the repo root.

## First deploy

1. Push this branch to GitHub (done via `git push origin main`).
2. In Render: **New -> Blueprint**, and point it at the repo. Render reads
   `render.yaml` and creates the web service and the Postgres database.
3. When prompted, set `SITE_BASIC_AUTH_PASSWORD`. This is the password your
   field testers will be asked for. There is no default.
4. Deploy. Watch the build log for `Listening on ...`.

`JWT_SECRET` is generated for you by the blueprint. `NODE_ENV=production` is set
automatically, which also activates the `JWT_SECRET` guard in
`src/auth/tokens.ts` and the site password gate in `src/deploy-gate.ts`.

You will get a URL like `https://rural-help.onrender.com`.

## Verifying the deploy

```bash
# should be reachable with no password
curl https://rural-help.onrender.com/health

# should be 401
curl -i https://rural-help.onrender.com/ | head -1
```

Then open the URL in a browser. You should get a username/password prompt.
Default username is `ruralhelp` unless you set `SITE_BASIC_AUTH_USER`.

## Regenerating a password

Change `SITE_BASIC_AUTH_PASSWORD` in the Render dashboard and redeploy. There is
no admin UI for this by design.

## Checking it before you ship changes

`check:deploy` boots the real API against the real web build and exercises the
things unit tests cannot see, such as the site password gate and single-origin
serving.

```bash
pnpm --filter @rural-help/web run build     # the check reads packages/web/dist
pnpm --filter @rural-help/api run check:deploy

# also exercise the password gate
SITE_BASIC_AUTH_PASSWORD=some-secret pnpm --filter @rural-help/api run check:deploy
```

Run this before every deploy. A middleware that forgets to call `next()` hangs
every request while the other suites still pass.

## Known limits of the free tier

- **The service sleeps when idle.** The first request after a quiet period is
  slow or fails while it wakes up. This matters for a rural audience on
  intermittent power and connection, so treat free tier as field-testing only.
- **Postgres expires after 30 days.** You will need to migrate to a paid or
  long-lived database before any real pilot.
- **The rate limiter is in-process.** It works correctly for a single instance,
  which is what the free tier gives you. If you scale to two or more instances,
  password-reset brute-force protection silently becomes ineffective. Move it to
  Redis or Postgres before scaling out.

## Not production-ready yet

These are release blockers, independent of hosting:

- **The clinical content has not been reviewed by a clinician.** This is the
  most important one. The site password exists to keep unreviewed guidance off
  the open internet until that review happens.
- **Password reset cannot complete.** There is no email provider wired up, so a
  user who forgets their password has no recovery path. This is deliberate
  rather than broken: returning the reset code in the response would allow
  anyone who knows an email address to take over that account.
- **Facility data is unverified.** Names, coordinates, and phone numbers need a
  real source before anyone is pointed to them.