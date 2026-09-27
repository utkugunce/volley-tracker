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

## �🚨 KURAL: 81 İli Çekme & Senkronizasyon (Scrape 81 Provinces)

> **UYGULAMA PRENSİBİ:**
> Projede kod yazma, UI/tasarım geliştirme, hata düzeltme (bugfix), veri/script güncellemesi veya doğrudan veri çekme talebi içeren promptların sonunda **EN SON ADIM OLARAK 81 İLİN VERİSİ ÇEKİLMELİDİR**.

---

## ⏱️ 30 Dakika Minimum Bekleme Sınırı (Cooldown Kuralı)

> **ÖNEMLİ:** 81 ilin taranması işlemlerinde iki çekme arasında **minimum 30 dakika** süre bulunmalıdır.

### 🔒 Kuralın İşleyişi:
1. **Otomatik Tetiklemelerde:**
   - Kod, UI veya veri değişikliği sonrası otomatik çalıştırmalarda normal komut (`python scripts/scrape_all_provinces.py`) çalıştırılır.
   - Script içinde dahili 30 dakika kontrolü bulunur. Son taramadan bu yana 30 dakika dolmamışsa tarama yapılmaz; kalan bekleme süresi terminalde gösterilir ve işlem güvenle atlanır.
   - Agent, otomatik geliştirme adımlarında **kesinlikle `--force` parametresini KULLANMAZ**.
   - Tarama atlandığında kullanıcıya *"Son tarama X dakika önce yapıldığı için (30 dk bekleme kuralı gereğince) 81 il taraması atlandı."* şeklinde özet geçilir.

2. **İstisna (Kuralın Bozulabileceği Tek Durum):**
   - Bu kural **YALNIZCA KULLANICI AÇIKÇA MANUEL OLARAK İSTERSE** bozulabilir.
   - Örnek kullanıcı istekleri: *"30 dakikayı bekleme hemen çek"*, *"zorla güncelle"*, *"verileri yine de çek"*, *"force scrape"*, *"81 ili şimdi çek"*.
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

- **Standart / Otomatik Komut (30 dk kontrolü devrededir):**
```powershell
python scripts/scrape_all_provinces.py
```
*(veya sanal ortam için: `.venv\Scripts\python.exe scripts/scrape_all_provinces.py`)*

- **Manuel İstek Üzerine Zorlayarak Çalıştırma (30 dk kuralını atlar):**
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
- Her iki script de kendi Volleybox maç senkronizasyonunu (`scripts/sync_volleybox_matches.py`) güvenli şekilde tamamlar.
- Script tamamlandıktan sonra özet kullanıcıya bildirilir.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
