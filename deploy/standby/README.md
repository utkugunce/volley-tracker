# Yedek barındırma (Vercel duraklatırsa)

Vercel Hobby limitleri aşılıp proje duraklatılırsa site `503 DEPLOYMENT_PAUSED` verir ve
kendiliğinden açılmaz. Bu klasör, siteyi dakikalar içinde bir VPS'e taşımak için gereken her şeyi içerir.

## Neden Cloudflare değil?

Sayfalar ve API'ler `data/*.json` dosyalarını (≈8,5 MB) çalışma anında `fs` ile okuyor.
Cloudflare Workers'ta gerçek dosya sistemi yok ve ücretsiz planda istek başına 10 ms CPU sınırı var;
taşımak büyük bir yeniden yazım gerektirir. Docker imajı ise kodu hiç değiştirmeden her yerde çalışır.

## Her zaman hazır olan

- `main`'e her uygulama/veri değişikliğinde GitHub Actions `ghcr.io/utkugunce/volley-tracker:latest`
  imajını yeniden derler (`.github/workflows/standby-image.yml`). Vercel kotası harcamaz.
- Tek seferlik: GitHub → Settings → Secrets and variables → Actions:
  - Secret `SUPABASE_ANON_KEY` ekle (`SUPABASE_URL` zaten var).
  - İstersen variable `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ekle (push bildirimleri için).
- İlk derlemeden sonra GitHub → Packages → `volley-tracker` → Package settings → görünürlüğü **Public**
  yap; böylece VPS'te `docker login` gerekmez.

## Duraklatma gelirse (≈15 dakika)

1. Küçük bir VPS aç (ör. Hetzner, 2 vCPU / 4 GB, Ubuntu 24.04). Docker'ı kur:
   `curl -fsSL https://get.docker.com | sh`
2. Bu klasörü VPS'e kopyala:
   `git clone --depth 1 https://github.com/utkugunce/volley-tracker && cd volley-tracker/deploy/standby`
3. `cp .env.example .env` ve değerleri Vercel → Settings → Environment Variables'tan doldur.
4. `docker compose up -d`
5. Test: `curl -H "Host: altyapivoleybol.com.tr" http://<VPS_IP>/api/health`
6. DNS: `altyapivoleybol.com.tr` ve `www` için A kaydını VPS IP'sine çevir (TTL'yi önceden 300 sn'ye
   düşürmek geçişi hızlandırır). Caddy, DNS yayılınca HTTPS sertifikasını kendisi alır.

## Notlar

- Veri güncellemeleri: scrape workflow'u `data/` commit'ledikçe yeni imaj derlenir; Watchtower
  15 dakikada bir `:latest` imajını çekip konteyneri yeniler.
- Vercel Analytics / Speed Insights Vercel dışında veri toplamaz; site etkilenmez.
- Vercel Blob (manuel düzeltmeler, push abonelikleri) token ile dışarıdan da çalışır; ancak tüm
  Vercel hesabı askıya alınırsa Blob da erişilemez olabilir. Bu durumda manuel düzeltmeler
  Supabase `manual_overrides` tablosundan okunmaya devam eder.
- Vercel'e dönmek için DNS'i eski kayıtlara geri çevirmek yeterli.
