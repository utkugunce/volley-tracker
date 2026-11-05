-- Roles are revoked immediately through user_roles, independently of JWT metadata.
-- Never authorize from user_metadata (editable by the account holder).
begin;
create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role from public.user_roles where user_id = auth.uid()), 'viewer');
$$;
create or replace function public.user_has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.get_user_role() = required_role;
$$;
revoke all on function public.get_user_role() from public;
revoke all on function public.user_has_role(text) from public;
grant execute on function public.get_user_role() to anon, authenticated, service_role;
grant execute on function public.user_has_role(text) to anon, authenticated, service_role;
commit;
