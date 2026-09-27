create extension if not exists pgcrypto;

create table if not exists public.matches (
  id text primary key,
  city_slug text not null,
  city_name text,
  match_date date,
  match_time text,
  hall text,
  category text,
  age_group text,
  gender text,
  group_name text,
  match_no text,
  home_team text not null,
  away_team text not null,
  score text,
  home_score integer,
  away_score integer,
  set_scores jsonb not null default '[]'::jsonb,
  status text not null default 'upcoming' check (status in ('upcoming', 'finished', 'postponed', 'live')),
  volleybox jsonb,
  raw jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_city_date_idx on public.matches (city_slug, match_date);
create index if not exists matches_status_date_idx on public.matches (status, match_date);

create table if not exists public.standings (
  city_slug text not null,
  category text not null,
  rows jsonb not null default '[]'::jsonb,
  source_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (city_slug, category)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('queued', 'running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  cities_scanned integer not null default 0,
  matches_imported integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists sync_runs_started_idx on public.sync_runs (started_at desc);

create table if not exists public.manual_overrides (
  match_id text primary key references public.matches(id) on delete cascade,
  home_score integer,
  away_score integer,
  set_scores jsonb not null default '[]'::jsonb,
  status text check (status is null or status in ('upcoming', 'finished', 'postponed', 'live')),
  updated_at timestamptz not null default now(),
  updated_by text not null,
  reason text not null
);

create table if not exists public.override_audit_log (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  action text not null check (action in ('create', 'update', 'delete')),
  timestamp timestamptz not null default now(),
  updated_by text not null,
  reason text not null,
  old_value jsonb,
  new_value jsonb
);

create index if not exists override_audit_match_idx on public.override_audit_log (match_id, timestamp desc);

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  expiration_time bigint,
  favorite_teams jsonb not null default '[]'::jsonb,
  favorite_matches jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;
alter table public.standings enable row level security;
alter table public.sync_runs enable row level security;
alter table public.manual_overrides enable row level security;
alter table public.override_audit_log enable row level security;
alter table public.push_subscriptions enable row level security;

comment on table public.matches is 'Normalized TVF matches imported by the scraper.';
comment on table public.sync_runs is 'Durable scraper execution history and metrics.';
comment on table public.push_subscriptions is 'Private web push subscriptions; access through the server service role only.';