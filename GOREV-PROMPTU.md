# GÖREV PROMPTU — volley-tracker P1 + Tam Altyapı Paketi

> Bu dosya, `utkugunce/volley-tracker` üzerinde çalışacak bir kodlama ajanına (veya geliştiriciye) verilmek üzere hazırlanmış **tek başına yeterli** bir görev brief'idir[cite: 1].
> Tüm sayılar ölçülmüştür; tahmin değildir[cite: 1]. Ölçüm tarihi: **14 Ekim 2026**, taban: `main @ fd6f3be`[cite: 1].

---

## 0. Bağlam — Önce Bunu Oku

**Proje:** TVF (Türkiye Voleybol Federasyonu) altyapı ve üst ligleri takip platformu; canlı adres: https://altyapivoleybol.com.tr[cite: 1].
**Yığın:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind **3.4** (v4 değil) · TypeScript strict · Vitest 5 + Testing Library · PWA (el yazımı `public/sw.js`) · Python scraper'lar (httpx/bs4/curl_cffi) · GitHub Actions (saatlik veri senkronu) · Vercel **Hobby** + Supabase + Vercel Blob + Upstash · GHCR'a yedek Docker imajı[cite: 1].
**Ölçek:** 47,8k satır TS/TSX (test hariç) · 8,6k satır Python · 147 bileşen · 35 sayfa · 24 API rotası · **108 test dosyası / 961 test**[cite: 1].

