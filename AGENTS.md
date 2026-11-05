# Antigravity & AI Agent Kuralları

## � Supabase Auth ve Rol Sistemi

> **UYGULAMA PRENSİBİ:**
> Projede Supabase Auth tabanlı kullanıcı yönetimi ve rol sistemi kullanılmaktadır. Admin, Editor ve Viewer rolleri ile farklı yetki seviyeleri bulunmaktadır.

### 📋 Mevcut Durum
- ✅ Supabase RLS politikaları uygulanmış (matches, standings, sync_runs, manual_overrides, override_audit_log, push_subscriptions, user_roles)
- ✅ Kullanıcı yönetimi API endpoint'leri (GET /api/admin/users, POST /api/admin/users, PATCH /api/admin/users/[userId], DELETE /api/admin/users/[userId])
- ✅ Admin panelinde kullanıcı yönetimi UI bileşeni (kullanıcı listesi, rol atama, kullanıcı silme)
- ✅ İlk admin kullanıcısını oluşturma scripti (npm run create-admin)
- ✅ Auth client-side helper ve session yönetimi (supabaseClient.ts, authHelpers.ts, useAuthSession.ts, AuthContext.tsx)

### 🔑 Rol Yetkileri
- **Admin**: Tüm tablolarda tam yetki (SELECT, INSERT, UPDATE, DELETE), kullanıcı yönetimi
- **Editor**: matches, standings, manual_overrides tablolarında SELECT, INSERT, UPDATE
- **Viewer**: Tüm tablolarda sadece SELECT

### 🚀 İlk Admin Kullanıcısını Oluşturma
```bash
npm run create-admin -- --email admin@example.com --password securepassword
```

### 📝 Auth Context Kullanımı
```tsx
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Provider'ı app.tsx veya layout.tsx'e ekleyin
<AuthProvider>
  <YourApp />
</AuthProvider>

// Component içinde kullanın
const { user, role, loading, signIn, signOut } = useAuth();
```

### 🔒 API Endpoint'lerinde Auth Kontrolü
```typescript
import { getAuthenticatedUser } from "@/utils/supabaseAuth";

const authenticatedUser = await getAuthenticatedUser(request);
if (!authenticatedUser || authenticatedUser.role !== "admin") {
  return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
}
```

## Geliştirme, veri güncelleme ve yayınlama

- Mevcut izole checkout'u kullan; kullanıcı istemedikçe worktree oluşturma.
- Kod değişikliklerinde typecheck, lint, Vitest, Python testleri, şehir listesi ve veri doğrulama kontrollerini çalıştır. Arayüz değişikliklerinde üretim derlemesi ve tarayıcı kontrollerini de çalıştır.
- Canlı veri güncellemesini kod doğrulamasından ayrı tut. Scraper yalnızca saatlik workflow veya açık veri güncelleme talebiyle çalıştırılır.
- 81 il taramaları arasında minimum 60 dakika korunur. Kullanıcı açıkça beklemeyi kaldırmadıkça `--force` kullanma; API tetiklemeleri de cooldown'a uyar.
- Profesyonel ligler bağımsız `pro-volley` projesindedir. Bu repo resmi kulüp altyapı ligleriyle sınırlıdır.
- Değişiklikleri özellik dalında commit et; PR ve başarılı CI üzerinden birleştir. Doğrudan `main`'e push etme. GitHub dal koruması ayrıca yönetici ayarı gerektirir.

## 🏙️ KURAL: Şehir Allowlist'i (`src/utils/citySlugs.ts`)

> **UYGULAMA PRENSİBİ:** `src/utils/citySlugs.ts` **elle düzenlenmez**; `data/cities.json` ve `src/app` rota yapısından üretilir.

