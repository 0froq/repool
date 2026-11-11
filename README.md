# repool

Upstream contribution radar: skim open issues and PRs across the repos you starred (or a GitHub star list) in one stream, then keep a private shortlist. Read-only toward GitHub; nothing is cloned and nothing is written back.

## Run

```sh
pnpm install
pnpm dev
```

### Sign in

Visitors sign in with GitHub (OAuth App, scope `read:user`). Create an OAuth App under GitHub → Settings → Developer settings → OAuth Apps, set its callback URL to `<origin>/api/auth/callback` (e.g. `http://localhost:3000/api/auth/callback`), then set:

```sh
NUXT_GITHUB_CLIENT_ID=...
NUXT_GITHUB_CLIENT_SECRET=...
NUXT_SESSION_SECRET=...   # any long random string
```

The access token is sealed (AES-GCM) into an httpOnly cookie for 30 days and never reaches the browser. Every GitHub request uses the signed-in visitor's own token.

In `pnpm dev` only, when no session exists the server falls back to `GITHUB_TOKEN`, `GH_TOKEN` or `gh auth token`, so local work needs no OAuth App. Production builds have no such fallback.

## What it does

- **Sources**: all starred repos (archived ones skipped) or any of your star lists.
- **Stream**: per repo, open issues and PRs updated within the chosen window (24 hours, 7 days by default, or 30 days), at most 100 of each kind. A `+` on a rail count marks a repo that hit that cap; hover it for the real open totals. Clicking a row opens the issue or PR in a new tab.
- **Filters**: issues / PRs, assignee (anyone, unassigned, assigned to me), labels (multi-select, any of; or click a label on a row), keyword (title, repo, label, author), sort.
- **Personal layer** (browser `localStorage` only): `Inbox` / `Watching` / `Tonight` / `Parked`, priority `!`–`!!!`. Marked items keep a snapshot so they still show after switching source or after the issue drops out of the feed.
- Below 900px the sidebar folds into a left drawer opened from the header.

Server responses are cached per user (sources 30 min, feed 5 min); **refresh** bypasses the cache.

## Scripts

- `pnpm check`: lint, format check, typecheck
- `pnpm build`