### Az Önce Tamamlandı (PR #39, `main`'de)
Geçersiz/gizli il adresleri artık gerçek **HTTP 404** dönüyor (eskiden 200 — soft 404) ve `<title>` içindeki çift marka eki temizlendi[cite: 1]. Eklenen altyapı[cite: 1]:
- `src/proxy.ts` içinde şehir bekçisi → `src/utils/cityRouteGuard.ts` + `src/utils/citySlugs.ts`[cite: 1]
- `scripts/generate_city_slugs.py` (allowlist üreticisi, `--check` modu CI'da)[cite: 1]
- CI'a `npm run typecheck` ve `generate_city_slugs.py --check` adımları eklendi[cite: 1]
- Bekçi testleri: `citySlugs.test.ts`, `cityRouteGuard.test.ts`, `proxy-city-guard.test.ts`, `metadata-brand.test.ts`[cite: 1]

**Bu paketin kalan işleri aşağıda.** Sırayla yapın; her görev kendi başına bir PR olabilir[cite: 1].

### Kesin Kurallar (Proje Konvansiyonu)
1. **Node 22 zorunlu.** Node 20'de vitest/jsdom çöküyor (`webidl.util.markAsUncloneable is not a function`)[cite: 1].
2. `src/` içinde **`any` yasak** (şu an 0 adet — bozmayın)[cite: 1]. Lint `--max-warnings=0`[cite: 1].
3. **`next/image` YASAK** — ESLint `no-restricted-imports` kuralı var, çünkü Vercel Image Optimization kotası (aylık 5K) ücretsiz planda aşıldı[cite: 1]. `images.unoptimized: true`[cite: 1].
4. Yorumlar ve commit mesajları **Türkçe**, conventional commit biçiminde (`fix(...)`, `perf(...)`, `chore(...)`)[cite: 1].
5. **Sessiz fallback yasak** — bkz. `docs/audit-hardcoded-fallbacks.md`[cite: 1]. Gerçek veriyi temsil eden hiçbir değer sabit bir sayıya `|| 4` gibi bağlanamaz[cite: 1]. Veri yoksa skeleton veya açık 0 gösterilir[cite: 1].
6. **Vercel Hobby kotaları her kararın gerekçesidir:** ISR Write, Deployment Storage (10 GB, **%75 dolu**), Image Optimization, Fluid Active CPU ve Fast Origin Transfer[cite: 1]. Bir değişiklik bu kotalardan birini büyütüyorsa gerekçelendirin[cite: 1].
7. Her görevin sonunda: `npx tsc --noEmit` + `npm run lint` + `npx vitest run` **üçü de temiz** olmalı[cite: 1].
8. **`main`'e doğrudan push etmeyin.** Branch + PR + yeşil CI[cite: 1]. (Not: `AGENTS.md` "her değişiklikten sonra commit+push" diyor; bu kuralı PR açacak şekilde yorumlayın[cite: 1].)

### Doğrulama Komutları
```bash
npm ci                                    # Node 22 ile[cite: 1]
npx tsc --noEmit                          # 0 hata[cite: 1]
npm run lint                              # 0 uyarı[cite: 1]
npx vitest run                            # 108 dosya / 961 test (+ sizin ekledikleriniz)[cite: 1]
python scripts/validate_data_files.py     # veri bütünlüğü[cite: 1]
python scripts/generate_city_slugs.py --check #[cite: 1]
npm run build                             # yerelde RAM yetmeyebilir; CI'da koşuyor[cite: 1]
```

### Bilinen Tuzaklar (Bunları Öğrenmek Saatler Sürdü, Size Sürmesin)
- **`next.config.mjs` → `typescript.ignoreBuildErrors: true`.** Yani `next build` tip hatası yakalamaz[cite: 1]. Tek güvenlik ağı `npm run typecheck` (artık CI'da var)[cite: 1].
- **Streaming + `notFound()` = HTTP 200.** `src/app/loading.tsx` bir Suspense sınırı kurduğu için sayfa kabuğu 200 ile flush edilir; sayfa bileşeni sonradan `notFound()` fırlatsa bile status düzeltilemez[cite: 1]. Status kodu kontrol edilecekse bu **`src/proxy.ts` (middleware)** içinde yapılmalı — stream'den önce çalışır[cite: 1].
- **Tailwind `content` glob'ları `src/data/**`'ı TARAMIYOR.** Yalnızca `src/pages/**`, `src/components/**`, `src/app/**`[cite: 1]. Yani bir Tailwind sınıfı yalnızca `src/data/*.json` içinde geçiyorsa **purge edilir** ve çalışmaz[cite: 1]. (Bkz. Görev 4 — bu yüzden canlıda bozuk renkler var[cite: 1].)
- **Next.js `/404` yolunu rezerve ediyor.** `src/app/404/page.tsx` fiilen ölü kod: `/404`'e rewrite edilen istekler Next'in iç not-found rotasına düşüyor (`app/not-found.tsx`), sizin verdiğiniz metadata uygulanmıyor[cite: 1]. `<meta name="robots" content="noindex">` Next'in kendisinden geliyor[cite: 1].
- **`data/` git'te ve her fonksiyona kopyalanıyor** (`outputFileTracingIncludes`)[cite: 1]. Görev 1 tam olarak bunu çözüyor[cite: 1].
- Testler gerçek `data/` dosyalarına yazmasın diye `vitest.setup.ts` `MANUAL_OVERRIDES_FILE` ve `PUSH_SUBSCRIPTIONS_FILE`'ı geçici dizine yönlendiriyor[cite: 1]. Yeni test yazarken bu desene uyun[cite: 1].

---

## GÖREV 1 · PR #38'i İncele, Güncelle ve Merge Et (Deployment Storage Optimizasyonu)

**Sorun:** Vercel Hobby **Deployment Storage** kotasının (10 GB) **%75'i dolu**[cite: 1]. Sebep: `next.config.mjs` içindeki[cite: 1]
```js
outputFileTracingIncludes: { "/api/**/*": ["./data/**/*"], "/**/*": ["./data/**/*"] }
```
`data/` klasörünün (~8,9 MB) tamamını **izlenen 67 fonksiyonun her birine** kopyalıyor → deploy başına ~594 MB[cite: 1].

**PR #38** (`perf/deployment-storage` @ `09ce0fb`) bunu düzeltiyor: yalnızca `next.config.mjs`, **+27/−2**[cite: 1]. Önerdiği değişiklik[cite: 1]:
- Global include artık sadece çalışma anında `fs` ile okunan dosyalar: `cities.json`, `fixtures.json`, `kadinlar_2_lig.json`, `manual-overrides.json`, `cities/**`[cite: 1]
- `data/team-rosters.json` (~3,7 MB) yalnızca `/takim/**/*` rotalarına[cite: 1]
- `data/raw/**` hiçbir fonksiyona girmiyor (`outputFileTracingExcludes`)[cite: 1]
- `team-rosters.json`, `teamData` barrel'ı yüzünden otomatik izlendiği 7 rotadan açıkça hariç tutuluyor (`/api/club/teams`, `/api/health`, `/istatistikler`, `/karsilastir`, `/kulupler`, `/sitemap.xml`)[cite: 1]
- PR'ın kendi ölçümü: **594 MB → 348,6 MB (−%41)**[cite: 1]

**İnceleme Notu:** diff doğru görünüyor, kapsam dar (tek dosya), gerekçeler yorumlanmış[cite: 1]. Risk: bir rota çalışma anında `fs` ile hariç tutulmuş bir dosyayı okuyorsa sessizce boş veri döner[cite: 1].

### Yapılacaklar
1. Branch'i `main` (`fd6f3be`) üzerine rebase edin — PR 11 Ekim'den beri bekliyor, main ilerledi[cite: 1].
2. **Hariç tutma iddialarını kanıtlayın.** Her bir dışlanan dosya için, onu `fs` ile okuyan kod yolunu bulun[cite: 1]:
   ```bash
   grep -rn "team-rosters" src/ --include='*.ts' --include='*.tsx' | grep -v __tests__
   grep -rn "volleybox-mappings" src/ --include='*.ts' --include='*.tsx' | grep -v __tests__
   grep -rn "data/raw\|\"raw\"" src/ scripts/ --include='*.ts' --include='*.py'
   ```
   Kesin çağrı zinciri (siz de teyit edin)[cite: 1]:
   - `data/team-rosters.json`'ı `fs` ile okuyan **tek** yer: `src/utils/team/loaders.ts:54`[cite: 1]
   - Onu çağıran: `src/utils/team/details.ts` → `getTeamDetailsBySlug()`[cite: 1]
   - `getTeamDetailsBySlug`'ı çağıran **tek** yer: `src/app/takim/team-page.tsx` (satır 25 ve 58)[cite: 1]
   - Sorun şu: `src/utils/teamData.ts` bir **barrel** (`export { getTeamDetailsBySlug } from "./team/details"`)[cite: 1]. Bu barrel'ı import eden her rota, `team-rosters.json`'ı da otomatik izliyor — PR #38'in hariç tutma listesi tam olarak bunu telafi ediyor[cite: 1].
   - `/karsilastir` ve `/istatistikler` takım künyesi (roster) gösteriyorsa bu bir **regresyon** olur — özellikle kontrol edin[cite: 1].
3. **Build çıktısını ölçün.** PR'ın iddiasını kendiniz doğrulayın[cite: 1]:
   ```bash
   STANDALONE_BUILD= npm run build
   python3 - <<'EOF'
   import glob, json, os, collections
   tot = collections.Counter()
   for f in glob.glob('.next/server/**/*.nft.json', recursive=True):
       d = json.load(open(f)); route = f.split('.next/server')[1]
       for x in d.get('files', []):
           if '/data/' in x or x.startswith('data/'): tot[route] += os.path.getsize(os.path.join('.', x)) if os.path.exists(x) else 0
   print('data izlenen rota:', len(tot), '| toplam: %.1f MB' % (sum(tot.values())/1024/1024))
   for r, s in tot.most_common(8): print('  %6.1f MB %s' % (s/1024/1024, r))
   EOF
   ```
   Hem `main`'de hem branch'te çalıştırıp farkı PR'a yorum olarak yazın[cite: 1].
4. **Bir bekçi testi ekleyin** (proje üslubunda, `src/app/__tests__/isr-kota.test.ts` gibi)[cite: 1]:
   `next.config.mjs`'i okuyup (a) global `outputFileTracingIncludes`'ın `./data/**/*` **içermediğini**, (b) `team-rosters.json`'ın yalnızca `/takim/**/*` altında olduğunu, (c) `outputFileTracingExcludes`'ta `./data/raw/**/*` bulunduğunu assert edin[cite: 1]. Böylece biri eski global kurala geri dönemez[cite: 1].
5. `data/raw/` git'te durmaya devam ediyor (496 KB, 6 dosya: 3 `.txt` + 3 `.xlsx`, Türkçe karakterli dosya adları var)[cite: 1]. Bu PR onu fonksiyonlardan çıkarıyor ama repodan çıkarmıyor — yeterli[cite: 1]. Repodan çıkarmak ayrı bir iş (bkz. Görev 6)[cite: 1].
6. CI yeşilse **squash merge** edin (repo konvansiyonu bu; commit başlığına `(#38)` ekleyin)[cite: 1].

**Kabul kriteri:** deploy başına izlenen `data/` hacmi ölçülebilir şekilde düşmüş (hedef ≤ 360 MB), bekçi testi eklenmiş, 961 test + yeni testler yeşil, hiçbir rotada veri kaybı yok[cite: 1].

---

## GÖREV 2 · `team-colors.json`'ı İstemci Paketinden Çıkar (~213 KB)

### Ölçülmüş Mevcut Durum
Ana sayfanın ilk HTML'inde referanslanan **20 JS dosyası = 1.885 KB sıkıştırılmamış**[cite: 1]. En büyükler: 608 KB, **246 KB**, 224 KB, 152 KB, 134 KB[cite: 1].

Kaynağı canlıda doğrulandı[cite: 1]:
- `src/components/TeamBadge.tsx` **`"use client"`** ve `src/data/team-colors.json`'ı **statik olarak import ediyor**[cite: 1].
- Dosya: **242,7 KB** = `{ p: [...], t: {...} }`[cite: 1]
  - `p` (palet): **631 girdi**, sıkıştırılmış **29,3 KB** — her girdi `[hex, borderClass, bgClass]`[cite: 1]
  - `t` (takım adı → palet indeksi): **7.347 anahtar**, sıkıştırılmış **213,4 KB**[cite: 1]
  - Anahtarların **%56'sı slug biçiminde** (`vakifbank-u18`), %44'ü Türkçe/boşluklu (`vakıfbank u18`)[cite: 1]
- Bu harita canlıda `/_next/static/immutable/chunks/3jfmr2glu-s6u.js` (**241 KB**) içinde **tarayıcıya gönderiliyor**[cite: 1]. İçinde `vakifbank-izmir-u18` gibi anahtarları arayarak kendiniz de doğrulayabilirsiniz[cite: 1].
- `TeamBadge` / `getTeamColor` **22 test-dışı dosyada** kullanılıyor[cite: 1].
- Üretici: `scripts/generate_team_colors.py` — `public/logos/*.png` dosyalarını tarayıp gerçek logo renklerinden palet çıkarıyor (767 logo)[cite: 1].

### Neden Önemli
Hedef kitle mobil ağırlıklı ve Türkiye'de[cite: 1]. 213 KB'lık bir arama tablosu, ilk boyamada **hiç gerekli değil**: sayfadaki ~50 takım için yalnızca ~50 indeks gerekiyor[cite: 1].

### Yaklaşımlar (Önerilen Sıra)

**2A — Haritayı tembel yükle (hızlı kazanım, düşük risk, ~1-2 saat)**[cite: 1]
- `src/data/team-colors.json`'ı ikiye böl: `team-palette.json` (`p`, 29 KB, statik kalır) ve `team-color-index.json` (`t`, 213 KB, dinamik)[cite: 1].
- `getTeamColor()` harita yüklenmeden **senkron olarak makul bir varsayılan palet** döndürsün (sessiz fallback değil — bkz. kural 5: varsayılan, "veri yok" durumunun açık karşılığı olmalı ve mevcut sabit marka kuralları zaten öncelikli)[cite: 1].
- Haritayı `requestIdleCallback` içinde `import()` ile çekin; çözülen indeksleri modül-düzeyi bir `Map` + `sessionStorage`'da tutun[cite: 1].
- Yeniden render için **`useSyncExternalStore`** kullanın — projede hazır örneği var: `src/i18n/useLanguage.ts`[cite: 1]. Aynı deseni izleyin[cite: 1].
- Sonuç: 213 KB kritik yoldan çıkar; tembel indirilmeye devam eder[cite: 1].

**2B — Rengi sunucu tarafında çöz (kalıcı çözüm, ~yarım gün)**[cite: 1]
- `scripts/generate_team_colors.py` çıktısını **veri üretim zamanında** maç/takım kayıtlarına yazın: `data/cities/*.json`, `data/kadinlar_2_lig.json`, `data/team-rosters.json` içindeki her takım için palet indeksi (1-3 karakter) veya doğrudan hex[cite: 1].
- `TeamBadge`'e opsiyonel `colorIdx?: number` / `color?: string` prop'u ekleyin; varsa haritaya hiç bakmasın[cite: 1].
- İdeal olan: sunucu bileşeni indeksi **3 somut değere** (bg sınıfı, border sınıfı, hex) çözüp prop olarak geçirsin → istemciye **0 KB** renk verisi gider[cite: 1].
- Veride olmayan adlar için (arama kutusu, karşılaştırma ekranı) 2A'daki tembel harita yedek olarak kalsın[cite: 1].

**2C — Haritayı küçült (2A/2B'yi tamamlayıcı, ~1 saat)**[cite: 1]
- `t`'yi indeks bazında gruplayıp tek dizi olarak yayın: `{ "0": "vakıfbank,vakifbank,vakifbank-u18", ... }`[cite: 1]. 7.347 tekrarlanan indeks rakamı ve JSON tırnak yükü gider; modül açılışında bir `Map` kurun[cite: 1].
- **Erişilemeyen anahtarları atın.** `getTeamColor` üç strateji deniyor: `s1 = slugify(name)`, `s2 = trLower(name)`, `s3 = slugify(clean(name))` (burada `clean`, `sk|gsk|spor kulübü|voleybol|belediyesi|...` gibi ekleri atıyor)[cite: 1]. Her anahtar için bu üç stratejiden **hiçbirinin** üretemeyeceği biçimleri tespit edip silin[cite: 1]. Kaç anahtarın düştüğünü ölçüp PR'a yazın[cite: 1].
- Beklenti: 213 KB → **~80-110 KB**[cite: 1].

### Kesin Tuzak
**Tailwind purge.** `p` içindeki sınıf adları (`border-orange-400`, `bg-surface-raised`, ...) yalnızca `src/data/*.json`'da geçerse Tailwind bunları **üretmez**, çünkü `content` glob'ları `src/data/**`'ı kapsamıyor[cite: 1]. Şu an 13 benzersiz sınıfın 11'i `src/components/**` içindeki sabit marka kurallarında da geçtiği için kurtuluyor — **2'si kurtulmuyor** (bkz. Görev 4)[cite: 1]. Rengi `data/*.json`'a taşırsanız (2B) bu risk büyür[cite: 1]:
- ya sınıfları `src/**` içinde tutun[cite: 1],
- ya `tailwind.config.ts`'e `safelist` ekleyin[cite: 1],
- ya da sınıf yerine **ham hex + inline style** kullanın (en temizi)[cite: 1].

### Kabul Kriteri
- Ana sayfanın ilk HTML'inde referanslanan JS **1.885 KB → ≤ 1.650 KB**[cite: 1].
- İlk yüklemede inen **hiçbir chunk `vakifbank-izmir-u18` içermiyor**[cite: 1].
- Görsel çıktı değişmedi: `TeamBadge` için örnek bir takım kümesinde (Fenerbahçe, VakıfBank U18, Eczacıbaşı, Galatasaray, + rastgele 10 altyapı takımı) border/bg renkleri önce-sonra aynı[cite: 1].
- **Bekçi testi ekleyin:** hiçbir `"use client"` modülünün `team-color-index.json`'ı (veya bölme sonrası `t` haritasını) statik import etmediğini kaynak taramasıyla assert edin[cite: 1]. Mevcut `TeamBadge.test.tsx`'i genişletin[cite: 1].
- `tsc` 0 hata · `lint` 0 uyarı · tüm testler yeşil[cite: 1].

---

## GÖREV 3 · Deploy-Sonrası Smoke Testi (P0'ların Canlıya Çıkmasını Engelleyen Asıl Eksik)

### Neden
PR #39'daki iki hata da (soft 404 + çift marka) **826 test geçen bir depoda canlıya çıkmıştı**[cite: 1]. Eksik olan test kapsamı değil, **dağıtımın kendisinin** test edilmemesiydi[cite: 1]. Birim testler kaynak kodu doğruluyor; hiçbiri "canlı URL gerçekten 404 dönüyor mu" sorusunu sormuyor[cite: 1].

### Yapılacak: `.github/workflows/smoke.yml`

**Tetikleyici:** Vercel GitHub entegrasyonu aktif (`vercel[bot]` PR'lara deployment yorumu bırakıyor, yani GitHub Deployments API kullanılıyor)[cite: 1]. En sağlam yol[cite: 1]:
```yaml
on:
  deployment_status: {}
  workflow_dispatch:
    inputs:
      base_url: { description: "Test edilecek adres", default: "[https://altyapivoleybol.com.tr](https://altyapivoleybol.com.tr)" }
```
Job içinde `if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Production'` filtresi uygulayın[cite: 1]. `workflow_dispatch` elle çalıştırma için kalsın[cite: 1].
> Not: `deployment_status` beklenmedik şekilde ateşlenmezse yedek plan: `workflow_run: { workflows: ["CI"], types: [completed], branches: [main] }` + production'ın yeni commit'i yansıttığını poll eden bir bekleme adımı[cite: 1].

**Secret gerekmez** — site herkese açık[cite: 1]. (İsterseniz `concurrency` ve `timeout-minutes: 5` ekleyin[cite: 1].)

**Adımlar:** `actions/checkout` → `actions/setup-node@v7` (node 22) → `npm ci` → `node scripts/smoke.mjs` (yeni dosya, bağımlılıksız, `fetch` Node 22'de yerleşik)[cite: 1].

### `scripts/smoke.mjs` — Assert Edilecekler
Canlıda doğrulanan taban çizgisi[cite: 1]:

**A) Gerçek 404 (12 adres):**[cite: 1]
```
/nigde  /usak  /kirikkale                                    (gizli iller)
/definitely-not-a-page-xyz  /foobar-invalid-city             (uydurma)
/takim  /lig                                                 (kökünde page.tsx yok)
/sonuclar/xyz-gecersiz  /fikstur/foobar  /puan-durumu/nigde
/kulupler/olmayan-sehir-xyz  /kulupler/olmayan-sehir/kadikoy
```
Her biri için: `status === 404` **VE** gövdede `Top Çizgi Dışında` geçmeli (404 arayüzü gerçekten render edildi)[cite: 1].

**B) 200 kalmalı (regresyon bekçisi):**[cite: 1]
```
/  /istanbul  /ankara  /all  /fikstur  /fikstur/istanbul  /sonuclar/izmir
/puan-durumu/ankara  /gunun-maclari/bursa  /grup-durumu/istanbul
/kulupler  /kulupler/istanbul  /kulupler/istanbul/kadikoy
/takim/vakifbank-u18-t19499  /lig/istanbul/genc-kizlar
/kadinlar-2-ligi  /istatistikler  /hangi-ligde-oynar  /karsilastir  /takvim
/admin  /dmca  /gizlilik  /panel  /giris  /404(*)
/icon.svg  /sw.js  /robots.txt  /sitemap.xml  /manifest.json  /llms.txt
/api/health  /api/fixtures
```
> (*) `/404` **404** döner — bu beklenen davranış, Next `/404`'ü iç not-found rotası olarak rezerve ediyor[cite: 1]. Listeyi buna göre kurun[cite: 1].

**C) `<title>` içinde marka tam bir kez:**[cite: 1]
```
/                       -> "Altyapı Voleybol — TVF Fikstür ve Puan Durumu"   (absolute, tek)
/fikstur/istanbul       -> "... | Altyapı Voleybol"
/puan-durumu/izmir      -> "... | Altyapı Voleybol"
/sonuclar/ankara        -> "... | Altyapı Voleybol"
/kulupler/istanbul      -> "... | Altyapı Voleybol"
/takvim                 -> "... | Altyapı Voleybol"
/karsilastir            -> "... | Altyapı Voleybol"
/kadinlar-2-ligi/puan-durumu -> "... | Altyapı Voleybol"
```
Assertion: `title.split("Altyapı Voleybol").length - 1 <= 1`[cite: 1].

**D) `/api/health` sözleşmesi:**[cite: 1]
`status === "ok"`, `data.cityFiles >= 30`, `data.cityMatches > 0`, `integrations.blobPersistence === true`[cite: 1].
Ayrıca `data.latestUpdatedAt` **24 saatten eski olmamalı** — veri hattı koparsa bunu ilk smoke testi yakalar[cite: 1].

**E) (Görev 2 bittikten sonra ekleyin) bundle bütçesi:**[cite: 1]
Ana sayfanın ilk HTML'inden JS chunk URL'lerini toplayın, toplam sıkıştırılmamış boyutu hesaplayın ve bir eşiği (ör. 1.700 KB) aşmadığını assert edin[cite: 1]. Ayrıca hiçbir ilk-yükleme chunk'ında `vakifbank-izmir-u18` geçmemeli[cite: 1].

