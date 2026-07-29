# Cleveland Guys Fantasy Football Hub 🏈

Home base for the Cleveland Guys 10-team fantasy league (est. 2019) — rules,
punishments, trade board, votes, draft history, Hall of Fame, and **live ESPN
standings, scores, and an NFL news ticker**. ESPN still hosts the league; this
site is the social/organizational layer around it.

Built with **Next.js 14 (App Router) + TypeScript**. Styled in the Cleveland
Browns palette from the design handoff (cream `#f5efe4`, brown `#311D00`,
orange `#FB4F14`; Anton / Barlow Condensed / Barlow type).

---

## Pages

| Route | What's there |
|-------|--------------|
| `/` | Hero, season stats, League Pulse feed, **live scoreboard**, punishment + vote CTAs |
| `/rules` | Rule groups; **Commish Mode** reveals add/edit affordances |
| `/punishments` | Current sentence + "Hall of Shame" history |
| `/standings` | **Live ESPN standings** (with graceful preview fallback) + live scoreboard |
| `/matchups` | **Live matchups & full schedule** — browse any week, live/final scores, records |
| `/draft` | Current draft order + per-year reveal-video grid |
| `/trades` | Editable per-team trade boards (position toggles + player list) |
| `/votes` | Real vote-casting polls with live tallies |
| `/vacation` | 2028 destination vote + planning thread |
| `/history` | **Champions by year + records, pulled from ESPN league history** |

A global **NFL news ticker** (ESPN's public news feed) runs across the top of
every page.

---

## Live ESPN integration

ESPN has no official public API, so this uses the same read endpoint the ESPN
web app uses (`lm-api-reads.fantasy.espn.com/apis/v3/...`). All ESPN calls run
**server-side** (Next.js route handlers in `src/app/api/*`) so your private
league cookies never reach the browser and CORS is a non-issue.

| Endpoint | Source | Auth |
|----------|--------|------|
| `GET /api/standings` | league `mTeam` + `mStandings` views | cookies (private league) |
| `GET /api/scoreboard` | league `mScoreboard` view (current week) | cookies (private league) |
| `GET /api/matchups` | league `mScoreboard` + `mSettings` (full schedule) | cookies (private league) |
| `GET /api/history` | `leagueHistory` per season → champions + regular-season last place | cookies (private league) |
| `GET /api/news` | ESPN public NFL news feed | none |

If ESPN data isn't available (no cookies yet, preseason, or a network block),
every page **degrades gracefully** to built-in preview data and shows a small
status banner — the site is never broken.

### Wiring up YOUR league (2-minute setup)

This is a **private** league, so it needs two session cookies.

1. Copy the env template:
   ```bash
   cp .env.example .env.local
   ```
2. Log into <https://fantasy.espn.com> in your browser.
3. Open **DevTools → Application → Cookies → `https://fantasy.espn.com`**.
4. Put the cookie **values** into `.env.local`:
   ```env
   ESPN_LEAGUE_ID=2110005
   ESPN_S2=<value of the espn_s2 cookie>
   ESPN_SWID=<value of the SWID cookie, keep the { } braces>
   ```
5. Restart `npm run dev`. Standings and the scoreboard now show live data.

> These cookies expire periodically (roughly every year, or on logout). If live
> data stops, just refresh them from the browser again.

---

## Peter's punishment photo wall

The Punishments page has a shared photo wall where the punished player uploads a
weekly pic (e.g. wearing the jersey) that **everyone** sees. Images are stored
in **Vercel Blob** so they're shared across all viewers (not per-browser).

**Enable it (1 minute, one time):**
1. In your Vercel project → **Storage** tab → **Create Database** → **Blob** →
   connect it to this project.
2. Vercel automatically adds a `BLOB_READ_WRITE_TOKEN` env var — nothing to copy.
3. Redeploy. The uploader goes live; until then it shows a friendly "not set up"
   note and everything else works normally.

Photos are downscaled in the browser before upload. Commish Mode shows a delete
(×) on each photo for moderation.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
```

---

## Deploy to Vercel

1. Push this repo to GitHub (already on branch
   `claude/site-live-results-espn-fantasy-9nup52`).
2. Import the repo at <https://vercel.com/new>.
3. In **Project → Settings → Environment Variables**, add `ESPN_LEAGUE_ID`,
   `ESPN_S2`, and `ESPN_SWID` (mark them as encrypted/secret).
4. Deploy. Vercel has open outbound network access, so ESPN calls work in
   production even though this dev sandbox blocks them.

---

## Project layout

```
src/
  app/
    layout.tsx            # shell: sidebar + news ticker + content
    page.tsx              # Home
    <section>/page.tsx    # the other 8 pages
    api/
      standings/route.ts  # live ESPN standings proxy
      scoreboard/route.ts # live ESPN scoreboard proxy
      news/route.ts        # public NFL news proxy
  components/
    Sidebar.tsx           # nav + Commish Mode toggle (mobile drawer)
    NewsTicker.tsx        # scrolling NFL headline ticker
    LiveScoreboard.tsx    # current-week matchup scores (auto-refresh)
    Avatar.tsx            # ESPN logo or initials fallback
    CommishProvider.tsx   # commish/admin mode context
    ui.tsx                # small shared primitives
  lib/
    espn.ts               # ESPN v3 API client (server-only)
    leagueData.ts         # league content (rules, polls, history, ...)
    teams.ts, theme.ts, links.ts
```

---

## Notes & next steps

- **Anyone can use the interactive stuff** — editing trade boards, voting in
  polls, and posting to the vacation thread need no login.
- **Commish Mode** (sidebar toggle) is password-gated (`IAMCOMMISH`) and only
  unlocks admin-only affordances like rule add/edit. It's a light client-side
  gate, **not real security** — the password ships in the browser bundle. For
  true access control, move commish actions behind a server-side login
  (NextAuth, Clerk, etc.). Change the password in `src/components/CommishProvider.tsx`.
- Votes, trade boards, and the vacation thread persist to **localStorage** for
  now. Move them to a database (or Vercel KV / Postgres) when you want shared,
  multi-user state.
- Draft reveal videos and vacation photos are placeholders — drop in real
  YouTube embeds / images when ready.
- **History & Punishments** now pull the real record from ESPN: each season's
  champion (final #1) and regular-season last-place finisher (worst playoff
  seed — playoffs excluded, per the league rule), plus computed records (most
  titles, most points in a season, most last-place finishes). The punishment
  *descriptions* (jersey, beer 5K, …) live in `punishmentDescriptions` in
  `src/lib/leagueData.ts` keyed by year — edit those; the losers come from ESPN.
  Records ESPN can't compute (worst single-week score, longest playoff drought)
  were dropped rather than shown as fake data.
