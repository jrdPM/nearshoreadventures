# Nearshore Adventures

Everything happening on Cape Cod, by land or by sea. A mobile-first events calendar for all 15 Cape towns, rounded up automatically every few days, with a Thursday email.

## How it works

```
 Mon/Wed/Fri  ┌──────────────────────┐   trusted & clean   ┌──────────────────┐
 GitHub  ───▶ │ npm run scrape       │ ──────────────────▶ │ data/events.json │ ──▶ Vercel redeploys the site
 Actions      │ 46 Cape sources      │                     └──────────────────┘
              │ feeds → markup → AI  │   iffy / untrusted  ┌────────────────────────┐
              └──────────────────────┘ ──────────────────▶ │ data/review-queue.json │ ──▶ /admin (approve, remove,
                                                           └────────────────────────┘      or trust a source)
 Thursday 7:30am ──▶ npm run newsletter ──▶ Beehiiv
```

- **The site** is Next.js on Vercel. All event data lives in `data/` as JSON, so there's no database to pay for or babysit.
- **The round-up** (`scripts/scrape`) checks every source in `data/sources.json`. For each one it tries, in order: the WordPress "The Events Calendar" API, schema.org event markup on the page, any iCal feed the page links to, and finally (if `ANTHROPIC_API_KEY` is set) Claude reading the page. It follows robots.txt, identifies itself, keeps only short excerpts and always links back to the organizer.
- **Review queue.** Events from trusted sources go live on their own. Anything from an untrusted source, or that looks off (no link, unsure AI read, cancelled), waits at `/admin`. Trusting a source there approves its waiting events and lets future ones through automatically.
- **Venue submissions** from `/submit` land in the same queue.
- **The Thursday email** (`scripts/newsletter.ts`) picks a spread of weekend highlights plus the week ahead, saves a copy in `newsletter/`, and sends it through Beehiiv.
- `data/scrape-report.json` shows which sources worked on the last run. The admin page lists the ones that need a look.

## Setting it up

1. **Vercel:** import this repo, then add the variables from `.env.example` (`NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `GITHUB_TOKEN`, Beehiiv keys). Point your domain at it.
2. **GitHub → Settings → Secrets and variables → Actions:** add `ANTHROPIC_API_KEY` (optional, for pages with no feed), `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, and a variable `SITE_URL`.
3. **Run the first round-up:** Actions → "Event round-up" → Run workflow. Sample events disappear once real ones arrive.

## Day to day

| Task | Where |
|---|---|
| Approve or remove queued events | `/admin` |
| Add, remove or trust a source | edit `data/sources.json` |
| Mark a new "by boat" venue | `scripts/scrape/waterfront.ts` |
| Run the round-up now | Actions → Event round-up → Run workflow |
| Preview the email without sending | Actions → Thursday email → Run workflow → "Build it without sending" |

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run scrape       # pull events (add a source id to run just one: npm run scrape -- payomet)
npm run newsletter -- --dry
npm test && npm run lint && npm run typecheck
```

Stock photos are from Unsplash; maps use OpenStreetMap data with CARTO tiles (free for non-commercial use, so revisit if the site starts making money).