**F) (Görev 4 bittikten sonra ekleyin) CSS bütünlüğü:**[cite: 1]
Canlı CSS'te `.border-emerald-400` ve `.border-pink-400` bulunmalı[cite: 1].

### Hata Davranışı
`scripts/scrape-sync.yml`'deki deseni kopyalayın: başarısızlıkta **issue aç**, ama aynı başlıklı açık issue varsa **yorum ekle** (spam önleme)[cite: 1]. `gh issue create` başarısız olursa adım da başarısız olsun (hata yutulmasın)[cite: 1].

### Kabul Kriteri
Workflow production deploy'undan sonra otomatik koşuyor, yukarıdaki A-F gruplarını doğruluyor, başarısızlıkta tek bir issue açıyor[cite: 1]. **Kanıt:** bilerek bozma testi yapın — bir branch'te `cityRouteGuard`'ı devre dışı bırakıp preview deploy'unda smoke'un kırmızıya döndüğünü görün, sonra geri alın[cite: 1].

---

## GÖREV 4 · Tailwind Purge Yüzünden Canlıda Bozuk Olan Takım Renkleri (Küçük Ama Gerçek Hata)

### Ölçülmüş Bulgu
`src/data/team-colors.json` → `p` içinde **13 benzersiz Tailwind sınıfı** var[cite: 1]. Bunların **11'i** `src/**` kaynaklarında da geçtiği için Tailwind tarafından üretiliyor[cite: 1]. **2'si hiçbir kaynak dosyada geçmiyor:**[cite: 1]

