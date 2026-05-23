# NYSC HelpDesk

A community help-desk platform where members post issues, respond to one
another, vote, and build a trust score over time. Ambassadors are surfaced
with a verified badge on their responses. Built as a single-page React app
backed by Supabase (Postgres + Auth + Row Level Security).

## Tech stack

- **React 18** with **Vite 5** for the build/dev tooling
- **React Router 6** for client-side routing
- **TanStack Query (React Query) 5** for server-state, caching, and mutations
- **Supabase** (`@supabase/supabase-js`) for Postgres, Auth, and RLS
- Plain CSS with design tokens (`src/styles/`) — no UI framework dependency

## Prerequisites

- **Node.js 20+** (an `.nvmrc` is included — run `nvm use`)
- A **Supabase project** (free tier is fine). You'll need its URL and anon key.
- Optional: the **Supabase CLI** if you want to apply migrations from your machine.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local and paste in your Supabase URL + anon key

# 3. Apply the database schema (see "Database" below)

# 4. Run the dev server
npm run dev
```

The dev server starts on **http://localhost:5173**.

## Available scripts

| Script            | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR        |
| `npm run build`   | Production build into `dist/`             |
| `npm run preview` | Serve the built `dist/` locally to verify |

## Environment variables

Both are required — `src/lib/supabase.js` throws on startup if either is missing.

| Variable                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | The public anon key from Project Settings → API |

The anon key is intentionally public and ships in the browser bundle; all
access control is enforced in the database via Row Level Security. See
[`SECURITY.md`](./SECURITY.md) for the full threat model.

## Database

The schema is managed as code under [`supabase/`](./supabase). Everything —
tables, enums, triggers, RPCs, and RLS policies — lives in a single migration,
`supabase/migrations/0001_init.sql`.

With the Supabase CLI installed and linked to your project:

```bash
supabase db push        # apply migrations to the linked project
# or
supabase db reset       # rebuild a fresh local dev database
```

After applying the schema, finish the manual dashboard configuration described
in [`SECURITY.md`](./SECURITY.md) (redirect URL allowlist, email confirmation).
See [`supabase/README.md`](./supabase/README.md) for the migration workflow.

> **Never point your dev environment at the production database.** Use a local
> `supabase start` instance or a dedicated dev project.

## Project structure

```
src/
├── components/     Reusable UI, organized by feature (dashboard, issues, layout, profile, ui)
├── context/        React context providers (AuthContext, AppContext)
├── data/           Static constants
├── hooks/          React Query hooks (useIssues, useVotes, useResponses, ...)
├── lib/            Supabase client + query functions
├── pages/          Route-level screens (public, dashboard, ambassador)
├── routes/         Routing + auth gating (ProtectedRoute, PublicOnlyRoute, AuthCallback)
├── styles/         Design tokens, animations, global CSS
└── utils/          Formatters, validators, trust calculation, normalization
```

## Deployment

The repo includes a `vercel.json` that rewrites all routes to `index.html`
(required for client-side routing on Vercel). To deploy:

1. Import the repo into Vercel (or your host of choice).
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
4. Add your production `https://<domain>/auth/callback` URL to the Supabase
   redirect allowlist (see `SECURITY.md`).

## Security

Please read [`SECURITY.md`](./SECURITY.md). To report a vulnerability, open a
private GitHub security advisory rather than a public issue, and never include
real user data in a report.
