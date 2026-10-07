#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand).
# Çıkış kodu 0 = derlemeyi ATLA, 1 = derle (Vercel'in ters mantığı).
#
# Uygulama çıktısını etkilemeyen değişikliklerde (dokümantasyon, CI workflow'ları,
# Python scraper/testleri, Supabase migration'ları) yeni deploy açılmaz. Her deploy yeni ve boş bir
# ISR önbelleği demektir; ziyaret edilen her sayfa yeniden üretilip ISR Write tüketir.
#
# NOT: data/ değişiklikleri BİLEREK derlenir. Sayfalar data/*.json dosyalarını derleme paketinden
# okuduğu için veri commit'i deploy edilmezse site eski veriyi göstermeye devam eder. Veri deploy
# sıklığı bunun yerine scrape-sync.yml içindeki DATA_COMMIT_MIN_INTERVAL_HOURS ile sınırlandırılır.
set -u

PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$PREV" ]; then
  echo "Önceki başarılı deploy bilinmiyor; derleniyor."
  exit 1
fi

if ! git cat-file -e "${PREV}^{commit}" 2>/dev/null; then
  echo "Önceki deploy commit'i ($PREV) sığ klonda yok; güvenli tarafta kalıp derleniyor."
  exit 1
fi

if ! CHANGED="$(git diff --name-only "$PREV" HEAD)"; then
  echo "git diff başarısız; derleniyor."
  exit 1
fi

if [ -z "$CHANGED" ]; then
  # Aynı commit'in elle Redeploy'u (ör. ortam değişkeni değişikliği) her zaman derlenmeli.
  echo "Kod değişmedi; elle redeploy kabul edilip derleniyor."
  exit 1
fi

RELEVANT="$(printf '%s\n' "$CHANGED" | grep -vE '^(docs/|tests/|\.github/|supabase/|DEVIR|scripts/.*\.py$|.*\.md$)' || true)"
if [ -z "$RELEVANT" ]; then
  echo "Yalnızca uygulama dışı dosyalar değişti; derleme atlanıyor:"
  printf '  %s\n' $CHANGED
  exit 0
fi

echo "Uygulamayı etkileyen değişiklik var; derleniyor."
exit 1