```
border-emerald-400
border-pink-400
```

Canlı CSS'te doğrulandı (toplam 131 KB, 3 dosya)[cite: 1]:
```
YOK!!  border-emerald-400
YOK!!  border-pink-400
VAR    border-yellow-400 / border-orange-400 / border-red-400 / border-purple-400
VAR    border-slate-200 / border-blue-400 / border-teal-400 / border-amber-400 / border-sky-400
```
Sebep: `tailwind.config.ts` → `content` yalnızca `src/pages/**`, `src/components/**`, `src/app/**`[cite: 1]. `src/data/**` **taranmıyor**[cite: 1].

**Etki:** 631 palet girdisinin **55'i (%8)** ve 7.347 takım anahtarının **653'ü (%8)** marka rengi halkası **çizilmeden** render oluyor[cite: 1]. Yani ~650 takımın rozeti sessizce renksiz[cite: 1].

### Yapılacaklar
1. `tailwind.config.ts`'e `safelist` ekleyin — ama **dinamik üretin**, elle liste yazmayın (yeni palet renkleri eklenince yine purge olur)[cite: 1]:
   ```ts
   import teamColors from "./src/data/team-colors.json";
   const safelist = Array.from(new Set(
     (teamColors.p as [string, string, string][]).flatMap(([, border, bg]) => [border, bg])
   ));
   ```
   (Not: `tailwind.config.ts` zaten `src/theme/palettes`'i import ediyor, yani `src/`'den import bu dosyada normal[cite: 1]. `resolveJsonModule` açık[cite: 1].)
