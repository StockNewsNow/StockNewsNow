# Stock Buzz — real-time ticker sentiment terminal

A Bloomberg-terminal-styled web app that tracks which stock tickers are being
talked about on Reddit *and* in the financial press right now, scores the
sentiment of each mention, and ranks them into a live leaderboard with volume,
average sentiment, and velocity. Ships with a marketing homepage and pricing
tiers so you can charge for access.

- `/`     → marketing landing page (terminal aesthetic, features, pricing)
- `/app`  → the live sentiment terminal (the dashboard)

Everything runs on free tiers: Vercel (hosting + API), Supabase (database),
and GitHub Actions (the scheduler). No paid sentiment API — scoring is done
in-house with VADER plus a finance-slang lexicon.

```
GitHub Actions (every 5 min)
      │  GET /api/scan?secret=…
      ▼
 /api/scan
      ├─►  Reddit (5 subreddits)        ─┐
      └─►  News RSS (CNBC, Yahoo,        ─┤─►  extract tickers ─►  score (VADER + finance lexicon)
           MarketWatch, Nasdaq, etc.)    │
      │                                  ▼
      ▼                              Supabase  (mentions table)
                                         ▲
      │  /api/trending?source=reddit|news  (aggregates last N min, computes velocity)
      ▼
 React dashboard  (auto-refreshes every 30s, filter by source, click a ticker for the posts)
```

## Why an external scheduler?

Vercel's free Hobby plan **caps cron jobs at once per day** — anything more
frequent fails at deploy. So the scan is triggered by GitHub Actions instead
(included in `.github/workflows/scan.yml`), which runs roughly every 5 minutes
for free. Any HTTP scheduler works — cron-job.org, Runhooks, your own machine.

---

## Setup (about 15 minutes)

### 1. Create the Supabase database
1. Make a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open the SQL editor and run the contents of `supabase/schema.sql`.
3. From Project Settings → API, copy your **Project URL** and **service_role key**.

### 2. Deploy to Vercel
```bash
npm install
vercel --prod
```

Set these environment variables in the Vercel dashboard
(Settings → Environment Variables), then redeploy:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | the service_role key |
| `SCAN_SECRET` | any long random string you invent |

### 3. Wire up the scheduler (GitHub Actions)
1. Push this repo to GitHub.
2. In the repo: Settings → Secrets and variables → Actions → add two secrets:
   - `SCAN_URL` = `https://your-app.vercel.app/api/scan`
   - `SCAN_SECRET` = the same string you used in Vercel
3. The workflow runs automatically every ~5 min. To test immediately, go to the
   Actions tab → "scan-reddit-sentiment" → Run workflow.

### 4. Seed some data
Trigger one scan manually so the leaderboard isn't empty:
```bash
curl "https://your-app.vercel.app/api/scan?secret=YOUR_SCAN_SECRET"
```
You should get back `{ "inserted": N, "tickers": M }`. Refresh the dashboard.

---

## How scoring works

Each Reddit post's title + body is run through **VADER** (a lexicon-based
sentiment model tuned for social media), then adjusted by a small
**finance lexicon** (`src/lib/tickers.js`) that teaches it trader slang VADER
gets wrong — "moon", "puts", "tank", "squeeze", "bagholder", etc. The result is
clamped to a −1 (bearish) … +1 (bullish) scale.

Tickers are pulled from post text two ways: `$CASHTAGS` and bare uppercase words
that match a known-symbol list. The known list (also in `tickers.js`) prevents
false positives like "CEO" or "USA" being read as tickers.

### Tuning
- **Add tickers**: extend `KNOWN_TICKERS` in `src/lib/tickers.js`.
- **Add slang**: extend `FINANCE_LEXICON` in the same file.
- **Add subreddits**: edit `SUBREDDITS` in `api/scan.js`.
- **Add / change news outlets**: edit `RSS_FEEDS` in `api/_news.js`. Each entry is
  just a `{ source, url }` pair pointing at any outlet's RSS feed.

## News sources

News comes from free public RSS feeds of popular outlets — CNBC, Yahoo Finance,
MarketWatch, Nasdaq, Investing.com, and Seeking Alpha — parsed in `api/_news.js`
with no API key required.

Headlines are ticker-extracted and sentiment-scored with the exact same engine
as Reddit posts, then stored with a `news:<outlet>` source tag so the dashboard's
News filter and the per-ticker drill-down can separate them from social chatter.

If an individual feed ever changes its URL or format, the scanner logs it in the
scan response's `errors` array and keeps going with the others — one broken feed
never sinks a scan.

### Upgrading sentiment accuracy
VADER is good and free but has a ceiling on finance text (it misreads slang like
"insane" or "on fire" as negative). For better accuracy, swap the scoring step
for **FinBERT** (a finance-tuned transformer) run as a small Python service, or
batch post text to an LLM (Claude/Gemini) with a sentiment-scoring prompt. The
rest of the pipeline stays identical — only `scorePost()` in `api/scan.js` changes.

---

## Accounts & access

The app now has authentication and a paywall:

- `/` landing → "Get started" (signup) and "Log in" buttons
- `/auth` → one screen with Login and Sign up tabs (Supabase Auth)
- `/app` → requires a logged-in session; non-Pro users see a blocking
  "Upgrade to Pro" modal and can't use the terminal until `is_pro` is true

### Supabase setup
1. Run all of `supabase/schema.sql` (it now also creates the `profiles` table,
   the auto-create-on-signup trigger, and row-level security).
2. In Supabase → Authentication → Providers, make sure Email is enabled.
3. For instant access on signup (no email confirmation step), turn off
   "Confirm email" under Authentication → Sign In / Providers → Email. With it on,
   users must click a confirmation link before they can log in.

### Frontend env vars (in addition to the server ones)
| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | the public anon key (NOT the service key) |

The anon key is safe to expose — every query is constrained by the RLS policies
in the schema. Users can read only their own profile and cannot set `is_pro`
themselves; that flag is server-only.

### Testing the Pro experience
Until Stripe is connected, flip a user to Pro by hand: in Supabase → Table editor
→ `profiles`, set `is_pro` to `true` for your row. Reload `/app` (or hit
"I've upgraded — refresh" in the modal) and the terminal unlocks.

## Charging (Stripe — wired but dormant)

Billing is scaffolded so you can switch it on later without rework:

- The Go Pro button sends users to the Stripe link in `src/lib/config.js`,
  appending `?client_reference_id=<user_id>` so the payment maps to the account.
- `api/stripe-webhook.js` is a ready webhook that flips `profiles.is_pro` on
  `checkout.session.completed` and back off when a subscription ends.

To turn it on later:
1. `npm install stripe`
2. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel.
3. Create a Stripe Payment Link ($40/mo) and paste it into `STRIPE_PRO` in
   `src/lib/config.js`.
4. Add a Stripe webhook pointing at `/api/stripe-webhook`.

That's the whole loop: pay → webhook sets `is_pro=true` → modal disappears.

## Notes & limits
- Reddit's public JSON is used without auth. It's rate-limited by IP; a scan
  every few minutes is well within limits. If you ever get throttled, add Reddit
  OAuth credentials and switch the fetch to `oauth.reddit.com`.
- Old rows accumulate. The schema includes a commented-out cleanup query —
  schedule it with Supabase `pg_cron` to delete mentions older than 7 days.
- This is a sentiment/popularity tracker, **not** investment advice.
