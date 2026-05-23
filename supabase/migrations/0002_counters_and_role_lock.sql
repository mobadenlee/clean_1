-- ============================================================================
-- 0002_counters_and_role_lock.sql
-- ----------------------------------------------------------------------------
-- Two fixes on top of 0001:
--
--   #2  Maintain denormalized counters that 0001 declared but never updated:
--         • issues.response_count   — # of responses on the issue
--         • issues.upvote_count     — # of votes whose target is the issue
--         • responses.upvote_count  — # of votes whose target is the response
--       The feed sorts and the cards display these, so without maintenance
--       every issue showed 0 forever. Maintained via AFTER INSERT/DELETE
--       triggers. A backfill at the end reconciles any rows that already
--       exist.
--
--   #3  Make profiles.role immutable from the client. 0001 tried to enforce
--       this inside the profiles_update_own RLS policy with a self-referential
--       subquery (select role from profiles where id = auth.uid()), which is
--       fragile under RLS. We replace that approach with a BEFORE UPDATE
--       trigger that pins role to its previous value, and drop the subquery
--       from the policy.
--
-- Forward-only. Safe to run after 0001 on an existing database.
-- ============================================================================

-- ─── #2 COUNTER MAINTENANCE ─────────────────────────────────────────────────

-- Responses → issues.response_count
create or replace function public.bump_issue_response_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.issues
       set response_count = response_count + 1
     where id = new.issue_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.issues
       set response_count = greatest(response_count - 1, 0)
     where id = old.issue_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_response_count_ins on public.responses;
create trigger trg_response_count_ins
  after insert on public.responses
  for each row execute function public.bump_issue_response_count();

drop trigger if exists trg_response_count_del on public.responses;
create trigger trg_response_count_del
  after delete on public.responses
  for each row execute function public.bump_issue_response_count();

-- Votes → issues.upvote_count / responses.upvote_count
-- A vote targets EXACTLY one of issue_id / response_id (enforced by the
-- check constraint in 0001), so we branch on which one is set.
create or replace function public.bump_vote_upvote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.issue_id is not null then
      update public.issues
         set upvote_count = upvote_count + 1
       where id = new.issue_id;
    elsif new.response_id is not null then
      update public.responses
         set upvote_count = upvote_count + 1
       where id = new.response_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.issue_id is not null then
      update public.issues
         set upvote_count = greatest(upvote_count - 1, 0)
       where id = old.issue_id;
    elsif old.response_id is not null then
      update public.responses
         set upvote_count = greatest(upvote_count - 1, 0)
       where id = old.response_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_vote_count_ins on public.votes;
create trigger trg_vote_count_ins
  after insert on public.votes
  for each row execute function public.bump_vote_upvote_count();

drop trigger if exists trg_vote_count_del on public.votes;
create trigger trg_vote_count_del
  after delete on public.votes
  for each row execute function public.bump_vote_upvote_count();

-- Backfill / reconcile existing rows so counters match reality right now.
update public.issues i
   set response_count = coalesce(r.cnt, 0)
  from (
    select issue_id, count(*) as cnt
      from public.responses
     group by issue_id
  ) r
 where r.issue_id = i.id;
update public.issues set response_count = 0
 where id not in (select distinct issue_id from public.responses);

update public.issues i
   set upvote_count = coalesce(v.cnt, 0)
  from (
    select issue_id, count(*) as cnt
      from public.votes
     where issue_id is not null
     group by issue_id
  ) v
 where v.issue_id = i.id;
update public.issues set upvote_count = 0
 where id not in (select distinct issue_id from public.votes where issue_id is not null);

update public.responses rp
   set upvote_count = coalesce(v.cnt, 0)
  from (
    select response_id, count(*) as cnt
      from public.votes
     where response_id is not null
     group by response_id
  ) v
 where v.response_id = rp.id;
update public.responses set upvote_count = 0
 where id not in (select distinct response_id from public.votes where response_id is not null);

-- ─── #3 ROLE IMMUTABILITY ───────────────────────────────────────────────────

-- Pin role to its previous value on any update. Role changes are an
-- admin-only operation done out-of-band (direct SQL or a future admin tool
-- using the service-role key, which bypasses this trigger). Pinning rather
-- than raising keeps ordinary profile edits (full_name, avatar, etc.) working
-- even if a client naively echoes the role field back in its update payload.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_no_role_change on public.profiles;
create trigger trg_profiles_no_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- Replace the fragile self-referential policy from 0001 with a clean one.
-- The role-immutability guarantee now lives entirely in the trigger above.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using      (id = auth.uid())
  with check (id = auth.uid());
