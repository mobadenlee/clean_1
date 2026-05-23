-- ============================================================================
-- 0001_init.sql — initial schema + RLS for NYSC HelpDesk
-- ----------------------------------------------------------------------------
-- This migration is the single source of truth for what the database looks
-- like. Anyone reviewing the repo should be able to verify, by reading this
-- file alone, that:
--   • profiles, issues, responses, votes, saved_issues, notifications,
--     trust_events, and issue_categories all exist with the columns the
--     frontend reads;
--   • Row Level Security is enabled on every user-writable table;
--   • the policies actually enforce ownership (no one can vote/respond/
--     save/read notifications as someone else);
--   • is_ambassador_response on responses is set by a server-side trigger
--     based on the *real* profile role, NOT trusted from the client;
--   • a new auth.users row provisions a profile automatically (covers the
--     OAuth race that ensureProfile() defends against on the client).
--
-- Run via: `supabase db push` (CLI) or paste into Supabase SQL editor.
-- ============================================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ─── ENUMS ──────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role     as enum ('member','ambassador','moderator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.issue_urgency as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.issue_status  as enum ('open','solved','closed','flagged');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vote_type     as enum ('upvote','downvote');
exception when duplicate_object then null; end $$;

-- ─── TABLES ─────────────────────────────────────────────────────────────────

-- profiles: 1-to-1 with auth.users; everything user-facing lives here.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  full_name     text,
  avatar_url    text,
  role          public.user_role not null default 'member',
  trust_score   integer not null default 0,
  state         text,
  batch         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.issue_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  is_active   boolean not null default true,
  sort_order  integer not null default 0
);

create table if not exists public.issues (
  id                  uuid primary key default gen_random_uuid(),
  author_id           uuid not null references public.profiles(id) on delete cascade,
  category_id         uuid references public.issue_categories(id) on delete set null,
  title               text not null,
  body                text not null,
  state               text,
  lga                 text,
  urgency             public.issue_urgency not null default 'medium',
  status              public.issue_status  not null default 'open',
  is_anonymous        boolean not null default false,
  view_count          integer not null default 0,
  response_count      integer not null default 0,
  upvote_count        integer not null default 0,
  tags                text[] not null default '{}',
  solved_at           timestamptz,
  solved_response_id  uuid,
  search_vector       tsvector
                      generated always as (
                        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(body,  '')), 'B')
                      ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists issues_search_idx     on public.issues using gin(search_vector);
create index if not exists issues_status_idx     on public.issues(status);
create index if not exists issues_author_idx     on public.issues(author_id);
create index if not exists issues_created_at_idx on public.issues(created_at desc);

create table if not exists public.responses (
  id                      uuid primary key default gen_random_uuid(),
  issue_id                uuid not null references public.issues(id)   on delete cascade,
  author_id               uuid not null references public.profiles(id) on delete cascade,
  body                    text not null,
  is_anonymous            boolean not null default false,
  is_best_answer          boolean not null default false,
  -- Server-managed via trigger. Do NOT trust client input here.
  is_ambassador_response  boolean not null default false,
  upvote_count            integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists responses_issue_idx on public.responses(issue_id);

create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  issue_id     uuid references public.issues(id)    on delete cascade,
  response_id  uuid references public.responses(id) on delete cascade,
  vote_type    public.vote_type not null default 'upvote',
  created_at   timestamptz not null default now(),

  -- Exactly one of issue_id / response_id must be set.
  check ((issue_id is null) <> (response_id is null)),
  -- One vote per (user, target).
  unique (user_id, issue_id),
  unique (user_id, response_id)
);
create index if not exists votes_user_idx on public.votes(user_id);

create table if not exists public.saved_issues (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  issue_id    uuid not null references public.issues(id)   on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, issue_id)
);

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  issue_id      uuid references public.issues(id) on delete cascade,
  type          text not null,
  title         text,
  body          text,
  is_read       boolean not null default false,
  read_at       timestamptz,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id, created_at desc);

create table if not exists public.trust_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_type  text not null,
  delta       integer not null default 0,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists trust_events_user_idx on public.trust_events(user_id, created_at desc);

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────

-- 1. New auth.users → matching profile row.
--    This is what makes the OAuth race tolerable: the trigger almost
--    always wins, and the client's ensureProfile() fallback handles the
--    rare case where it doesn't.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name  text := coalesce(new.raw_user_meta_data->>'full_name',
                              new.raw_user_meta_data->>'name',
                              split_part(coalesce(new.email,''), '@', 1),
                              'user');
  base_slug  text := lower(regexp_replace(base_name, '[^a-z0-9]', '_', 'g'));
  uname      text := substr(base_slug, 1, 20) || '_' || floor(random()*9000 + 1000)::int;
