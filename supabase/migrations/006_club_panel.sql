-- 006_club_panel.sql
-- Kulüp / antrenör paneli (özellik 8).
--
-- ÖNEMLİ: Bu dosya otomatik ÇALIŞTIRILMAZ. Üretim veritabanına elle uygulanır
-- (bkz. docs/club-panel.md). Dosya tekrar çalıştırılabilir (idempotent) yazıldı.
--
-- Tasarım:
--  * Panel yazma işlemleri sunucudan (service role) gelir; yetki kontrolü API
--    katmanında yapılır. RLS politikaları ek bir savunma hattıdır: anon/authenticated
--    anahtarla doğrudan erişimde de aynı kurallar geçerli olur.
--  * Kulüp kimliği `club_slug` = takım sayfasının slug'ıdır (ör. "fenerbahce").
--  * Rol modeli mevcut `user_roles` (admin/editor/viewer) tablosuna DOKUNMAZ.
--    Kulüp rolleri `club_members.member_role` içindedir: 'manager' | 'coach'.
--    Yönetici onayı `status` alanıyla yapılır: pending -> approved | rejected | revoked.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- club_members: kullanıcı <-> kulüp bağlantısı ve onay durumu
-- ---------------------------------------------------------------------------
create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  club_slug text not null check (club_slug ~ '^[a-z0-9][a-z0-9-]{1,119}$'),
  member_role text not null default 'coach' check (member_role in ('manager', 'coach')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked')),
  note text check (note is null or char_length(note) <= 500),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  unique (user_id, club_slug)
);

create index if not exists club_members_user_idx on public.club_members (user_id);
create index if not exists club_members_club_idx on public.club_members (club_slug, status);

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar (RLS içinde kullanılır)
-- ---------------------------------------------------------------------------
create or replace function public.is_club_member(p_club_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where user_id = auth.uid()
      and club_slug = p_club_slug
      and status = 'approved'
  );
$$;

create or replace function public.is_club_manager(p_club_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where user_id = auth.uid()
      and club_slug = p_club_slug
      and status = 'approved'
      and member_role = 'manager'
  );
$$;

-- ---------------------------------------------------------------------------
-- club_roster_entries: kulübün kendi girdiği kadro satırları
-- ---------------------------------------------------------------------------
create table if not exists public.club_roster_entries (
  id uuid primary key default gen_random_uuid(),
  club_slug text not null check (club_slug ~ '^[a-z0-9][a-z0-9-]{1,119}$'),
  name text not null check (char_length(name) between 2 and 80),
  shirt_number smallint check (shirt_number is null or shirt_number between 0 and 99),
  position text check (position is null or char_length(position) <= 40),
  height_cm smallint check (height_cm is null or height_cm between 100 and 250),
  birth_year smallint check (birth_year is null or birth_year between 1950 and 2030),
  is_staff boolean not null default false,
  is_visible boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_roster_entries_club_idx on public.club_roster_entries (club_slug);

-- ---------------------------------------------------------------------------
-- club_announcements: takım sayfasında gösterilen duyurular
-- ---------------------------------------------------------------------------
create table if not exists public.club_announcements (
  id uuid primary key default gen_random_uuid(),
  club_slug text not null check (club_slug ~ '^[a-z0-9][a-z0-9-]{1,119}$'),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  pinned boolean not null default false,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_announcements_club_idx on public.club_announcements (club_slug, created_at desc);

-- ---------------------------------------------------------------------------
-- match_notes: maç sonrası notlar (varsayılan: yalnız kulüp içi)
-- ---------------------------------------------------------------------------
create table if not exists public.match_notes (
  id uuid primary key default gen_random_uuid(),
  club_slug text not null check (club_slug ~ '^[a-z0-9][a-z0-9-]{1,119}$'),
  match_ref text check (match_ref is null or char_length(match_ref) <= 100),
  opponent text check (opponent is null or char_length(opponent) <= 120),
  match_date date,
  body text not null check (char_length(body) between 1 and 4000),
  visibility text not null default 'club' check (visibility in ('club', 'public')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists match_notes_club_idx on public.match_notes (club_slug, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.club_members enable row level security;
alter table public.club_roster_entries enable row level security;
alter table public.club_announcements enable row level security;
alter table public.match_notes enable row level security;

-- club_members: kullanıcı yalnız kendi satırlarını görür. Başvuru/onay/rol atama
-- sunucudan (service role) yapılır; istemci anahtarıyla yazma yoktur.
drop policy if exists club_members_select_own on public.club_members;
create policy club_members_select_own on public.club_members
  for select to authenticated
  using (user_id = auth.uid());

-- club_roster_entries: görünür satırlar herkese açık; üyeler kendi kulübünü yönetir.
drop policy if exists club_roster_public_read on public.club_roster_entries;
create policy club_roster_public_read on public.club_roster_entries
  for select to anon, authenticated
  using (is_visible = true);

drop policy if exists club_roster_member_read on public.club_roster_entries;
create policy club_roster_member_read on public.club_roster_entries
  for select to authenticated
  using (public.is_club_member(club_slug));

drop policy if exists club_roster_member_write on public.club_roster_entries;
create policy club_roster_member_write on public.club_roster_entries
  for all to authenticated
  using (public.is_club_member(club_slug))
  with check (public.is_club_member(club_slug));

-- club_announcements: süresi dolmamış duyurular herkese açık; yalnız manager yazar.
drop policy if exists club_announcements_public_read on public.club_announcements;
create policy club_announcements_public_read on public.club_announcements
  for select to anon, authenticated
  using (expires_at is null or expires_at > now());

drop policy if exists club_announcements_member_read on public.club_announcements;
create policy club_announcements_member_read on public.club_announcements
  for select to authenticated
  using (public.is_club_member(club_slug));

drop policy if exists club_announcements_manager_write on public.club_announcements;
create policy club_announcements_manager_write on public.club_announcements
  for all to authenticated
  using (public.is_club_manager(club_slug))
  with check (public.is_club_manager(club_slug));

-- match_notes: varsayılan 'club' -> yalnız onaylı üyeler okur/yazar.
-- 'public' işaretli notlar herkese açık okunur.
drop policy if exists match_notes_public_read on public.match_notes;
create policy match_notes_public_read on public.match_notes
  for select to anon, authenticated
  using (visibility = 'public');

drop policy if exists match_notes_member_all on public.match_notes;
create policy match_notes_member_all on public.match_notes
  for all to authenticated
  using (public.is_club_member(club_slug))
  with check (public.is_club_member(club_slug));

-- Fonksiyonlar yalnız giriş yapmış kullanıcıya açık
revoke all on function public.is_club_member(text) from public;
revoke all on function public.is_club_manager(text) from public;
grant execute on function public.is_club_member(text) to authenticated;
grant execute on function public.is_club_manager(text) to authenticated;
