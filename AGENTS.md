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

## 🚀 KURAL: Otomatik Commit & Push (Auto Commit-Push)

> **UYGULAMA PRENSİBİ:**
> Projede tamamlanan her hata düzeltmesi (bugfix), yeni özellik/UI geliştirmesi veya veri güncellemesi sonrasında (testler ve gerekli kontroller tamamlandıktan sonra) **KULLANICIDAN EK TALEP BEKLENMEKSİZİN DEĞİŞİKLİKLER OTOMATİK OLARAK COMMIT EDİLİP `origin/main`'E PUSH EDİLMELİDİR**.

---

## �🚨 KURAL: 81 İli Çekme & Senkronizasyon (Scrape 81 Provinces)

> **UYGULAMA PRENSİBİ:**
> Projede kod yazma, UI/tasarım geliştirme, hata düzeltme (bugfix), veri/script güncellemesi veya doğrudan veri çekme talebi içeren promptların sonunda **EN SON ADIM OLARAK 81 İLİN VERİSİ ÇEKİLMELİDİR**.

---

## ⏱️ 1 Saat Minimum Bekleme Sınırı (Cooldown Kuralı)

> **ÖNEMLİ:** 81 ilin taranması işlemlerinde iki çekme arasında **minimum 1 saat (60 dakika)** süre bulunmalıdır.

### 🔒 Kuralın İşleyişi:
1. **Otomatik Tetiklemelerde:**
   - Kod, UI veya veri değişikliği sonrası otomatik çalıştırmalarda normal komut (`python scripts/scrape_all_provinces.py`) çalıştırılır.
   - Script içinde dahili 1 saat (60 dakika) kontrolü bulunur. Son taramadan bu yana 1 saat dolmamışsa tarama yapılmaz; kalan bekleme süresi terminalde gösterilir ve işlem güvenle atlanır.
   - Agent, otomatik geliştirme adımlarında **kesinlikle `--force` parametresini KULLANMAZ**.
   - Tarama atlandığında kullanıcıya *"Son tarama X dakika önce yapıldığı için (1 saat bekleme kuralı gereğince) 81 il taraması atlandı."* şeklinde özet geçilir.

2. **İstisna (Kuralın Bozulabileceği Tek Durum):**
   - Bu kural **YALNIZCA KULLANICI AÇIKÇA MANUEL OLARAK İSTERSE** bozulabilir.
   - Örnek kullanıcı istekleri: *"1 saati bekleme hemen çek"*, *"30 dakikayı bekleme hemen çek"*, *"zorla güncelle"*, *"verileri yine de çek"*, *"force scrape"*, *"81 ili şimdi çek"*.
   - Yalnızca bu durumda `--force` parametresi kullanılır:
     ```powershell
     python scripts/scrape_all_provinces.py --force
     ```

---

### ⛔ Tetiklenmeyecek (İstisna) Durumlar:
Aşağıdaki gibi basit ve salt konuşma/danışma odaklı promptlarda **SCRAPER ÇALIŞTIRILMAZ**:
- **Basit onay ve geri bildirimler:** "tamam", "teşekkürler", "anladım", "harika" vb.
- **Fikir alışverişi ve danışma soruları:** "şu nasıl?", "bunu sence nasıl yapmalıyız?", "fikrin ne?" vb.
- **Açıklama ve bilgi talepleri:** "bu fonksiyon ne yapıyor?", "bu dosya nerede?" gibi projede kod/veri değişikliği yapılmayan salt sorular.
- **Kural ve konfigürasyon istişareleri.**

### ✅ Tetiklenecek Durumlar:
- Kod veya stil (TSX, CSS, Python vb.) üzerinde değişiklik/ekleme yapıldığında.
- Yeni bir özellik veya sayfa/bileşen geliştirildiğinde.
- Hata düzeltme veya refactoring yapıldığında.
- Kullanıcı doğrudan "verileri çek", "senkronize et", "81 ili güncelle" gibi bir talepte bulunduğunda (kullanıcı açıkça manuel talep ettiğinde `--force` parametresi kullanılabilir).

### ❓ Tereddüt & Belirsizlik Durumu:
- Bir promptun veri çekmeyi gerektirip gerektirmediği konusunda herhangi bir şüphe veya belirsizlik yaşanırsa varsayımda bulunulmamalı, **doğrudan kullanıcıya sorulmalıdır** (*"81 il verilerini de güncelleyeyim mi?"*).

