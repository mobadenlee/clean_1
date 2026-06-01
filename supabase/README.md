# supabase/

Database migrations and Supabase project config live here. The repo
treats the database as code — every schema change must land as a new
numbered migration file, never as a click in the dashboard, so that
reviewers can verify what runs in production by reading the diff.

## Layout

```
supabase/
└── migrations/
    ├── 0001_init.sql                       full schema + RLS + triggers + RPCs
    ├── 0002_counters_and_role_lock.sql     counter triggers + role-lock trigger
    ├── 0003_refresh_rls.sql                RLS reconciliation + best-answer guard
    └── 0004_grants_and_post_init.sql       role grants + categories seed +
                                            notification triggers + trust system
```

## Applying migrations

With the Supabase CLI installed and linked to the project:

```bash
supabase db push
```

Or, for a fresh local dev DB:

```bash
supabase db reset
```

Either of these will replay every file in `migrations/` in lexicographic
order.

## What's in `0001_init.sql`

- Enums: `user_role`, `issue_urgency`, `issue_status`, `vote_type`
- Tables: `profiles`, `issue_categories`, `issues`, `responses`,
  `votes`, `saved_issues`, `notifications`, `trust_events`
- Triggers: auto-create profile on auth signup; overwrite
  `is_ambassador_response` from the author's real role; touch
  `updated_at` on row update
- RPC: `increment_view_count(uuid)` for the fire-and-forget view bump
- **RLS policies on every user-writable table** — see [`../SECURITY.md`](../SECURITY.md)
  for the threat model and per-table policy summary.

## Adding a new migration

```bash
supabase migration new <slug>
```

This creates `supabase/migrations/<timestamp>_<slug>.sql`. Write the
forward-only DDL there. If a change requires altering RLS, update the
policy table in `SECURITY.md` in the same PR.

## Local development

`.env.local` should point at either a local `supabase start` instance
or a dedicated dev project. **Never** point dev at the production
database — RLS protects user data but doesn't protect you from
accidentally truncating tables during testing.
