# My Trips

Tech stack is defined in PROJECT.md. Use only the technologies listed there; do not introduce alternatives without asking.

All UI must follow the design palette in DESIGN.md.

Each git worktree runs its own app and Supabase stack (see "Running one app per git worktree" in README.md). Use `pnpm dev`, `pnpm db:*`, and `pnpm supabase <args>`. Do not call `next dev` or `supabase` directly, because those reach the main checkout's ports and database.

@PROJECT.md
@DESIGN.md
