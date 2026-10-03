# Kulüp / Antrenör Paneli — Kurulum ve İşleyiş

Kulüp yöneticileri ve antrenörler **e-posta giriş bağlantısı (magic link)** ile `/giris` sayfasından giriş yapar,
`/panel` altında kendi kulüpleri için kadro girişi, duyuru ve maç sonrası not yönetir.
Duyurular ve kadro, ilgili takım sayfasında (`/takim/<slug>`) gösterilir.

## Rol modeli

Mevcut `user_roles` (admin / editor / viewer) tablosuna **dokunulmaz**. Kulüp yetkileri `club_members` tablosundadır:

| Alan | Değerler |
| --- | --- |
| `member_role` | `manager` (kadro + duyuru + notlar), `coach` (kadro + notlar; duyuru yayınlayamaz) |
| `status` | `pending` → `approved` / `rejected`; `approved` → `revoked`; `rejected`/`revoked` → `approved` |
| `club_slug` | Takım sayfasının slug'ı (ör. `fenerbahce`) |

Akış: kullanıcı giriş yapar → `/panel` içinden kulüp seçip başvurur (`pending`) → **site yöneticisi**
(`/admin` → "Kulüp Hesapları" sekmesi) onaylar → panel açılır. Yönetici ayrıca e-posta ile doğrudan bağlayabilir.
Yönetici yetkisi mevcut akışla aynıdır: `ADMIN_TOKEN` **veya** Supabase `admin` rolü (Bearer ya da giriş çerezi).

## Tablolar (`supabase/migrations/006_club_panel.sql`)

`club_members`, `club_roster_entries`, `club_announcements`, `match_notes` — hepsinde RLS açıktır.
Yazma işlemleri sunucudan (service role) yapılır ve her route'ta yetki **sunucuda** kontrol edilir;
RLS ek savunma hattıdır. Maç notları varsayılan olarak yalnız kulüp içidir (`visibility = 'club'`).

## Sahibin yapması gerekenler

1. **Migration'ı uygulayın** (otomatik çalışmaz). İki yoldan biri:
   - Supabase Dashboard → SQL Editor → `supabase/migrations/006_club_panel.sql` içeriğini yapıştırıp çalıştırın, **veya**
   - `supabase link --project-ref <ref>` sonra `supabase db push` (önce `supabase db push --dry-run` ile bakın).
   Dosya idempotent'tir (tekrar çalıştırılabilir). Not: `003_rls_policies.sql` içindeki `user_has_role` fonksiyonu
   bu özelliğe bağlı değildir; 006 yalnızca kendi `is_club_member` / `is_club_manager` fonksiyonlarını kullanır.
2. **Supabase Auth ayarları** (Authentication → URL Configuration):
   - *Site URL*: `https://altyapivoleybol.com.tr`
   - *Redirect URLs* listesine ekleyin: `https://altyapivoleybol.com.tr/auth/callback`
     (önizleme için ayrıca `https://*-utkugunces-projects.vercel.app/auth/callback`).
   - Authentication → Providers → **Email** etkin olmalı (şifre gerekmez; "Confirm email" açık kalabilir).
3. **E-posta şablonu (önerilir)**: Authentication → Email Templates → *Magic Link* şablonundaki bağlantıyı şu hale getirin;
   böylece bağlantı, isteğin yapıldığı tarayıcıdan farklı bir tarayıcıda/telefonda da çalışır:
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/panel">Giriş yap</a>
   ```
   (Şablon değiştirilmezse varsayılan PKCE bağlantısı çalışır ama aynı tarayıcıda açılmalıdır.)
4. **Vercel ortam değişkenleri** (zaten tanımlı olmalı; yeni değişken eklenmedi):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN`.
   Service role anahtarı yalnızca sunucuda kullanılır; istemciye gönderilmez.
5. Giriş yapıp ilk kez `/panel` açıldıktan sonra `/admin` → **Kulüp Hesapları** sekmesinden başvuruyu onaylayın.
6. (İsteğe bağlı) Supabase → Authentication → Rate Limits bölümünden e-posta gönderim sınırını kontrol edin
   (varsayılan SMTP saatte az sayıda e-postaya izin verir; üretimde özel SMTP önerilir).

## Kurulum eksikse davranış

- Supabase ortam değişkenleri yoksa: `/panel` ve `/giris` "Kulüp paneli yakında / kurulum gerekli" kartı gösterir.
- Ortam var ama migration uygulanmamışsa: API'ler `503 { code: "setup_required" }` döner, panel aynı kartı gösterir.
- Takım sayfalarındaki kulüp bölümü, bu durumlarda hiçbir şey çizmez; sitenin geri kalanı etkilenmez.
- Mevcut `/admin` ve `ADMIN_TOKEN` akışı değişmedi.

## Güvenlik özeti

- Her yazma route'unda: JSON içerik türü + aynı kaynak (CSRF) → oturum (`supabase.auth.getUser`, sahte çerez geçmez) →
  onaylı üyelik ve rol izni → girdi doğrulama/uzunluk sınırı → kullanıcı başına hız sınırı.
- Güncelle/sil işlemlerinde kulüp bilgisi istemciden değil, veritabanındaki satırdan alınır.
- Magic link isteği IP ve e-posta başına hız sınırlıdır; yanıt hesap varlığını sızdırmaz.
- `/auth/callback` yalnızca site içi `next` yollarına yönlendirir (açık yönlendirme yok).
- Service worker `/panel`, `/giris`, `/auth` yollarını önbelleğe almaz.
- Hız sınırları bellek içidir (sunucu örneği başına); mevcut `RateLimiter` ile aynıdır.
