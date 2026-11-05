# Geliştirme incelemesi

## GitHub yönetici ayarı

`main` dalı için bir ruleset oluşturun: pull request zorunlu olsun, force push ve silme kapalı olsun, CI işinin `build` kontrolü başarılı olmadan birleştirme yapılmasın. Etkin yönetici/bypass istisnalarını kurum politikasına göre sınırlayın. Bu ayarlar depoya bir dosya eklemekle etkinleşmez.

## Veri ve test ayrımı

Birim testleri sabit kaynak snapshot'larını kullanır. `tests/fixtures/cities/istanbul.json`, 5 Kasım 2026 tarihinde resmi kaynağın mevcut parser ile salt okunur sorgulanmasıyla alınmıştır: 144 maç ve 15 puan tablosu. Önceki boş snapshot güncel kaynağı yansıtmıyordu. Ankara ve İzmir test verileri incelenen depo snapshot'ından sabitlenmiştir. Test snapshot'larını saatlik veri taramasının çıktısıyla otomatik değiştirmeyin.

Python testindeki eski profesyonel lig eşleme modülüne bağlı tek test kaldırıldı; modül bu projenin kapsamından çıkarılmıştı. Aynı dosyadaki timestamp ve Git geri yükleme testleri korunmuştur.

## Performans ve görünüm

Ana sayfa günün maçlarının ilk sekizini gösterir; tam liste ayrı sekmededir. Yaklaşan maçlar bugünün listesiyle tekrarlanmaz. Fikstür zaten sayfalama ve büyük şehir listelerinde Virtuoso kullanır; ikinci bir sanallaştırma katmanı eklenmemiştir. Saf sunucu/domain testleri Node ortamına ayrılır; UI testleri jsdom izolasyonunu korur.

Temel koyu/açık tema korunur. Mobil takım adları iki satıra yayılabilir, tek şehir fikstürü açık başlar, maç detayı kullanıcı seçimiyle açılır. Çerez tercihi mobil içerik akışında yer alır; tercihten önce analitik yüklenmez.

## Veritabanı geçişi

`008_authoritative_roles.sql` uygulanmalıdır. Eski RLS yardımcıları JWT metadata rollerini de kabul ediyordu; yeni migration yalnızca `public.user_roles` okur ve `search_path` sabitler. Uygulama da aynı tabloyu kullanır. Canlı Supabase bağlantısı/anahtarı bu ortamda yoktur; migration canlı veritabanına uygulanmış sayılmaz. Önce mevcut yöneticilerin `user_roles` satırları olduğunu doğrulayın; ilk yönetici scripti bu tabloyu kullanır.
