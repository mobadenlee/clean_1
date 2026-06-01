-- ============================================================================
-- 0004_grants_and_post_init.sql
-- ----------------------------------------------------------------------------
-- Folds the previously by-hand and one-off SQL into a single, repo-tracked
-- migration so a fresh deploy reaches the same end state as production
-- without anyone needing to remember which scripts to paste in the SQL editor.
--
-- This migration is FORWARD-ONLY and IDEMPOTENT:
--   - Safe to run on the live database (no-op for things already there).
--   - Safe to run on a fresh DB after 0001/0002/0003.
--   - Safe to re-run (drop-if-exists, or-replace, on-conflict patterns).
--
-- Contents:
--   A. Role grants — closes the recurring permission landmine. Earlier
--      migrations omitted table grants entirely; missing grants caused
--      "permission denied for table issue_categories" and a missing
--      profiles INSERT that broke the ensureProfile fallback. Granting at
--      the role level does NOT bypass RLS; RLS still scopes WHICH rows each
--      role can see/touch.
--   B. issue_categories seed — the 12 categories the post-issue form needs.
--   C. Notification triggers — populate the notifications table on new
--      responses and new upvotes (security definer; clients have no INSERT
--      policy on notifications, so only triggers create rows).
--   D. Trust system — helper + 4 triggers + retroactive backfill, scoring
--      response posts (+1), issue upvotes (+5), response upvotes (+10),
--      best-answer marks (+20). Reversible upvote/best-answer events
--      subtract on the reverse action to prevent farming.
--
-- The frontend depends on the event_type strings used here. Specifically,
-- src/utils/trustCalculator.js (getTrustBreakdown), src/pages/dashboard/
-- DashboardHome.jsx, and src/pages/dashboard/ProfilePage.jsx filter on:
--   'response_posted', 'issue_upvoted', 'response_upvoted', 'best_answer_marked'
-- DO NOT rename these without updating both sides together.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION A — ROLE GRANTS
-- ════════════════════════════════════════════════════════════════════════════
-- RLS is the security model; grants just let operations reach the policies.
-- Granting SELECT to anon on a table with an RLS policy that says
-- "using (status <> 'flagged')" exposes only the visible rows, not the
-- whole table — so these grants are safe.

grant usage on schema public to anon, authenticated;

-- profiles: public read (for showing names on responses, etc.); the row's
-- own owner can INSERT (ensureProfile fallback) and UPDATE (edit profile).
-- INSERT was the specific grant missing earlier that we patched by hand.
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- issue_categories: public read of active rows (categories_read_active RLS).
-- No client write path exists, so no INSERT/UPDATE grant.
grant select on public.issue_categories to anon, authenticated;

-- issues / responses: public read except hidden-by-RLS; owners CRUD their own.
grant select on public.issues to anon, authenticated;
grant insert, update, delete on public.issues to authenticated;

grant select on public.responses to anon, authenticated;
grant insert, update, delete on public.responses to authenticated;

-- votes / saved_issues: strictly owner-scoped, no anon access at all.
grant select, insert, delete on public.votes to authenticated;
grant select, insert, delete on public.saved_issues to authenticated;

-- notifications: recipients read + mark-read; INSERT is deliberately NOT
-- granted to authenticated. Notification rows are created only by the
-- security-definer triggers in Section C.
grant select, update on public.notifications to authenticated;

-- trust_events: read-only for the owner (trust_read_own RLS). Rows are
-- inserted only by the security-definer triggers in Section D.
grant select on public.trust_events to authenticated;

-- Function execution. increment_view_count is already granted in 0001;
-- repeated here for completeness in case 0001 was edited.
grant execute on function public.increment_view_count(uuid) to authenticated, anon;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION B — ISSUE CATEGORIES SEED
-- ════════════════════════════════════════════════════════════════════════════
-- The category dropdown is empty until rows exist here. Slug is the stable
-- key; on-conflict-update keeps this safe to re-run and lets you tweak
-- names/order later without duplicating rows.

insert into public.issue_categories (slug, name, sort_order, is_active) values
  ('ppa-issues',        'PPA Issues',         1,  true),
  ('clearance',         'Clearance',          2,  true),
  ('cds',               'CDS',                3,  true),
  ('posting',           'Posting',            4,  true),
  ('payment-allowance', 'Payment/Allowance',  5,  true),
  ('biometrics',        'Biometrics',         6,  true),
  ('documentation',     'Documentation',      7,  true),
  ('lga-process',       'LGA Process',        8,  true),
  ('saed',              'SAED',               9,  true),
  ('accommodation',     'Accommodation',      10, true),
  ('general-admin',     'General Admin',      11, true),
  ('camp-issues',       'Camp Issues',        12, true)
