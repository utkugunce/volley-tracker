# Öneri uygulama kaydı

5 Kasım 2026. Sıra, kullanıcıya verilen 51 maddelik listeyi izler. Bu dosya canlı servis değişikliği veya yayınlama kanıtı değildir.

| No | Uygulama / karar |
|---|---|
| 1 | Varsayılan senkronizasyon parolası kaldırıldı; yapılandırılmamış parola erişim vermez. |
| 2 | Tetikleme ve iptale ayrı istek sınırları ve aynı origin kontrolü eklendi. |
| 3 | Sunucu, istemci ve yeni RLS migration'ı `user_roles` tablosunu esas alır. Migration'ın canlı uygulanması bekliyor. |
| 4 | Rol düşürme, eksik rol, eski metadata ve yetkisiz/sınırlanan senkronizasyon testleri eklendi. |
| 5 | URL sorgusundan token kabulü kaldırıldı. |
| 6 | İstanbul resmi kaynağı salt okunur sorgulandı: 144 maç, 15 puan tablosu. Eski boş snapshot güncel kaynağı yansıtmıyor. Canlı veri importu kod doğrulamasından ayrıdır. |
| 7 | Ortak yükleyici Supabase → yerel skor tamamlaması → manuel düzeltme önceliğini tanımlar. |
| 8 | Dashboard SSR sayfaları ve API ortak yükleyiciye geçirildi. |
| 9 | Sağlık kontrolüne beklenen dosya kapsamı, eksik/eski/gelecek tarihli snapshot denetimi eklendi. |
| 10 | Kaynak yazımında girişim, başarılı okuma ve içerik değişimi ayrı kaydedilir. |
| 11 | Süreç genelindeki veri kaynağı değişkeni kaldırıldı; provenance veri yanıtına taşındı. |
| 12 | Kısmi SSR için sonuç sayacı ayrı hesaplanır; skor sayacıyla karıştırılmaz. |
| 13 | Eski başarısızlıklar veri bağımlılığına indirgenerek sabit snapshot'larla doğrulandı. |
| 14 | İlgili altı domain/API test dosyası sabit şehir snapshot'larını kullanır. |
| 15 | Canlı veri güncelliği ve kapsam kontrolleri test snapshot'larından ayrı kalır. |
| 16 | Kapsam dışına taşınmış profesyonel lig modülünün eski testi kaldırıldı; timestamp/Git testleri korundu. |
| 17 | Tam Python paketi CI'a eklendi. |
| 18 | Uzak erişim hatası, standings-only şehir, yerel skor ve son manuel düzeltme önceliği test edildi. |
| 19 | Ana sayfa, fikstür, puan durumu ve klavye ile maç detayı için Playwright kontrolleri eklendi. |
| 20 | Bağımsız typecheck zorunlu CI adımı olarak korundu. |
| 21 | Mobil ana sayfanın tekrarlanan üst başlığı ve ek filtre şeridi kaldırıldı. |
| 22 | Kulüp daveti küçültüldü, seçim erişimi korundu. |
| 23 | Mobil ana sayfada yinelenen akış filtresi gizlendi; ana ve alt gezinme korundu. |
| 24 | Mobil maç satırında takım adları iki satıra yayılır. |
| 25 | Saat sütunu ve yatay boşluklar mobilde küçültülerek takım adlarına alan açıldı. |
| 26 | Puan durumu başlığı ayrı satıra alındı, ikincil işlemler açılır menüye taşındı. |
| 27 | Çerez tercihi mobilde içerik akışına alındı; maç satırlarını örtmez. |
| 28 | Tarih şeridinin mevcut seçili günü görünür tutma davranışı korundu, seçime erişilebilir durum etiketleri eklendi. |
| 29 | Yaklaşan bölümünden bugün/dün akışında bulunan maçlar çıkarıldı. |
| 30 | Ana sayfa günün ilk sekiz maçını gösterir; tam listeye açık bağlantı eklendi. |
| 31 | Görünmeden yer kaplayan ScrollReveal içeriği başlangıçta da görünür yapıldı. |
| 32 | İki masaüstü paneli açıkken orta sütuna daha fazla genişlik ayrıldı. |
| 33 | Tek şehir fikstürü açık başlar; URL'de maç belirtilmemişse detay kendiliğinden açılmaz. |
| 34 | Saatlik kaynağın ana başlıklarında sürekli canlı skor izlenimi veren ifadeler düzeltildi. |
| 35 | Mevcut açık/koyu tema ve renk kimliği korundu. |
| 36 | Tema metin/yüzey kontrastı tarayıcı doğrulama kapsamına alındı. |
| 37 | Dokunmatik cihazlarda düğmelere minimum 44px dokunma yüksekliği eklendi. |
| 38 | Genel klavye odağı, maç satırı klavye etkileşimi ve mobil dialog odağı/geri dönüşü iyileştirildi. |
| 39 | Bitti / Skor Bekl. metinleri korundu; tarih seçimi aria-pressed ile de bildirilir. |
| 40 | 320/390/1440px, açık/koyu tema ve uzun takım adlarıyla tarayıcı kontrolleri eklendi. |
| 41 | Kısmi SSR verisini hemen tam indirmeye çeviren otomatik istek kaldırıldı; tam veri ihtiyaçta yüklenir. |
| 42 | Mevcut sayfalama ve Virtuoso korundu; ana akış sınırlandı, istemci şehir önbelleğine TTL/boyut sınırı eklendi. |
| 43 | Saf domain/server testleri Node ortamına ayrıldı; UI testleri jsdom izolasyonunu korur. |
| 44 | API'nin veri birleştirme/yükleme, sağlık ve scraper timestamp sorumlulukları ayrı modüllere çıkarıldı. |
| 45 | Veri yolu hata logları kimlik bilgisi içermeyen yapılandırılmış olaylara geçirildi. |
| 46 | Supabase uygulama değişkenleri ile Actions secret eşlemesi belgelendi. |
| 47 | Yüklenen rehber güncellenerek CODEX.md adıyla depoya eklendi; middleware yolu `src/proxy.ts` olarak düzeltildi. |
| 48 | Altyapı senkronizasyon mesajlarından profesyonel lig ifadeleri temizlendi. |
| 49 | README 60 dakika kuralıyla uyumlu hâle getirildi; API'deki örtük --force kaldırıldı. |
| 50 | AGENTS/README kod doğrulamasıyla canlı veri güncellemesini ayıracak şekilde güncellendi. |
| 51 | Özellik dalı ve PR akışı benimsendi, PR şablonu ve dal koruması yönergeleri eklendi. GitHub koruma API erişimi entegrasyona 403 döndürdü; canlı koruma ayarı uygulanmadı. |

Doğrulama sonuçları PR açıklamasında ve görev raporunda ayrıca belirtilir.

## Yerel doğrulama sonucu

- Tam web test çalışması: 116 dosya / 953 test geçti; son menü/başlık düzenlemelerinde ilgili testler ayrıca tekrarlandı.
- Python: 37 test geçti. Typecheck, lint, veri bütünlüğü, şehir listesi ve üretim derlemesi geçti.
- Tarayıcı: 6 senaryo geçti (320/390/1440px, açık/koyu tema, klavye dialog odağı, temel metin/yüzey kontrastı, %200 CSS yakınlaştırma).
- Yeni sağlık ölçümü mevcut snapshot'ta 35 şehir dosyasının 24 saatten eski olduğunu saptıyor ve 503/degraded dönüyor. Bu, dosyalar mevcut diye sağlıklı sayan eski davranışın düzeltilmesidir. Kaynakların gerçekten yeniden okunması ayrı veri güncelleme işlemidir; kod PR'ında üretim JSON verileri veya tarihleri değiştirilmedi.
