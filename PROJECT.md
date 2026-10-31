# My Trips

## Tech stack

- Next.js 16 (App Router), TypeScript
- Tailwind CSS, shadcn/ui
- Supabase (Postgres, Auth, RLS, `@supabase/ssr`)
- MapLibre GL JS (`react-map-gl/maplibre`), OpenFreeMap tiles, Geoapify geocoding
- Zod
- Vitest, Playwright, pgTAP
- pnpm
- Vercel

## Project structure

Code lives under `src/` and is organized by feature. Each feature owns its UI, validation, data access, and any feature-specific hooks, state, and types. `app/` defines routes, layouts, and route-level loading/error states, and composes features. Shared UI lives in `components/`; integrations and shared infrastructure live in `lib/`.

This tree describes where code belongs, not folders to create in advance. Add files and directories only when functionality needs them.

```
src/
├── app/                        # Routing and screen composition
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles and Tailwind theme
│   ├── not-found.tsx
│   ├── (public)/               # Landing, marketing, shared trip links as needed
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── auth/callback/route.ts   # /auth/callback
│   ├── (main)/
│   │   ├── layout.tsx          # Shared app shell and navigation
│   │   ├── dashboard/page.tsx
│   │   ├── trips/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── [tripId]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       └── not-found.tsx
│   │   └── map/page.tsx
│   └── api/                    # HTTP endpoints only when needed
│
├── features/
│   ├── auth/
│   ├── trips/
│   │   ├── components/         # Feature UI
│   │   ├── queries.ts          # Server-only reads
│   │   ├── actions.ts          # Server Actions and mutations
│   │   ├── schemas.ts          # Zod schemas
│   │   └── schemas.test.ts     # Colocated unit tests
│   ├── visits/                 # A location visited on a trip at a time
│   └── map/
│       ├── components/
│       │   ├── trips-map.tsx
│       │   ├── trips-map-lazy.tsx # Client wrapper; dynamic import, ssr: false
│       │   └── place-search.tsx
│       └── utils.ts
│
├── components/
│   ├── ui/                     # Shared primitives, including shadcn/ui
│   └── layout/                 # Shared navigation and shell UI
│
├── lib/
│   ├── auth/require-user.ts    # Server-only identity check
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Request-scoped server client
│   │   ├── proxy.ts            # Session-refresh helper
│   │   └── database.types.ts   # Generated database types
│   ├── maps/                   # Basemap style URL, geocoding integration
│   ├── env.ts                  # Environment validation
│   └── utils.ts                # Small shared utilities
│
├── tests/                      # Test setup, fixtures, shared mocks
└── proxy.ts                    # Next.js entry point; calls Supabase refresh helper

supabase/
├── config.toml
├── migrations/                 # Schema changes and RLS policies
├── tests/                      # pgTAP database and RLS tests
└── seed.sql

e2e/                            # Playwright user journeys
public/                         # Static assets
.env.example                    # Environment variable names and placeholders
```

### Rules

- **Routes compose features.** Keep pages and Route Handlers thin. Pages call feature queries and compose feature components; Route Handlers delegate business operations to feature code. Route-local UI may live in `_components/` beside its page. Add loading, error, and not-found boundaries where useful.
- **Features retain domain ownership.** Features may import shared UI from `components/` and infrastructure from `lib/`, but do not import other features. Compose features in `app/` and pass data through props. For example, a page fetches visits and passes map-ready points to the map feature; visit queries stay in `visits/`. Do not move domain logic into shared infrastructure merely to avoid a feature dependency.
- **Start with queries and actions.** `queries.ts` owns server reads; `actions.ts` owns Server Actions and mutations. Each action validates input with the feature's Zod schema. Extract feature-local services when queries, actions, or Route Handlers need reusable business operations. Split files into directories only when they become substantial.
- **Declare server and client boundaries.** Query modules and server helpers import `server-only`; Server Action modules declare `'use server'`. Interactive components declare `'use client'` at their entry points. The map's dynamic import with `ssr: false` lives inside the Client Component `trips-map-lazy.tsx`. These boundaries do not replace authorization.
- **Authorize at data access.** Every protected query, action, and server operation checks identity through `requireUser()` and uses a user-authenticated Supabase client with RLS. Normal application operations must not use an administrative client that bypasses RLS. Authentication entry points and intentionally public operations have their own explicit access rules. The `(main)` layout may check identity for an early redirect, but route groups and layouts do not protect data operations.
- **Keep proxy focused.** `src/proxy.ts` delegates session refresh to `lib/supabase/proxy.ts`. It is not the authorization boundary for queries or mutations.
- **Use predictable data flow.** Server Components perform initial reads; Server Actions handle form writes, return structured validation errors, and revalidate affected views after successful mutations. Add HTTP endpoints only for actual HTTP consumers.
- **Add structure when needed.** Feature-specific `hooks/`, `types.ts`, and `store/` are optional. Start with React state before adding a store. Keep generated types beside the Supabase clients. Do not pre-create global `services/`, `types/`, or `hooks/` folders.
- **Scope providers narrowly.** Add providers only for functionality in use. Feature-specific providers live with their feature and wrap the smallest relevant subtree; map or query providers are not automatically root providers.
- **Tests colocate.** Vitest tests live beside source as `*.test.ts(x)`. Shared setup lives in `src/tests/`, Playwright journeys in `e2e/`, and pgTAP tests in `supabase/tests/`. RLS tests cover ownership isolation, including attaching or moving a visit to another user's trip.
- **Add features incrementally.** Create a feature module when behavior needs a distinct owner, add routes only if it needs a URL, and add migrations if it needs database changes.
