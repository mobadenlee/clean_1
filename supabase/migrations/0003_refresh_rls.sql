-- ============================================================================
-- 0003_refresh_rls.sql — RLS reconciliation pass
-- ----------------------------------------------------------------------------
-- Post-refactor reconciliation of all Row Level Security against the CURRENT
-- frontend code (verified against src/ at time of writing), superseding the
-- ad-hoc policy state left by 0001 + 0002.
--
-- This migration is a faithful RESTATEMENT of the policy set: every policy is
-- dropped-if-exists and recreated, so 0003 alone documents the authoritative
-- access model. It is forward-only and safe to run on a database that has
-- already applied 0001 and 0002.
--
-- It changes runtime behavior in exactly ONE place:
--   • responses.is_best_answer may now only be flipped by the parent issue's
--     owner (Option A). 0001's responses_update_own policy would have let the
--     response author flip it; that path is currently dead code in the
--     frontend, but we close the hole defensively in case it is ever wired up.
--
-- Everything else (ownership rules, owner-only reads on private tables,
-- category visibility, deny-by-default notification inserts) is unchanged and
-- merely re-asserted.
--
-- Role immutability remains enforced by the prevent_role_change trigger from
-- 0002 — NOT by policy. This migration does not touch that trigger.
-- ============================================================================

-- Ensure RLS is on for every user-facing table (idempotent).
alter table public.profiles         enable row level security;
alter table public.issue_categories enable row level security;
alter table public.issues           enable row level security;
alter table public.responses        enable row level security;
alter table public.votes            enable row level security;
alter table public.saved_issues     enable row level security;
alter table public.notifications    enable row level security;
alter table public.trust_events     enable row level security;