---

### Çalıştırılacak Komutlar:

- **Standart / Otomatik Komut (1 saat kontrolü devrededir):**
```powershell
python scripts/scrape_all_provinces.py
```
*(veya sanal ortam için: `.venv\Scripts\python.exe scripts/scrape_all_provinces.py`)*

- **Manuel İstek Üzerine Zorlayarak Çalıştırma (1 saat kuralını atlar):**
```powershell
python scripts/scrape_all_provinces.py --force
```

### Detaylar:
- **Altyapı (81 İl) Taraması:** Bu komut 81 ilin TVF bültenlerini eşzamanlı (multi-threaded) olarak tarar. `data/cities/*.json`, `data/cities.json` ve `data/fixtures.json` dosyalarını günceller.
- **TVF Kadınlar 2. Ligi (Ayrı / Bağımsız Scraper):** Kadınlar 2. Ligi verilerini bağımsız çekmek için:
  ```powershell
  python scripts/scrape_kadinlar_2_lig.py
  ```
  `data/kadinlar_2_lig.json` ve ilgili Volleybox eşleşmelerini bağımsız olarak günceller.
- **TVF Vodafone Sultanlar Ligi:** Sultanlar Ligi verilerini bağımsız çekmek için:
  ```powershell
  python scripts/scrape_sultanlar_ligi.py
  ```
  `data/sultanlar_ligi.json` ve Volleybox maçlarını günceller.
- **TVF KFC Kadınlar 1. Ligi:** Kadınlar 1. Ligi verilerini bağımsız çekmek için:
  ```powershell
  python scripts/scrape_kadinlar_1_lig.py
  ```
  `data/kadinlar_1_lig.json` ve Volleybox maçlarını günceller.
- **Profesyonel Ligler (Birleşik Çalıştırıcı):** Sultanlar Ligi ve Kadınlar 1. Ligi'ni (veya `--all` ile 2. Lig dahil) birlikte çekmek için:
  ```powershell
  python scripts/scrape_pro_leagues.py
  # veya npm komutları:
  npm run scrape:pro
  npm run scrape:sultanlar-ligi
  npm run scrape:kadinlar-1-lig
  ```
- Tüm scriptler kendi Volleybox maç senkronizasyonunu (`scripts/sync_volleybox_matches.py`) güvenli şekilde tamamlar.
- Script tamamlandıktan sonra özet kullanıcıya bildirilir.

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

## 📦 KURAL: Her Değişiklikten Sonra Commit + Push

> **UYGULAMA PRENSİBİ:**
> Projede yapılan her kod, hata düzeltmesi veya yapılandırma değişikliğinden sonra (testlerin başarıyla tamamlanmasının ardından) değişiklikler anlamlı bir commit mesajı ile commit'lenip uzak depoya (`origin main`) push edilmelidir.

### 🛡️ Push Öncesi & Sonrası CI Doğrulama Protokolü:
Next.js `next.config.mjs` dosyasında `typescript.ignoreBuildErrors: true` tanımlı olduğundan, yerel `next build` tip hatalarını yakalamaz. GitHub Actions CI ise `npm run typecheck` (`tsc --noEmit`) adımını zorunlu güvenlik ağı olarak çalıştırır.
Geliştiriciden/kullanıcıdan önce olası hataların anında yakalanması için her push öncesi ve sonrası şu sıra **ZORUNLUDUR**:

1. **Push Öncesi Kontroller:**
   - `npm run typecheck` (0 TypeScript hatası olmalıdır)
   - `npm run lint` (0 ESLint hatası/uyarısı)
   - `npm test` (Vitest testleri eksiksiz geçmelidir)
   - `python scripts/generate_city_slugs.py --check`
   - `python scripts/validate_data_files.py`

2. **Push Sonrası CI Takibi:**
   - Push işleminden hemen sonra `gh run list --limit 2` veya `gh run watch` ile GitHub Actions CI akışı terminalden takip edilmeli, yeşil (success) olduğu bizzat doğrulanmalıdır.
   - Olası bir CI aksaklığında kullanıcıya bildirim gitmeden agent anında müdahale edip düzeltmelidir.





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

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
