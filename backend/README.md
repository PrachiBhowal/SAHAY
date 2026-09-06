# SAHAY Backend — Vercel version (no card, no payment prompt)

Same routes, same `CONTRACTS.md` shapes, same Postgres (Neon) database as before.
Only change: runs as a Vercel serverless function instead of an always-on
Express server, because Vercel's free Hobby tier genuinely doesn't ask for a
card — Render and Railway currently do, at least for the account you tried.

## What changed structurally

- `server.js` → split into `api/index.js` (the actual Express app, exported —
  no `app.listen()`) and `dev-server.js` (adds `app.listen()` back, but only
  for when you're running it locally with `npm run dev`)
- Added `vercel.json` so every incoming path (`/api/health`, `/api/auth/login`,
  etc.) routes to that one function
- Schema init now runs lazily, cached per warm function instance, instead of
  once at server startup — serverless functions don't have a single "startup
  moment" the way a normal server does

Nothing about the actual routes, auth logic, or database queries changed.

## Local testing (identical to before)

```bash
npm install
cp .env.example .env      # paste in your Neon DATABASE_URL, set JWT_SECRET
npm run seed
npm run dev                 # starts on :4000 same as always
```

Test exactly like you always have — curl/PowerShell, same expected responses.

## Deploying on Vercel

1. Go to vercel.com, **sign up with GitHub** — no card required for Hobby.
2. **Add New → Project**, import your `SAHAY` repo.
3. **Root Directory:** `backend` (or wherever this folder lives in your repo)
4. Framework Preset: Vercel should detect "Other" — that's fine, no build
   step is needed for a plain Node/Express backend like this.
5. **Environment Variables** (same three as before):
   ```
   DATABASE_URL = <your Neon connection string>
   JWT_SECRET = <your secret>
   FRONTEND_URL = *
   ```
6. Deploy. Vercel gives you a URL like `https://sahay-backend.vercel.app`.
7. Test:
   ```
   https://sahay-backend.vercel.app/api/health
   ```
   Expect `{"ok":true}`. Then re-run your full login → patients → sessions →
   reminders → alerts → sync test pass against this URL.

## One real limitation, stated plainly

Serverless cold starts mean the *first* request after a period of no traffic
can take a second or two longer than usual (Vercel spinning up a fresh
instance + your schema-init middleware running). Not as slow as Render's free
tier "sleep" (30-60s), but worth a warm-up request before a live demo anyway,
same advice as before.

## Give the team this URL

Send Person 6 and Person 1 `https://sahay-backend.vercel.app/api` as the new
`VITE_API_URL` — same integration as planned, just a different host underneath.
