# My Trips

Tech stack is defined in PROJECT.md. Use only the technologies listed there; do not introduce alternatives without asking.

All UI must follow the design palette in DESIGN.md.

## Running the app

Each git worktree runs its own app and its own Supabase stack on ports set by its slot. The main checkout is slot 0 and linked worktrees use slots 1–9. Never assume port 3000; the details are in "Running one app per git worktree" in README.md.

When asked to run, start, or open the app, do this from the worktree root:

1. Run `pnpm wt:info`. It prints this worktree's slot, the app URL, and the Supabase API, Studio, and Mailpit URLs. Use these URLs and no others.
2. If `node_modules` is missing, run `pnpm install`.
3. Run `pnpm db:start`. It starts this worktree's Supabase stack and writes `.env.local`. If the stack is already running, it only refreshes `.env.local`.
4. If the app URL already responds, the app is running; do not start a second server. Otherwise run `pnpm dev` in the background and wait until the app URL responds.
5. Report the app URL, plus the Studio and Mailpit URLs if they are useful.

Rules:

- Use `pnpm dev`, `pnpm db:*`, and `pnpm supabase <args>`. Do not call `next dev` or `supabase` directly, because they reach the main checkout's ports and database. Do not pass `--port` or set `PORT`.
- Do not edit the `NEXT_PUBLIC_SUPABASE_*` values in `.env.local` by hand. Run `pnpm wt:env` to rewrite them.
- If `pnpm db:start` reports ports in use or no free slots, show the user its message and stop. Do not stop or remove other worktrees' stacks, or run `pnpm wt:release`, unless the user asks.
- To stop the app, stop the dev server and run `pnpm db:stop`, which keeps the data.
- After pulling new migrations, run `pnpm db:reset` to rebuild this worktree's database.

@PROJECT.md
@DESIGN.md
