-- RLS Policies for Role-Based Access Control
-- Roles: admin, editor, viewer

-- Helper function to check user role
create or replace function public.user_has_role(required_role text)
returns boolean as $$
  begin
    -- Check app_metadata first (for admin)
    if required_role = 'admin' and auth.jwt() ->> 'role' = 'admin' then
      return true;
    end if;
    
    -- Check user_roles table
    exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = required_role
    );
  end;
$$ language plpgsql security definer;

-- Function to get current user's role
create or replace function public.get_user_role()
returns text as $$
  declare
    user_role text;
  begin
    -- Check app_metadata first
    user_role := auth.jwt() ->> 'role';
    if user_role in ('admin', 'editor', 'viewer') then
      return user_role;
    end if;
    
    -- Check user_roles table
    select role into user_role from public.user_roles 
    where user_id = auth.uid();
    
    return coalesce(user_role, 'viewer');
  end;
$$ language plpgsql security definer;

-- MATCHES table policies
drop policy if exists matches_select_policy on public.matches;
drop policy if exists matches_insert_policy on public.matches;
drop policy if exists matches_update_policy on public.matches;
drop policy if exists matches_delete_policy on public.matches;

create policy "matches_select_policy" on public.matches
  for select
  to authenticated
  using (true);

create policy "matches_insert_policy" on public.matches
  for insert
  to authenticated
  with check (public.get_user_role() in ('admin', 'editor'));

create policy "matches_update_policy" on public.matches
  for update
  to authenticated
  using (public.get_user_role() in ('admin', 'editor'))
  with check (public.get_user_role() in ('admin', 'editor'));

create policy "matches_delete_policy" on public.matches
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- STANDINGS table policies
drop policy if exists standings_select_policy on public.standings;
drop policy if exists standings_insert_policy on public.standings;
drop policy if exists standings_update_policy on public.standings;
drop policy if exists standings_delete_policy on public.standings;

create policy "standings_select_policy" on public.standings
  for select
  to authenticated
  using (true);

create policy "standings_insert_policy" on public.standings
  for insert
  to authenticated
  with check (public.get_user_role() in ('admin', 'editor'));

create policy "standings_update_policy" on public.standings
  for update
  to authenticated
  using (public.get_user_role() in ('admin', 'editor'))
  with check (public.get_user_role() in ('admin', 'editor'));

create policy "standings_delete_policy" on public.standings
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- SYNC_RUNS table policies
drop policy if exists sync_runs_select_policy on public.sync_runs;
drop policy if exists sync_runs_insert_policy on public.sync_runs;
drop policy if exists sync_runs_update_policy on public.sync_runs;
drop policy if exists sync_runs_delete_policy on public.sync_runs;

create policy "sync_runs_select_policy" on public.sync_runs
  for select
  to authenticated
  using (true);

create policy "sync_runs_insert_policy" on public.sync_runs
  for insert
  to authenticated
  with check (public.get_user_role() = 'admin');

create policy "sync_runs_update_policy" on public.sync_runs
  for update
  to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "sync_runs_delete_policy" on public.sync_runs
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- MANUAL_OVERRIDES table policies
drop policy if exists manual_overrides_select_policy on public.manual_overrides;
drop policy if exists manual_overrides_insert_policy on public.manual_overrides;
drop policy if exists manual_overrides_update_policy on public.manual_overrides;
drop policy if exists manual_overrides_delete_policy on public.manual_overrides;

create policy "manual_overrides_select_policy" on public.manual_overrides
  for select
  to authenticated
  using (true);

create policy "manual_overrides_insert_policy" on public.manual_overrides
  for insert
  to authenticated
  with check (public.get_user_role() in ('admin', 'editor'));

create policy "manual_overrides_update_policy" on public.manual_overrides
  for update
  to authenticated
  using (public.get_user_role() in ('admin', 'editor'))
  with check (public.get_user_role() in ('admin', 'editor'));

create policy "manual_overrides_delete_policy" on public.manual_overrides
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- OVERRIDE_AUDIT_LOG table policies
drop policy if exists override_audit_log_select_policy on public.override_audit_log;
drop policy if exists override_audit_log_insert_policy on public.override_audit_log;
drop policy if exists override_audit_log_update_policy on public.override_audit_log;
drop policy if exists override_audit_log_delete_policy on public.override_audit_log;

create policy "override_audit_log_select_policy" on public.override_audit_log
  for select
  to authenticated
  using (true);

create policy "override_audit_log_insert_policy" on public.override_audit_log
  for insert
  to authenticated
  with check (public.get_user_role() in ('admin', 'editor'));

-- Audit logs should not be updated or deleted (immutable)
create policy "override_audit_log_update_policy" on public.override_audit_log
  for update
  to authenticated
  using (false);

create policy "override_audit_log_delete_policy" on public.override_audit_log
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- PUSH_SUBSCRIPTIONS table policies
-- Users can only manage their own subscriptions
drop policy if exists push_subscriptions_select_policy on public.push_subscriptions;
drop policy if exists push_subscriptions_insert_policy on public.push_subscriptions;
drop policy if exists push_subscriptions_update_policy on public.push_subscriptions;
drop policy if exists push_subscriptions_delete_policy on public.push_subscriptions;

-- For anonymous users (no auth), no access
create policy "push_subscriptions_select_policy" on public.push_subscriptions
  for select
  to authenticated
  using (false);

create policy "push_subscriptions_insert_policy" on public.push_subscriptions
  for insert
  to authenticated
  with check (false);

create policy "push_subscriptions_update_policy" on public.push_subscriptions
  for update
  to authenticated
  using (false);

create policy "push_subscriptions_delete_policy" on public.push_subscriptions
  for delete
  to authenticated
  using (false);

-- USER_ROLES table policies
-- Only admins can manage user roles
drop policy if exists user_roles_select_policy on public.user_roles;
drop policy if exists user_roles_insert_policy on public.user_roles;
drop policy if exists user_roles_update_policy on public.user_roles;
drop policy if exists user_roles_delete_policy on public.user_roles;

create policy "user_roles_select_policy" on public.user_roles
  for select
  to authenticated
  using (public.get_user_role() = 'admin');

create policy "user_roles_insert_policy" on public.user_roles
  for insert
  to authenticated
  with check (public.get_user_role() = 'admin');

create policy "user_roles_update_policy" on public.user_roles
  for update
  to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "user_roles_delete_policy" on public.user_roles
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- Grant service role bypass for all operations
-- This allows backend scripts with service role key to bypass RLS
grant all on all tables in public to service_role;
grant all on all sequences in public to service_role;
grant all on all functions in public to service_role;
