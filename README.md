# My Trips

Track trips and the places you visit. Stack and structure are in [PROJECT.md](PROJECT.md).

## Getting started

```bash
pnpm install
pnpm db:start   # local Supabase (Docker required); also writes .env.local
pnpm dev
```

`pnpm db:start` fills `NEXT_PUBLIC_SUPABASE_*` in `.env.local` from the running stack. Put the Google OAuth secrets in `supabase/.env` (see `.env.example`).

## Running one app per git worktree

Every git worktree runs its own app and its own local Supabase stack, so several agents can work in parallel without sharing ports or a database. `scripts/worktree.mjs` gives each worktree one of 10 slots. The main checkout is always slot 0, which leaves 9 slots for parallel worktrees.

| | Slot N (0–9) | Main checkout (slot 0) | Example: slot 3 |
| --- | --- | --- | --- |
| App (`pnpm dev`) | `3000 + N` | `3000` | `3003` |
| E2E (`pnpm test:e2e`) | `3100 + N` | `3100` | `3103` |
| Supabase API and OAuth callback | `54321 + N` | `54321` | `54324` |
| Other Supabase ports (DB, Studio, Mailpit) | `54400 + 10N` + `2`, `3`, `4` | `54402`, `54403`, `54404` | `54432`, `54433`, `54434` |
| Supabase project | `my-trips-wtN` | `my-trips` | `my-trips-wt3` |

Run `pnpm wt:info` to see this worktree's slot and URLs. Slots are recorded in `.git/my-trips-worktree-slots.json`, which all worktrees share. A slot is freed when git no longer lists its worktree, for example after `git worktree remove`. The next worktree that gets the slot starts with a clean database.

In a new worktree:

```bash
pnpm install
pnpm db:start   # copies .env.local and supabase/.env from the main checkout if they are missing
pnpm dev
```

- Use the `pnpm` scripts, or `pnpm supabase <args>`, instead of calling `supabase` or `next dev` directly. The bare commands use the main checkout's ports and database.
- Each stack runs about a dozen containers. Stop the ones you aren't using with `pnpm db:stop`, which keeps their data. Run `pnpm wt:release` to delete a worktree's stack and data and free its slot.
- If all slots are taken, `pnpm db:start` lists which worktree holds each slot.

### Google sign-in

Google redirects to the Supabase API port, which is consecutive across slots. Add these 10 URIs once under **Authorized redirect URIs** on the Google OAuth client (`pnpm wt:oauth-urls` prints them):

```
http://127.0.0.1:54321/auth/v1/callback
http://127.0.0.1:54322/auth/v1/callback
...
http://127.0.0.1:54330/auth/v1/callback
```

The app's own `/auth/callback` is allowed on any local port by `additional_redirect_urls` in `supabase/config.toml`.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server on this worktree's port |
| `pnpm build` / `start` | Next.js |
| `pnpm typecheck` | Generate route types and run `tsc` |
| `pnpm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `pnpm test:e2e` | Playwright journeys (`e2e/`) |
| `pnpm db:start` / `db:stop` / `db:status` | This worktree's Supabase stack |
| `pnpm db:reset` | Re-apply migrations and `supabase/seed.sql` |
| `pnpm db:test` | pgTAP tests (`supabase/tests/`) |
| `pnpm db:types` | Regenerate `src/lib/supabase/database.types.ts` |
| `pnpm supabase <args>` | Any Supabase CLI command, scoped to this worktree |
| `pnpm wt:info` / `wt:env` | Show this worktree's slot and URLs / rewrite `.env.local` |
| `pnpm wt:oauth-urls` | Print the Google OAuth redirect URIs for all slots |
| `pnpm wt:release` | Delete this worktree's Supabase stack and data, and free its slot |