- `src/proxy.ts` (middleware) geçersiz/gizli il adreslerini **gerçek HTTP 404** ile döndürür. Sayfa içindeki `notFound()` bunu yapamaz: `src/app/loading.tsx` Suspense kabuğunu 200 ile flush ettiği için status sonradan değiştirilemiyor (soft 404).
- `proxy.ts` edge runtime'da çalıştığı için `fs` kullanamaz; il listesi bu yüzden statik bir modüle derlenir.
- `data/cities.json`'a il eklenip/çıkarıldığında veya `src/app` altına **kökünde `page.tsx` olan** yeni bir rota dizini eklendiğinde:
  ```bash
  python scripts/generate_city_slugs.py
  ```
  ve üretilen dosya **aynı commit'te** gönderilmelidir. CI bunu `--check` ile doğrular:
  ```bash
  python scripts/generate_city_slugs.py --check   # bayatsa exit 1
  ```
- Gizli iller (`src/utils/hiddenCities.ts`) allowlist'e bilinçli olarak alınmaz → `/nigde`, `/usak`, `/kirikkale` 404 döner. İki liste arasındaki senkronu `src/utils/__tests__/citySlugs.test.ts` korur.
- Kökünde yalnızca `[slug]/` bulunan dizinler (`takim`, `lig`, `api`, `auth`) statik rota **sayılmaz**; `/takim` gibi adresler şehir slug'ı gibi doğrulanır ve 404 alır.

## 🏷️ KURAL: `<title>` içinde marka eki tek kez

`src/app/layout.tsx` şu şablonu uygular: `title.template = "%s | Altyapı Voleybol"`.
Bu yüzden sayfa metadata'larındaki **doküman başlığı** marka ekini İÇERMEMELİ:

```ts
// ❌ yanlış -> "İstanbul ... — Altyapı Voleybol | Altyapı Voleybol"
const title = `${cityName} Voleybol Fikstürü — Altyapı Voleybol`;
// ✅ doğru
const title = `${cityName} Voleybol Fikstürü`;
// ✅ şablon uygulanmasın isteniyorsa
title: { absolute: "Altyapı Voleybol — TVF Fikstür ve Puan Durumu" }
```

`openGraph.title` ve `twitter.title` bu şablondan **etkilenmez**; orada marka eki serbesttir.
Kuralı `src/__tests__/metadata-brand.test.ts` tüm `page.tsx` dosyalarını tarayarak zorlar.

## 🚫 KURAL: Resmi Olmayan Turnuvaları Filtreleme (Okul Sporları, Kamu Sporları, Kurumlar Arası)

> **UYGULAMA PRENSİBİ:**
> Sitede **yalnızca TVF resmi kulüp altyapı ligleri** (Genç Kızlar Süper Lig/1. Lig, Yıldız Kızlar Süper Lig) yer alır.
> Aşağıdaki kategoriler ve turnuvalar kesinlikle taranmaz, sitede gösterilmez ve her aşamada (scraper ve filtreler) filtrelenir:
> - **Okul Sporları:** İsminde, liginde veya grubunda `"okul sporları"`, `"okul spor"`, `"okul"` geçen turnuva ve karşılaşmalar kesinlikle siteye eklenmez (Örn: Denizli, Malatya okul sporları).
> - **Kamu Sporları:** İsminde, liginde veya grubunda `"kamu sporları"`, `"kamu spor"`, `"kamu"` geçen turnuvalar siteye eklenmez (Örn: Erzurum, Niğde).
> - **Kurumlar Arası / Şirket / Özel Turnuvalar:** `"kurumlar arası"`, `"kurum"`, `"şirket"`, `"veteran"`, `"cumhuriyet kupası"` gibi altyapı kulüp ligi olmayan turnuvalar siteye eklenmez (Örn: Kırıkkale, Isparta, Uşak).

## 🎯 KURAL: Tasarım, UX, DX ve AX İlkeleri

> **UYGULAMA PRENSİBİ:**
> - "Cut taglines, helper text and secondary labels. If a screen needs them to make sense, fix the layout."
> - "Make the best decision that will elevate all three: the user experience (UX), developer experience (DX), and agent experience (AX) always, without breaking anything."


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