2. Alternatif (daha temiz): `content` glob'larına `"./src/data/**/*.json"` ekleyin[cite: 1]. Ama bu, 242 KB'lık JSON'u her build'de tarar ve **Görev 2'de dosyayı bölerseniz glob'u da güncellemeniz gerekir**[cite: 1]. `safelist` daha öngörülebilir[cite: 1].
3. **Bekçi testi:** `src/data/team-colors.json`'daki her Tailwind sınıfının ya `src/**` kaynaklarında geçtiğini ya da `tailwind.config.ts`'teki `safelist`'te bulunduğunu assert edin[cite: 1]. Bu analizi teste çevirin — böylece yeni bir renk eklenince CI kırılır[cite: 1].
4. Görev 3'teki smoke testine **F** maddesini ekleyin (canlı CSS'te bu iki sınıfın varlığı)[cite: 1].

**Kabul kriteri:** canlı CSS'te `border-emerald-400` ve `border-pink-400` mevcut; bekçi testi eklenmiş; palet renkleri değiştiğinde test kırılıyor[cite: 1].

---

## GÖREV 5 · İki Küçük Temizlik + Sitemap/Yönlendirme Senkronizasyonu (PR #39'dan Kalan)

**5a — `src/app/404/page.tsx` ölü kod.**[cite: 1]
Next.js `/404` yolunu iç not-found rotası olarak rezerve ediyor[cite: 1]. Kanıt: `/404`'ün `<title>`'ı bizim verdiğimiz `Sayfa Bulunamadı (404)` değil, kök layout'un varsayılanı; `noindex` meta'sı middleware'e hiç uğramayan `/zzz/yyy`'de de var[cite: 1]. Yani dosya hiç render edilmiyor[cite: 1].
- **Karar:** silin (ve `src/utils/__tests__/citySlugs.test.ts` + `src/__tests__/metadata-brand.test.ts` içindeki ilgili assertion'ları güncelleyin) **veya** dosyanın başına "Next /404'ü rezerve ediyor; bu sayfa render edilmez, rewrite hedefinin var olması için tutuluyor" yorumu ekleyin[cite: 1]. Ölü kod + onu test eden test, tam olarak `docs/lighthouse-baseline.md`'de eleştirilen "doküman kodla çelişiyor" durumunun kod karşılığı[cite: 1].
- Silerseniz `python scripts/generate_city_slugs.py` çalıştırın: `404` dizini kalkınca `STATIC_ROOT_SEGMENTS`'tan da otomatik düşer[cite: 1]. Davranış değişmez (`/404` → Next'in iç rotası → 404)[cite: 1].