-- ─── PROFILES ───────────────────────────────────────────────────────────────
-- Public read; update/insert only your own row. Role is pinned by trigger.
drop policy if exists profiles_read_all   on public.profiles;
create policy profiles_read_all on public.profiles
  for select
  using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update
  using      (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert
  with check (id = auth.uid());

-- ─── ISSUE_CATEGORIES ─────────────────────────────────────────────────────────
-- Public read of active rows only. No client write path exists in the app,
-- so there is intentionally no insert/update/delete policy (deny-by-default).
drop policy if exists categories_read_active on public.issue_categories;
create policy categories_read_active on public.issue_categories
  for select
  using (is_active);

-- ─── ISSUES ───────────────────────────────────────────────────────────────────
-- Public read except flagged (owner still sees own flagged rows).
-- Insert/update/delete require ownership. "Mark solved" is an issues UPDATE
-- and is therefore correctly restricted to the issue owner by issues_update_own.
drop policy if exists issues_read_visible on public.issues;
create policy issues_read_visible on public.issues
  for select
  using (status <> 'flagged' or author_id = auth.uid());

drop policy if exists issues_insert_self on public.issues;
create policy issues_insert_self on public.issues
  for insert
  with check (author_id = auth.uid());

drop policy if exists issues_update_own on public.issues;
create policy issues_update_own on public.issues
  for update
  using      (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists issues_delete_own on public.issues;
create policy issues_delete_own on public.issues
  for delete
  using (author_id = auth.uid());

-- ─── RESPONSES ─────────────────────────────────────────────────────────────────
-- Public read. Insert/update/delete require authorship. The is_ambassador_response
-- column is server-managed by trg_response_ambassador (0001) and is not trusted
-- from the client. The is_best_answer column is governed by the issue owner via
-- the trg_response_best_answer_owner_only trigger defined below — NOT by the
-- response author.
drop policy if exists responses_read_all on public.responses;
create policy responses_read_all on public.responses
  for select
  using (true);

drop policy if exists responses_insert_self on public.responses;
create policy responses_insert_self on public.responses
  for insert
  with check (author_id = auth.uid());

drop policy if exists responses_update_own on public.responses;
create policy responses_update_own on public.responses
  for update
  using      (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists responses_delete_own on public.responses;
create policy responses_delete_own on public.responses
  for delete
  using (author_id = auth.uid());

-- Best-answer authority belongs to the ISSUE OWNER, not the response author.
-- responses_update_own (above) already restricts UPDATEs to the response
-- author. This trigger adds a column-level guard: if an UPDATE changes
-- is_best_answer, the acting user must own the parent issue, otherwise the
-- change is rejected. This keeps the (author-only) edit policy intact for body
-- edits while moving best-answer control to the issue owner.
--
-- Note: because responses_update_own only lets the response author UPDATE the
-- row at all, an issue owner who is NOT the response author cannot currently
-- reach this trigger via a direct responses UPDATE. The supported flow marks a
-- solution on the ISSUES table (markIssueSolvedQuery -> issues.solved_response_id),
-- which is owner-governed and does not touch this column. This trigger is the
-- defensive backstop for any future code that writes responses.is_best_answer
-- directly: it guarantees only the issue owner can ever set it, even if an
-- UPDATE policy is later widened.
create or replace function public.guard_best_answer_owner_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  issue_owner uuid;
begin
  if new.is_best_answer is distinct from old.is_best_answer then
    select author_id into issue_owner
      from public.issues
     where id = new.issue_id;

    if issue_owner is null or issue_owner <> auth.uid() then
      raise exception
        'only the issue owner may change is_best_answer (issue %, actor %)',
        new.issue_id, auth.uid()
        using errcode = '42501';   -- insufficient_privilege
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_response_best_answer_owner_only on public.responses;
create trigger trg_response_best_answer_owner_only
  before update of is_best_answer on public.responses
  for each row execute function public.guard_best_answer_owner_only();

-- ─── VOTES ─────────────────────────────────────────────────────────────────────
-- Owner-only on every operation. Public tallies come from the denormalized
-- upvote_count columns (maintained by 0002 triggers), never from reading votes.
-- Duplicate prevention is enforced by the UNIQUE (user_id, issue_id) /
-- UNIQUE (user_id, response_id) constraints defined in 0001 and is not a policy
-- concern.
drop policy if exists votes_read_own on public.votes;
create policy votes_read_own on public.votes
  for select
  using (user_id = auth.uid());

drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes
  for insert
  with check (user_id = auth.uid());

drop policy if exists votes_delete_own on public.votes;
create policy votes_delete_own on public.votes
  for delete
  using (user_id = auth.uid());

-- ─── SAVED_ISSUES ────────────────────────────────────────────────────────────
-- Owner-only. The fetchSavedIssues join reads issues through this table; the
-- issues_read_visible policy still applies to the joined rows, so a saved issue
-- that later becomes flagged (and isn't owned by the reader) drops out of the
-- list. That is intended behavior.
drop policy if exists saved_read_own on public.saved_issues;
create policy saved_read_own on public.saved_issues
  for select
  using (user_id = auth.uid());

drop policy if exists saved_insert_own on public.saved_issues;
create policy saved_insert_own on public.saved_issues
  for insert
  with check (user_id = auth.uid());

drop policy if exists saved_delete_own on public.saved_issues;
create policy saved_delete_own on public.saved_issues
  for delete
  using (user_id = auth.uid());

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
-- Recipients may read their own notifications and update their own state
-- (mark-read). There is intentionally NO insert policy: notifications are meant
-- to be produced by server-side security-definer functions/triggers, which
-- bypass RLS. (As of this migration no such producer exists yet; the table is
-- inert until one is added. This is a known feature gap, not a security issue —
-- deny-by-default is the safe state.)
drop policy if exists notifs_read_own on public.notifications;
create policy notifs_read_own on public.notifications
  for select
  using (recipient_id = auth.uid());

drop policy if exists notifs_update_own on public.notifications;
create policy notifs_update_own on public.notifications
  for update
  using      (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ─── TRUST_EVENTS ────────────────────────────────────────────────────────────
-- Owner-only read. Inserts only from future security-definer functions; no
-- client write path exists, so no insert policy (deny-by-default).
drop policy if exists trust_read_own on public.trust_events;
create policy trust_read_own on public.trust_events
  for select
  using (user_id = auth.uid());
