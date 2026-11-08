# Güvenlik, DDoS ve Maliyet Koruması Kılavuzu

Bu belge; kontrolsüz bot trafiği, Layer 7 DoS saldırıları, kötü niyetli veri kazıyıcılar (scrapers) ve "Vibe-Coding" süreçlerinde ortaya çıkabilecek sürpriz sunucu/bant genişliği faturalarını (**Render / Vercel \$1K fatura riski**) kalıcı olarak önlemek için oluşturulmuştur.

---

## 1. Tehdit Modeli ve Maliyet Riskleri

Modern bulut platformlarında (Render, Vercel, AWS) faturaların aniden patlamasının 3 temel sebebi vardır:

1. **Bant Genişliği Aşımı (Egress Bandwidth):**
   Render veya Vercel'de sunucu planınız sabit ücretli (ör. \$7/ay) olsa dahi, kotayı aşan veri transferi **GB başına ek ücrete** tabidir. Bir bot sürüsü 56 milyon istek attığında, yanıtlar küçük olsa bile terabaytlarca veri çıkar ve binlerce dolarlık fatura oluşturur.
2. **Kontrolsüz Otomatik Ölçekleme (Unbounded Autoscaling):**
   Trafik arttığında sistemin otomatik olarak 1 sunucudan 10-20 sunucuya fırlaması saatlik maliyetleri katlar.
3. **Cache-Buster Saldırıları:**
   Saldırganlar URL sonuna rastgele parametreler (`?rnd=198273`) ekleyerek CDN önbelleğini deler ve her isteğin doğrudan ana sunucuya vurmasını sağlar.

---

## 2. Render Dashboard Güvenlik Ayarları (Hemen Yapılacaklar)

Render kullanıyorsanız aşağıdaki adımları kontrol panelinden tamamlayın:

### A. Autoscaling Tavan Sınırı
1. **Render Dashboard** → İlgili Web Servisinize tıklayın.
2. **Settings** → **Scaling** bölümüne gelin.
3. Eğer Autoscaling açıksa, **Max Instances** değerini maksimum **2** veya **3** olarak sınırlayın. Asla sınırsız veya yüksek değerlerde bırakmayın. (Repo kökündeki `render.yaml` bunu kod seviyesinde `maxInstances: 2` olarak sabitler).

### B. Fatura ve Kota Bildirimleri
1. **Account / Team Settings** → **Billing** sekmesine gidin.
2. E-posta bildirimlerinin açık olduğunu doğrulayın. Ay ortasında kota aşımı riski doğarsa Render'ın gönderdiği uyarıları kaçırmayın.

---

## 3. Cloudflare Entegrasyonu (Ücretsiz Küresel Kalkan)

Render sunucunuzu doğrudan internete açık bırakmak yerine önüne **ücretsiz Cloudflare Proxy** koymak, saldırıların %99'unu sunucunuza dahi ulaşmadan durdurur ve **bant genişliği faturasını sıfırlar**.

### A. DNS Proxy (Turuncu Bulut)
* Alan adınızın DNS kayıtlarını Cloudflare'e yönlendirin.
* Render'a giden `A` veya `CNAME` kaydının yanında **Proxied (Turuncu Bulut)** simgesinin aktif olduğundan emin olun.

### B. Bot Fight Mode Aktivasyonu
* Cloudflare Dashboard → **Security** → **Bots** menüsüne gidin.
* **Bot Fight Mode** anahtarını açın. Bilinen saldırı araçları ve veri kazıyıcılar Render'a ulaşamadan Cloudflare sınırında engellenir.

### C. WAF Rate Limiting Kuralı (Ücretsiz Katman)
* Cloudflare Dashboard → **Security** → **WAF** → **Rate limiting rules** → **Create rule**:
  * **Rule name:** `API Rate Limit`
  * **If incoming requests match:** `URI Path starts with "/api"`
  * **Characteristics:** `IP`
  * **Requests:** `60 requests per 1 minute`
  * **Action:** `Block` (veya `Managed Challenge`)

### D. Önbellek Kuralı (Cache Rules)
* Cloudflare Dashboard → **Caching** → **Cache Rules**:
  * Statik varlıklar ve şehir fikstür sayfaları Cloudflare Edge'de önbelleklenir. Gelen 56 milyon istek Render'a hiç uğramadan Cloudflare CDN üzerinden döner.

---

## 4. Kod Seviyesindeki Korumalar (`src/proxy.ts` & `src/utils/securityGuard.ts`)

Uygulamamız Edge Proxy / Middleware seviyesinde şu korumaları otomatik uygular:

1. **Zararlı Tarayıcı Engelleme (HTTP 403):**
   * `sqlmap`, `nikto`, `wpscan`, `masscan`, `dirbuster`, `gobuster`, `nmap` vb. bilinen zafiyet tarama araçları anında `403 Forbidden` ile kesilir.
2. **Cache-Buster Koruması (HTTP 400):**
   * Önbelleği delmek amacıyla URL'ye eklenen 10'dan fazla sorgu parametresi veya 500 karakterden uzun sorgu dizileri `400 Bad Request` ile reddedilir.
3. **Çok Kademeli Hız Sınırı (HTTP 429):**
   * **Hassas rotalar (`/api/auth/*`, `/api/sync/*`, `/giris`):** IP başına dakikada 15 istek (aşımda 5 dakika blok).
   * **Genel API rotaları (`/api/*`):** IP başına dakikada 60 istek.
   * **Genel Web sayfaları:** IP başına dakikada 180 istek.
   * Aşım durumunda standart `Retry-After` başlığı döndürülür.
4. **Cloudflare `cf-connecting-ip` Desteği:**
   * İstemci IP adresi belirlenirken Cloudflare'in sağladığı gerçek ziyaretçi IP'si öncelikli olarak okunur (`src/utils/rateLimit.ts`).
5. **Bellek Sızıntısı Koruması (Bounded Memory):**
   * Saldırgan milyonlarca sahte IP ile vursa bile in-memory sayaç tablosu `MAX_LOCAL_RECORDS = 5000` ile sınırlıdır; eski kayıtlar otomatik temizlenir ve sunucu belleği (RAM) tükenmez.

---

## 5. AI Agent ve Vibe-Coding İçin Altın Kurallar

1. **Yeni Bir API Eklerken:**
   * Rota mutlaka ya küresel proxy hız sınırından geçmeli ya da `src/utils/rateLimit.ts` üzerinden özel bir `RateLimiter` tanımlanmalıdır.
2. **Veri Değiştiren veya Dış Servis Çağıran İşlemler:**
   * Asla herkese açık ve limitsiz bırakılamaz. Mutlaka Supabase Auth oturumu, `ADMIN_TOKEN` veya `CRON_SECRET` ile korunmalıdır.
3. **Maliyet ve Tavan Sınırları:**
   * Kod değişikliklerinde kontrolsüz dış API çağrısı yapan sonsuz döngüler (`while(true)` veya limitsiz kuyruklar) yazılamaz.
