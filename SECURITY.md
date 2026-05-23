# Security model

This document is the human-readable mirror of `supabase/migrations/0001_init.sql`.
The migration is authoritative; if the two ever disagree, the SQL wins. Update
both together.

## Threat model assumptions

- The Supabase **anon key is public**. It will ship in the JS bundle and
  end up in every browser. All access control must therefore live in the
  database, not in the frontend.
- Anything sent over `supabase-js` is **client-controlled**. The frontend
  cannot be trusted to set role flags, ownership fields, or audit columns.
- The **service-role key never touches the browser**. It is only used by
  trusted server-side jobs (cron, webhooks) — not yet in this repo.

## What RLS protects

Every user-writable table has Row Level Security enabled and explicit
policies. The high-level shape:

| Table             | Read                              | Write                                       |
| ----------------- | --------------------------------- | ------------------------------------------- |
| `profiles`        | public                            | only `auth.uid() = id`; role is immutable*  |
| `issue_categories`| public when `is_active`           | (none — admin-only via SQL)                 |
| `issues`          | public unless `flagged`           | `author_id = auth.uid()`                    |
| `responses`       | public                            | `author_id = auth.uid()`                    |
| `votes`           | **owner only**                    | `user_id = auth.uid()`                      |
| `saved_issues`    | **owner only**                    | `user_id = auth.uid()`                      |
| `notifications`   | **owner only**                    | update-only (mark read); inserts via trigger|
| `trust_events`    | **owner only**                    | inserts via security-definer functions      |

\* Role immutability is enforced by the `prevent_role_change` trigger
(migration `0002`), which pins `profiles.role` to its previous value on any
client update. (Migration `0001` originally attempted this inside the
`profiles_update_own` policy via a self-referential subquery; that approach
was fragile under RLS and was replaced by the trigger.) Role changes are an
admin-only operation, done out-of-band via the service-role key — which
bypasses the trigger — or a future admin tool.

## Server-side invariants (triggers)

Two things are explicitly NOT trusted from the client and are owned by
the database:

1. **`responses.is_ambassador_response`** — set by
   `trg_response_ambassador` from `profiles.role` at insert time.
   `useResponses.js` no longer passes this field; if a malicious client
   sends it, the trigger overwrites it.
2. **Profile provisioning on signup** — `handle_new_user` creates a row
   in `profiles` for every new `auth.users` row, with a generated unique
   username derived from name/email. The frontend's `ensureProfile()` is
   a defensive fallback in case the trigger fires after the client has
   already tried to fetch.
3. **`responses.is_best_answer`** — guarded by `guard_best_answer_owner_only`
   (migration `0003`). Only the parent issue's owner may change this column;
   any other actor's attempt raises `42501`. The supported "mark solved" flow
   writes `issues.solved_response_id` (owner-governed), so this trigger is a
   defensive backstop against any future code path that writes the column on
   `responses` directly.

## What still requires manual configuration in Supabase

The migration covers schema + RLS. These must be set in the Supabase
dashboard (they're outside the database):

1. **Redirect URL allowlist** (Authentication → URL Configuration).
   Must contain only:
   - `http://localhost:5173/auth/callback` (dev)
   - `https://<your-production-domain>/auth/callback`

   Without this restriction, an attacker can initiate an OAuth flow that
   redirects to a domain they control.

2. **Email confirmation** (Authentication → Providers → Email). Should
   be enabled in production. Confirmation links target `/auth/callback`
   on the frontend, which now is a real route (Phase 2).

3. **Anon-key exposure check.** If `.env.local` was ever committed and
   pushed publicly, rotate the anon key (Authentication → API). Anon-key
   rotation is safe — it's designed to be public — but rotating still
   pays off if the key has been seen in places you'd rather it hadn't.

## Verifying RLS locally

```sql
-- As a logged-in user (run via supabase-js or the SQL editor with
-- "Run as user" set):
select * from votes;                              -- only mine, by policy
select * from notifications where recipient_id <> auth.uid();   -- empty
insert into responses (issue_id, author_id, body)
  values ('<some-id>', '<other-users-id>', 'hi'); -- denied
```

If any of the above returns more than expected, a policy regressed.

## Reporting

Security issues: open a private GitHub security advisory rather than a
public issue. Do not include real user data in reports.