on conflict (slug) do update
  set name       = excluded.name,
      sort_order = excluded.sort_order,
      is_active  = excluded.is_active;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION C — NOTIFICATION PRODUCERS
-- ════════════════════════════════════════════════════════════════════════════
-- Runs as security definer so they can INSERT into notifications despite
-- the table having no client INSERT policy.

-- C1. New response on an issue → notify the issue's author.
create or replace function public.notify_issue_author_on_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue_author uuid;
  v_issue_title  text;
  v_actor_name   text;
begin
  select author_id, title
    into v_issue_author, v_issue_title
    from public.issues
   where id = new.issue_id;

  -- Don't notify yourself for responding to your own issue.
  if v_issue_author is null or v_issue_author = new.author_id then
    return new;
  end if;

  -- Respect responder anonymity: anonymous responses don't reveal the actor.
  if new.is_anonymous then
    v_actor_name := 'Someone';
  else
    select coalesce(full_name, username, 'Someone')
      into v_actor_name
      from public.profiles
     where id = new.author_id;
  end if;

  insert into public.notifications (recipient_id, actor_id, issue_id, type, title, body)
  values (
    v_issue_author,
    case when new.is_anonymous then null else new.author_id end,
    new.issue_id,
    'response',
    'New response to your issue',
    v_actor_name || ' responded to "' || coalesce(v_issue_title, 'your issue') || '"'
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_response on public.responses;
create trigger trg_notify_response
  after insert on public.responses
  for each row execute function public.notify_issue_author_on_response();


-- C2. New vote → notify the content's author.
create or replace function public.notify_author_on_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_author uuid;
  v_issue_id      uuid;
  v_issue_title   text;
  v_actor_name    text;
begin
  if new.issue_id is not null then
    select author_id, id, title
      into v_target_author, v_issue_id, v_issue_title
      from public.issues
     where id = new.issue_id;
  elsif new.response_id is not null then
    select r.author_id, i.id, i.title
      into v_target_author, v_issue_id, v_issue_title
      from public.responses r
      join public.issues    i on i.id = r.issue_id
     where r.id = new.response_id;
  end if;

  -- Don't notify yourself for upvoting your own content.
  if v_target_author is null or v_target_author = new.user_id then
    return new;
  end if;

  select coalesce(full_name, username, 'Someone')
    into v_actor_name
    from public.profiles
   where id = new.user_id;

  insert into public.notifications (recipient_id, actor_id, issue_id, type, title, body)
  values (
    v_target_author,
    new.user_id,
    v_issue_id,
    'upvote',
    'Your post got an upvote',
    coalesce(v_actor_name, 'Someone') ||
      case when new.issue_id is not null
           then ' upvoted your issue'
           else ' upvoted your response'
      end ||
      case when v_issue_title is not null
           then ' on "' || v_issue_title || '"'
           else ''
      end
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_vote on public.votes;
create trigger trg_notify_vote
  after insert on public.votes
  for each row execute function public.notify_author_on_vote();


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION D — TRUST SYSTEM
-- ════════════════════════════════════════════════════════════════════════════
-- Helper that applies a score delta and writes the audit row in one place
-- so the score and audit log can't drift. Used by every trust trigger below.

create or replace function public.apply_trust_delta(
  p_user_id    uuid,
  p_event_type text,
  p_delta      integer,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_delta = 0 then
    return;
  end if;

  update public.profiles
     set trust_score = greatest(trust_score + p_delta, 0)
   where id = p_user_id;

  insert into public.trust_events (user_id, event_type, delta, reason)
  values (p_user_id, p_event_type, p_delta, p_reason);
end;
$$;


-- D1. Post a response (+1, not reversed on delete).
create or replace function public.trust_on_response_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.apply_trust_delta(
    new.author_id, 'response_posted', 1, 'Posted a response');
  return new;
end;
$$;

drop trigger if exists trg_trust_response_insert on public.responses;
create trigger trg_trust_response_insert
  after insert on public.responses
  for each row execute function public.trust_on_response_insert();


-- D2. Upvote on issue (+5) or response (+10). Self-action excluded.
create or replace function public.trust_on_vote_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_target_author uuid;
begin
  if new.vote_type <> 'upvote' then return new; end if;

  if new.issue_id is not null then
    select author_id into v_target_author from public.issues where id = new.issue_id;
    if v_target_author is null or v_target_author = new.user_id then return new; end if;
    perform public.apply_trust_delta(
      v_target_author, 'issue_upvoted', 5, 'Your issue received an upvote');

  elsif new.response_id is not null then
    select author_id into v_target_author from public.responses where id = new.response_id;
    if v_target_author is null or v_target_author = new.user_id then return new; end if;
    perform public.apply_trust_delta(
      v_target_author, 'response_upvoted', 10, 'Your response received an upvote');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_trust_vote_insert on public.votes;
create trigger trg_trust_vote_insert
  after insert on public.votes
  for each row execute function public.trust_on_vote_insert();


-- D3. Upvote removed → subtract points (prevents farming).
create or replace function public.trust_on_vote_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_target_author uuid;
begin
  if old.vote_type <> 'upvote' then return old; end if;

  if old.issue_id is not null then
    select author_id into v_target_author from public.issues where id = old.issue_id;
    if v_target_author is null or v_target_author = old.user_id then return old; end if;
    perform public.apply_trust_delta(
      v_target_author, 'issue_upvote_removed', -5, 'An upvote on your issue was removed');

  elsif old.response_id is not null then
    select author_id into v_target_author from public.responses where id = old.response_id;
    if v_target_author is null or v_target_author = old.user_id then return old; end if;
    perform public.apply_trust_delta(
      v_target_author, 'response_upvote_removed', -10, 'An upvote on your response was removed');
  end if;
  return old;
end;
$$;

drop trigger if exists trg_trust_vote_delete on public.votes;
create trigger trg_trust_vote_delete
  after delete on public.votes
  for each row execute function public.trust_on_vote_delete();


-- D4. Best-answer flag flipped (+20 on, -20 off).
create or replace function public.trust_on_best_answer_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_best_answer is not distinct from old.is_best_answer then
    return new;
  end if;

  if new.is_best_answer = true then
    perform public.apply_trust_delta(
      new.author_id, 'best_answer_marked', 20,
      'Your response was marked as the best answer');
  else
    perform public.apply_trust_delta(
      new.author_id, 'best_answer_unmarked', -20,
      'Your response was no longer the best answer');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_trust_best_answer on public.responses;
create trigger trg_trust_best_answer
  after update of is_best_answer on public.responses
  for each row execute function public.trust_on_best_answer_change();


-- ────────────────────────────────────────────────────────────────────────────
-- Trust backfill (idempotent: re-runs wipe previous backfill rows first).
-- Uses LIVE event_type strings so getTrustBreakdown buckets history correctly.
-- ────────────────────────────────────────────────────────────────────────────

begin;

delete from public.trust_events where reason like 'Backfill:%';

insert into public.trust_events (user_id, event_type, delta, reason)
select author_id, 'response_posted', 1, 'Backfill: posted a response'
  from public.responses;

insert into public.trust_events (user_id, event_type, delta, reason)
select i.author_id, 'issue_upvoted', 5,
       'Backfill: your issue received an upvote'
  from public.votes v
  join public.issues i on i.id = v.issue_id
 where v.vote_type = 'upvote'
   and v.issue_id is not null
   and i.author_id <> v.user_id;

insert into public.trust_events (user_id, event_type, delta, reason)
select r.author_id, 'response_upvoted', 10,
       'Backfill: your response received an upvote'
  from public.votes v
  join public.responses r on r.id = v.response_id
 where v.vote_type = 'upvote'
   and v.response_id is not null
   and r.author_id <> v.user_id;

insert into public.trust_events (user_id, event_type, delta, reason)
select author_id, 'best_answer_marked', 20,
       'Backfill: your response was marked best answer'
  from public.responses
 where is_best_answer = true;

-- Sync profiles.trust_score to the authoritative sum.
update public.profiles p
   set trust_score = coalesce(t.total, 0)
  from (
    select user_id, sum(delta)::int as total
      from public.trust_events
     group by user_id
  ) t
 where t.user_id = p.id;

update public.profiles
   set trust_score = 0
 where id not in (select distinct user_id from public.trust_events)
   and trust_score <> 0;

commit;

-- ============================================================================
-- End of 0004.
--
-- VERIFY:
--   select p.full_name, p.trust_score, count(t.id) as events
--     from public.profiles p
--     left join public.trust_events t on t.user_id = p.id
--    group by p.id
--    order by p.trust_score desc;
--
-- If you ever re-run this migration, the categories upsert and trust
-- backfill both clean up before re-applying — no duplicates, no doubled
-- scores. The grants are pure ADD operations; granting an already-granted
-- privilege is a no-op.
-- ============================================================================
