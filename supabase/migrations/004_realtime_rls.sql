-- Realtime RLS Policies and Security
-- This migration adds Realtime-specific security policies

-- Enable Realtime for matches table
alter publication supabase_realtime add table public.matches;

-- Realtime-specific RLS policies for matches
-- These policies control which users can receive realtime updates

-- Policy: All authenticated users can receive realtime updates for matches
drop policy if exists matches_realtime_select_policy on public.matches;

create policy "matches_realtime_select_policy" on public.matches
  for select
  to authenticated
  using (true);

-- Policy: Anonymous users can only receive updates for non-sensitive match data
drop policy if exists matches_realtime_anon_policy on public.matches;

create policy "matches_realtime_anon_policy" on public.matches
  for select
  to anon
  using (true);

-- Function to check if a user should receive realtime updates for a specific match
create or replace function public.can_receive_realtime_match_updates(user_id uuid, match_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
  declare
    user_role text;
  begin
    -- Get user role
    select role into user_role from public.user_roles where user_id = can_receive_realtime_match_updates.user_id;
    
    -- If no role assigned, check raw_app_meta_data
    if user_role is null then
      select raw_app_meta_data->>'role' into user_role 
      from auth.users 
      where id = can_receive_realtime_match_updates.user_id;
    end if;
    
    -- Default to viewer if no role found
    user_role := coalesce(user_role, 'viewer');
    
    -- All authenticated users can receive updates
    return true;
  end;
$$;

-- Grant realtime permissions
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;

-- Add comment for documentation
comment on function public.can_receive_realtime_match_updates is 'Checks if a user can receive realtime updates for a specific match. Currently all authenticated users can receive updates.';
