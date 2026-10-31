# My Trips

Track trips and the places you visit. Stack and structure are in [PROJECT.md](PROJECT.md).

## Getting started

```bash
pnpm install
pnpm db:start                # local Supabase (Docker required)
cp .env.example .env.local   # fill in values from `supabase status`
pnpm dev
```

Sign-in uses email magic links. Locally, emails land in Mailpit at http://127.0.0.1:54324.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm typecheck` | Generate route types and run `tsc` |
| `pnpm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `pnpm test:e2e` | Playwright journeys (`e2e/`) |
| `pnpm db:reset` | Re-apply migrations and `supabase/seed.sql` |
| `pnpm db:test` | pgTAP tests (`supabase/tests/`) |
| `pnpm db:types` | Regenerate `src/lib/supabase/database.types.ts` |