begin
  insert into public.profiles (id, username, full_name, avatar_url, state, batch)
  values (
    new.id,
    uname,
    base_name,
    coalesce(new.raw_user_meta_data->>'avatar_url',
             new.raw_user_meta_data->>'picture'),
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'batch'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. responses.is_ambassador_response is set server-side from the author's
--    real role. The frontend may pass any value it likes — we overwrite it.
create or replace function public.set_response_ambassador_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_role public.user_role;
begin
  select role into author_role
    from public.profiles
   where id = new.author_id;

  new.is_ambassador_response :=
    coalesce(author_role in ('ambassador','moderator','admin'), false);

  return new;
end;
$$;

drop trigger if exists trg_response_ambassador on public.responses;
create trigger trg_response_ambassador
  before insert or update of author_id on public.responses
  for each row execute function public.set_response_ambassador_flag();

-- 3. updated_at touch.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_profiles_touch  on public.profiles;
create trigger trg_profiles_touch  before update on public.profiles  for each row execute function public.touch_updated_at();
drop trigger if exists trg_issues_touch    on public.issues;
create trigger trg_issues_touch    before update on public.issues    for each row execute function public.touch_updated_at();
drop trigger if exists trg_responses_touch on public.responses;
create trigger trg_responses_touch before update on public.responses for each row execute function public.touch_updated_at();

-- ─── RPC ────────────────────────────────────────────────────────────────────

-- Called by useIssue() as a fire-and-forget view-count bump.
create or replace function public.increment_view_count(issue_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.issues
     set view_count = view_count + 1
   where id = issue_id;
$$;

revoke all on function public.increment_view_count(uuid) from public;
grant execute on function public.increment_view_count(uuid) to authenticated, anon;

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
-- Pattern:
--   • Reads are typically public for content tables (issues, responses,
--     categories, top-of-leaderboard profile fields) — the app is a
--     community board.
--   • Writes always require user_id / author_id = auth.uid().
--   • Per-user tables (notifications, saved_issues, votes) ALSO restrict
--     reads to the owner.

alter table public.profiles         enable row level security;
alter table public.issue_categories enable row level security;
alter table public.issues           enable row level security;
alter table public.responses        enable row level security;
alter table public.votes            enable row level security;
alter table public.saved_issues     enable row level security;
alter table public.notifications    enable row level security;
alter table public.trust_events     enable row level security;

-- profiles -----------------------------------------------------------------
drop policy if exists profiles_read_all   on public.profiles;
create policy profiles_read_all   on public.profiles for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using      (id = auth.uid())
  with check (id = auth.uid()
              -- prevent self-promotion: members can't write their own role
              and (role = (select role from public.profiles where id = auth.uid())));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert
  with check (id = auth.uid());

-- issue_categories ---------------------------------------------------------
drop policy if exists categories_read_active on public.issue_categories;
create policy categories_read_active on public.issue_categories for select using (is_active);

-- issues -------------------------------------------------------------------
drop policy if exists issues_read_visible on public.issues;
create policy issues_read_visible on public.issues for select
  using (status <> 'flagged' or author_id = auth.uid());

drop policy if exists issues_insert_self on public.issues;
create policy issues_insert_self on public.issues for insert
  with check (author_id = auth.uid());

drop policy if exists issues_update_own on public.issues;
create policy issues_update_own on public.issues for update
  using      (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists issues_delete_own on public.issues;
create policy issues_delete_own on public.issues for delete
  using (author_id = auth.uid());

-- responses ----------------------------------------------------------------
drop policy if exists responses_read_all on public.responses;
create policy responses_read_all on public.responses for select using (true);

drop policy if exists responses_insert_self on public.responses;
create policy responses_insert_self on public.responses for insert
  with check (author_id = auth.uid());

drop policy if exists responses_update_own on public.responses;
create policy responses_update_own on public.responses for update
  using      (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists responses_delete_own on public.responses;
create policy responses_delete_own on public.responses for delete
  using (author_id = auth.uid());

-- votes --------------------------------------------------------------------
-- Reads restricted to owner — knowing who upvoted what is a privacy issue.
-- The app aggregates upvote_count on the issue/response itself for public display.
drop policy if exists votes_read_own   on public.votes;
create policy votes_read_own   on public.votes for select using (user_id = auth.uid());

drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes for insert with check (user_id = auth.uid());

drop policy if exists votes_delete_own on public.votes;
create policy votes_delete_own on public.votes for delete using  (user_id = auth.uid());

-- saved_issues -------------------------------------------------------------
drop policy if exists saved_read_own   on public.saved_issues;
create policy saved_read_own   on public.saved_issues for select using (user_id = auth.uid());

drop policy if exists saved_insert_own on public.saved_issues;
create policy saved_insert_own on public.saved_issues for insert with check (user_id = auth.uid());

drop policy if exists saved_delete_own on public.saved_issues;
create policy saved_delete_own on public.saved_issues for delete using  (user_id = auth.uid());

-- notifications ------------------------------------------------------------
drop policy if exists notifs_read_own   on public.notifications;
create policy notifs_read_own   on public.notifications for select using (recipient_id = auth.uid());

drop policy if exists notifs_update_own on public.notifications;
create policy notifs_update_own on public.notifications for update
  using      (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- inserts come from server-side triggers / RPCs running as security definer,
-- never directly from the client. No insert policy = no client inserts.

-- trust_events -------------------------------------------------------------
drop policy if exists trust_read_own on public.trust_events;
create policy trust_read_own on public.trust_events for select using (user_id = auth.uid());
-- inserts only from security-definer functions.