**5b — `cityHelper.isValidCitySlug` içindeki sessiz fallback.**[cite: 1]
```ts
const cities = getAllCitiesList();
if (cities.length === 0) return true; // fallback if list not loaded yet   <-- burası
```
Bu, projenin **kendi** `docs/audit-hardcoded-fallbacks.md` belgesinde yasakladığı desenin ta kendisi; üstelik yönlendirme katmanında[cite: 1]. Artık birincil bekçi `cityRouteGuard` (statik allowlist, `fs`'e bağımlı değil) olduğu için bu fallback'e ihtiyaç yok[cite: 1].
- **Dikkat — felaket modu:** bunu naifçe `return false` yaparsanız, `data/cities.json` okunamadığı bir anda **tüm geçerli il sayfaları 404** olur[cite: 1]. Onun için: `cityRouteGuard.isAllowedCitySlug`'ı kullanın (statik, her zaman mevcut) ya da boş liste durumunda `console.error` + `/api/health`'e yansıyan bir uyarı üretip **mevcut davranışı koruyun**[cite: 1].
- İkinci bir fayda: `getAllCitiesList()` 78 il döndürüyor ama `data/cities/` altında **33 dosya** var — yani 45 il "geçerli" ama verisiz[cite: 1]. Bu farkı `/api/health`'te görünür yapın (bkz. Görev 6)[cite: 1].

**5c — `sitemap.ts` ve `next.config.mjs` (`?city=` Redirect) Tutarlılığı:**
- `sitemap.ts` çıktısının da `cityRouteGuard` / `citySlugs` allowlist'i ile birebir uyumlu olduğunu ve PR #39 ile 404'e çekilen gizli illerin (`nigde`, `usak`, `kirikkale` vb.)[cite: 1] sitemap içinde yer almadığını bir testle garanti altına alın.
- `next.config.mjs` içindeki eski `?city=` yönlendirmelerinin gizli illerde "Redirect -> 404" zinciri oluşturup oluşturmadığını kontrol edin.

---

## GÖREV 6 · Mimari: Git'i Veritabanı Olmaktan Çıkar (Büyük İş, Ayrı Bir Dönem)

### Ölçülmüş Durum
- Repo: **122,6 MB / 31 gün** (~4 MB/gün büyüme → GitHub'ın 1 GB yumuşak sınırı ~7 ayda aşılır)[cite: 1].
- `data/` = **8,9 MB**: `team-rosters.json` 3,7 MB · `kadinlar_2_lig.json` 2,1 MB · `cities/` 1,7 MB · `volleybox-mappings.json` 756 KB · `fixtures.json` 192 KB · `raw/` 496 KB[cite: 1].
- `scrape-sync.yml` her çalıştırmada aynı veriyi **Supabase'e de yazıyor** (`npm run supabase:import`) ama bu veriyi **yalnızca `/api/fixtures`** okuyor (`getSupabaseFixturesCached`)[cite: 1]. Sayfalar hâlâ `fs` ile JSON okuyor → **iki doğruluk kaynağı**, ve pahalı olanı (git + fs) birincil[cite: 1].
- Her `data/` commit'i = yeni deploy = **boş ISR önbelleği** (kendi yorumlarında yazılı)[cite: 1]. Bu yüzden `DATA_COMMIT_MIN_INTERVAL_HOURS=6` throttling'i var[cite: 1].

### Hedef
Supabase'i **okuma yolu** yap, git'i veri deposu olmaktan çıkar[cite: 1]. Bu tek hamle dört sorunu birden çözer: repo büyümesi, deploy ağırlığı/storage kotası, data-commit→deploy zinciri, ISR önbelleğinin her veri güncellemesinde sıfırlanması[cite: 1].

### Adımlar (Sırayla, Her Biri Ayrı PR)
1. **Envanter:** `fs.readFileSync(... "data" ...)` çağrılarının tamamını listeleyin[cite: 1]. Hangi dosyayı hangi rota okuyor? (Görev 1'in `grep`'leri başlangıç noktası[cite: 1].)
2. **Supabase okuma yolunu genişletin:** `getSupabaseFixturesCached` zaten var; `cities.json`, `kadinlar_2_lig.json`, `team-rosters.json` için eşdeğerlerini yazın[cite: 1]. Mevcut bellek-içi önbellek desenini (`CACHE_TTL_MS`, `Map`) koruyun — Fluid Active CPU'yu yakmamak için önemli[cite: 1].
3. **JSON'u yedek konumuna indirin:** Supabase erişilemezse JSON'a düş (`supabaseFixtures.ts` zaten `return null` ile bunu yapıyor)[cite: 1]. Ama **sessiz düşüş olmasın**: `/api/health`'e `dataSource: "supabase" | "json-fallback"` alanı ekleyin[cite: 1].
4. **`data/`'yı git'ten çıkarın:** önce `data/raw/` (scraper girdisi, runtime'da hiç okunmuyor), sonra `team-rosters.json` ve `volleybox-mappings.json`[cite: 1]. `scrape-sync.yml`'deki commit adımını kaldırın veya yalnızca küçük bir anlık görüntüye indirin[cite: 1].
5. **`vercel-ignore-build.sh` ve `DATA_COMMIT_MIN_INTERVAL_HOURS` mantığını yeniden değerlendirin** — veri artık deploy tetiklemiyorsa bu throttle'a gerek kalmaz, veri güncellemesi ISR'ı da sıfırlamaz[cite: 1].

### Kabul Kriteri
`data/` git'te ≤ 1 MB (ya da hiç yok) · sayfalar Supabase'den okuyor · Supabase çökerse JSON yedeği devreye giriyor ve bu `/api/health`'te görünüyor · 961+ test yeşil · canlıda hiçbir rotada veri kaybı yok (Görev 3'teki smoke testi bunu kanıtlar)[cite: 1].

---

## GÖREV 7 · Veri Boru Hattı (`scrape-sync.yml`), Atomik JSON Yazımı ve Vercel Dağıtım Temizliği

### Sorun ve Amaç
1. Saatlik çalışan Python scraper'ları (`httpx`/`bs4`/`curl_cffi`)[cite: 1] ve `update_volleybox_team_names.py` betiği dış kaynaklardan (TVF / Volleybox) veri çekerken ağ kopması veya yarım yanıt aldığında mevcut sağlam JSON dosyalarını ezme riski taşır.
2. `.github/workflows/scrape-sync.yml`[cite: 1] içindeki PAT/Secret yetkilendirmeleri ve veri commit'lerinin gereksiz Vercel Preview/Production derlemeleri tetiklemesi Deployment Storage kotasını (%75 dolu)[cite: 1] zorlar.

### Yapılacaklar
1. **Atomik JSON Yazımı (`.tmp` + `os.replace`):**
   - `scripts/` altındaki tüm veri üretici Python betiklerini inceleyin.
   - Çekilen veriyi doğrudan hedef JSON dosyasına yazmak yerine önce `.tmp` uzantılı geçici bir dosyaya yazın, `json.loads()` ve temel anahtar/şema doğrulamasından geçirin; yalnızca doğrulama başarılıysa `os.replace(tmp_path, target_path)` ile atomik olarak hedef dosyayı güncelleyin.
   - `python scripts/validate_data_files.py`[cite: 1] adımının `scrape-sync.yml` içinde commit/import adımından hemen önce zorunlu kapı (gate) olarak çalıştığını doğrulayın.
2. **GitHub Actions Yetkilendirme ve `[skip ci]` Koruması:**
   - `.github/workflows/scrape-sync.yml` içindeki `permissions: contents: write, issues: write` izinlerini ve PAT / Supabase secret değişkenlerini kontrol edin.
   - Görev 6 tamamlanana kadar `scrape-sync.yml` tarafından atılan otomatik veri commit'lerinin gereksiz CI iş akışlarını veya Vercel derlemelerini tetiklememesi için `vercel-ignore-build.sh`[cite: 1] ve commit mesajı kurallarını doğrulayın.
3. **Vercel Eski Dağıtım (Deployment) Temizleme Betiği:**
   - 10 GB Deployment Storage[cite: 1] kotasını boşaltmak için `scripts/cleanup-vercel-deployments.mjs` adında, `VERCEL_TOKEN` kullanarak son N (ör. 5) başarılı dağıtım dışındaki eski dağıtımları Vercel REST API üzerinden temizleyen bir bakım aracı ekleyin.

**Kabul Kriteri:** Bozuk veri simülasyonunda mevcut JSON dosyaları korunuyor; `validate_data_files.py`[cite: 1] hatasız geçiyor; veri senkronizasyonu gereksiz Vercel build'i üretmiyor.

---

## GÖREV 8 · Web Push (`src/utils/webPush.ts`) Ölü Abonelik Temizliği ve Supabase `GRANT` İzinleri

### Sorun ve Amaç
1. Push bildirim abonelikleri Supabase ve yedek yapı üzerinde tutuluyor; ancak tarayıcı tarafında iptal edilmiş veya süresi dolmuş abonelikler (`410 Gone` / `404 Not Found`) temizlenmezse her bildirim gönderiminde gereksiz **Fluid Active CPU**[cite: 1] harcanır.
2. Supabase'in güncel Data API kuralları gereği yeni oluşturulan tablolarda otomatik rol izinleri tanımlanmaz; açık `GRANT` ifadeleri gerekir.

### Yapılacaklar
1. **Otomatik `410 Gone` / `404 Not Found` Abonelik Silme:**
   - `src/utils/webPush.ts` dosyasını inceleyin.
   - Bildirim gönderimi sırasında Web Push servisinden `statusCode === 410` veya `statusCode === 404` dönen abonelikleri yakalayın ve gönderim tamamlandığında Supabase tablosundan (ve varsa yedek depodan) tek bir toplu işlemle (`DELETE ... WHERE endpoint IN (...)`) silin.
   - Gönderimlerin tekil hatalarda kırılmaması için `Promise.allSettled` ve yığın (batch) yapısıyla çalıştığını birim testle doğrulayın.
2. **Supabase SQL Migrasyonlarında `GRANT` Kontrolü:**
   - `supabase/` dizinindeki tüm SQL migrasyon dosyalarını ve Görev 6 kapsamında eklenecek yeni tabloları kontrol edin.
   - RLS politikalarının yanı sıra `anon`, `authenticated` ve `service_role` rolleri için gerekli `GRANT SELECT / ALL ON TABLE ...` izinlerinin açıkça tanımlandığından emin olun.

**Kabul Kriteri:** `410 Gone` dönen mock aboneliklerin otomatik silindiğini kanıtlayan Vitest testi eklendi; tüm Supabase migrasyonlarında `GRANT` tanımları tam.

---

## GÖREV 9 · Lig Modülleri Entegrasyonu (`tvf-kadinlar-2-ligi-bot` + Sultanlar Ligi Takvimi + Ortak Şema)

### Sorun ve Amaç
Projede altyapı ligleri, Kadınlar 2. Ligi (`Kadinlar2LigClient.tsx`, `Kadinlar2LigFixtures.tsx`, `data/kadinlar_2_lig.json`)[cite: 1] ve Sultanlar Ligi takvim modülü (`/takvim`)[cite: 1] yer alıyor. Ayrıca `tvf-kadinlar-2-ligi-bot` verileri ve Volleybox eşleştirmeleri (`data/volleybox-mappings.json`)[cite: 1] kullanılıyor.

### Yapılacaklar
1. **Ortak Tip ve Şema Tanımı (`src/types/`):**
   - Farklı lig modüllerinin kullandığı maç (fixture), puan durumu (standing) ve takım eşleştirme (TVF orijinal takma adı / alias ↔ Volleybox profil/slug eşleştirmesi) yapılarını inceleyin.
   - Bileşenler arasındaki veri dönüşümlerini standartlaştıran ortak arayüzleri (`UnifiedFixture`, `UnifiedStanding`, `TeamAliasMapping`) oluşturun; `any` kullanmadan[cite: 1] katı tip güvenliği sağlayın.
2. **TVF Alias Koruma ve Adaptör Testleri:**
   - `Kadinlar2LigClient.tsx`, `Kadinlar2LigFixtures.tsx` ve `/takvim` bileşenlerinin TVF resmi takım adlarını ve Volleybox bağlantılarını veri kaybı olmadan işlediğini doğrulayan birim testleri ekleyin.

**Kabul Kriteri:** `npx tsc --noEmit` 0 hata[cite: 1]; Kadınlar 2. Ligi, Sultanlar Ligi takvimi ve altyapı tabloları ortak tip sözleşmesine uyumlu.

---

## GÖREV 10 · CDN Caching (`/api/fixtures`), Service Worker Prefetch Bekçisi ve Docker/VPS Failover Denetimi

### Yapılacaklar
1. **`/api/fixtures` ve Fast Origin Transfer Koruması:**
   - `src/app/api/fixtures/route.ts` uç noktasında başarılı yanıtlarda kısa süreli CDN önbellekleme başlıklarının (`Cache-Control: public, s-maxage=..., stale-while-revalidate=...`) korunduğunu, hata (`4xx`/`5xx`) durumlarında ise `Cache-Control: no-store` döndüğünü doğrulayan bir bekçi testi ekleyin.
2. **Service Worker (`public/sw.js`) ve Prefetch Döngüsü Bekçisi:**
   - El yazımı `public/sw.js`[cite: 1] dosyasının ve navigasyon `<Link>` bileşenlerinin Opera/Chromium tarayıcılarda arka plan prefetch döngüsü yaratmadığını doğrulayın.
3. **GHCR Yedek Docker İmajı ve `/api/health` Denetimi:**
   - `Dockerfile`, `docker-compose.yml` ve GHCR yedek Docker imajı[cite: 1] yapılandırmasını kontrol edin.
   - `.env.example` dosyasının hem Vercel hem de Docker/VPS ortamı için gereken tüm güncel ortam değişkeni anahtarlarını (gizli değer içermeden) barındırdığını doğrulayın.

**Kabul Kriteri:** `/api/fixtures` önbellek başlıkları testle kilitlenmiş; Docker build ve `.env.example` güncel.

---

## Genel Teslim Tanımı

Her görev için ayrı branch + ayrı PR açın[cite: 1]. PR gövdesinde **ölçüm** olsun (önce/sonra sayıları), çünkü bu projede tüm kararlar kota ölçümlerine dayanıyor[cite: 1]. Her PR'da[cite: 1]:
```
npx tsc --noEmit   -> 0 hata[cite: 1]
npm run lint       -> 0 uyarı[cite: 1]
npx vitest run     -> tümü yeşil (+ eklediğiniz bekçi testleri)[cite: 1]
```
ve mümkünse davranışı **canlı/preview üzerinde** doğrulayın — birim testlerin yakalamadığı iki hata (soft 404, çift marka) ancak böyle bulunmuştu[cite: 1].

### Öncelik Sırası
| # | Görev | Efor | Etki |
|---|---|---|---|
| **1** | **Görev 4:** Tailwind safelist (2 eksik sınıf)[cite: 1] | 30 dk[cite: 1] | ~650 takımın rozet rengi düzelir[cite: 1] |
| **2** | **Görev 1:** PR #38 merge + bekçi testi[cite: 1] | 1-2 saat[cite: 1] | Deployment Storage −%41 (594 MB → 348,6 MB)[cite: 1] |
| **3** | **Görev 3:** Deploy-sonrası smoke testi (`smoke.yml`)[cite: 1] | 2-3 saat[cite: 1] | P0 sınıfı hataların canlıya çıkmasını engeller[cite: 1] |
| **4** | **Görev 2A:** Renk haritasını tembel yükle[cite: 1] | 1-2 saat[cite: 1] | Kritik JS −213 KB (1.885 KB → ≤ 1.650 KB)[cite: 1] |
| **5** | **Görev 5:** `/404` ölü kod + sessiz fallback + sitemap[cite: 1] | 1 saat[cite: 1] | Kod/doküman ve SEO tutarlılığı[cite: 1] |
| **6** | **Görev 7:** Scraper atomik JSON yazımı + Vercel dağıtım temizliği | 1-2 saat | Bozuk veri koruması ve Deployment Storage rahatlaması |
| **7** | **Görev 8:** Web Push `410 Gone` temizliği + Supabase `GRANT` | 1-2 saat | Fluid Active CPU tasarrufu ve DB izin güvenliği |
| **8** | **Görev 2B+2C:** Rengi veriye göm + haritayı küçült[cite: 1] | yarım gün[cite: 1] | Kalıcı çözüm, −%75[cite: 1] |
| **9** | **Görev 9 & 10:** Ortak lig şeması + CDN/SW/Docker bekçileri | yarım gün | Modül standardizasyonu ve failover hazırlığı |
| **10** | **Görev 6:** Supabase okuma yolu, `data/` git'ten çıkar[cite: 1] | birkaç gün[cite: 1] | Repo/deploy/ISR baskısı biter[cite: 1] |

### Yapmayın
- `next/image` kullanmayın (ESLint engeller, kota gerekçesi var)[cite: 1].
- `main`'e doğrudan push etmeyin[cite: 1].
- `revalidate` sürelerini kısaltmayın veya `generateStaticParams`'i doldurmayın — `src/app/__tests__/isr-kota.test.ts` bunu bilerek kilitliyor (Vercel ISR Write kotası)[cite: 1].
- Gerçek veriyi temsil eden bir değere sabit fallback bağlamayın (`|| 4`, `|| 81` ...) — `docs/audit-hardcoded-fallbacks.md` ve `no-silent-fallbacks.test.tsx` bunu kilitliyor[cite: 1].
- `AGENTS.md`'deki "her değişiklikten sonra 81 ili çek" kuralını otomatik adımlarda `--force` ile aşmayın (30 dk cooldown bilinçli; TVF sitelerine 18 thread ile istek atılıyor)[cite: 1].