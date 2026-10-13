-- ==============================================================================
-- 007_role_grants_and_permissions.sql
-- Supabase Rol İzinleri ve Açık GRANT Tanımları (Görev 8)
--
-- Supabase Data API (PostgREST) standartları gereği RLS tek başına yetmez;
-- 'anon', 'authenticated' ve 'service_role' veritabanı rollerine açık
-- GRANT tanımları yapılmalıdır.
-- ==============================================================================

-- 1. Şema Kullanım İzni
grant usage on schema public to anon, authenticated, service_role;

-- 2. service_role (Admin / API Route Service Client) İçin Tam Yetki
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- 3. Genel Okuma İzinleri (Tüm Tablolar İçin RLS Kontrollü SELECT)
grant select on all tables in schema public to anon, authenticated;

-- 4. Belirli İstemci / Kullanıcı Yazma İzinleri (RLS Politikalarına Tabi)
-- Ziyaretçiler ve kullanıcılar push bildirimlerine abone olabilir veya aboneliklerini silebilir:
grant insert, update, delete on table public.push_subscriptions to anon, authenticated;

-- Giriş yapmış kullanıcılar denetim günlüklerine ve kulüp doğrulama kayıtlarına yazabilir (RLS ile sınırlandırılmıştır):
grant insert on table public.override_audit_log to authenticated;
grant insert, update on table public.club_match_verifications to authenticated;
grant insert on table public.club_audit_logs to authenticated;

-- 5. Gelecekte Oluşturulacak Tablolar İçin Varsayılan Ayrıcalıklar (Default Privileges)
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;
