# Geliştirme incelemesi

## GitHub yönetici ayarı

`main` dalı için bir ruleset oluşturun: pull request zorunlu olsun, force push ve silme kapalı olsun, CI işinin `CI validation` kontrolü başarılı olmadan birleştirme yapılmasın. Etkin yönetici/bypass istisnalarını kurum politikasına göre sınırlayın. Bu ayarlar depoya bir dosya eklemekle etkinleşmez.

## Veri ve test ayrımı

Birim testleri sabit kaynak snapshot'larını kullanır. `tests/fixtures/cities/istanbul.json`, 5 Kasım 2026 tarihinde resmi kaynağın mevcut parser ile salt okunur sorgulanmasıyla alınmıştır: 144 maç ve 15 puan tablosu. Önceki boş snapshot güncel kaynağı yansıtmıyordu. Ankara ve İzmir test verileri incelenen depo snapshot'ından sabitlenmiştir. Test snapshot'larını saatlik veri taramasının çıktısıyla otomatik değiştirmeyin.

Python testindeki eski profesyonel lig eşleme modülüne bağlı tek test kaldırıldı; modül bu projenin kapsamından çıkarılmıştı. Aynı dosyadaki timestamp ve Git geri yükleme testleri korunmuştur.

## Performans ve görünüm

Ana sayfa günün maçlarının ilk sekizini gösterir; tam liste ayrı sekmededir. Yaklaşan maçlar bugünün listesiyle tekrarlanmaz. Fikstür zaten sayfalama ve büyük şehir listelerinde Virtuoso kullanır; ikinci bir sanallaştırma katmanı eklenmemiştir. Saf sunucu/domain testleri Node ortamına ayrılır; UI testleri jsdom izolasyonunu korur.

Temel koyu/açık tema korunur. Mobil takım adları iki satıra yayılabilir, tek şehir fikstürü açık başlar, maç detayı kullanıcı seçimiyle açılır. Çerez tercihi mobil içerik akışında yer alır; tercihten önce analitik yüklenmez.

## Veritabanı geçişi

`008_authoritative_roles.sql` uygulanmalıdır. Eski RLS yardımcıları JWT metadata rollerini de kabul ediyordu; yeni migration yalnızca `public.user_roles` okur ve `search_path` sabitler. Uygulama da aynı tabloyu kullanır. Canlı Supabase bağlantısı/anahtarı bu ortamda yoktur; migration canlı veritabanına uygulanmış sayılmaz. Önce mevcut yöneticilerin `user_roles` satırları olduğunu doğrulayın; ilk yönetici scripti bu tabloyu kullanır.

## main koruması için veri PR akışı

Gerekli durum kontrolü adı **CI validation** olmalıdır. `build` adı Docker işinde de kullanıldığı için bu kuralda kullanılmaz. Veri toplayıcı, her çalışma için ayrı `automation/tvf-data-<run>-<attempt>` dalı açar ve main'e PR gönderir; doğrudan main push'u ve `[skip ci]` kaldırılmıştır. PR kendiliğinden birleştirilmez.

GITHUB_TOKEN ile açılan PR diğer workflow'ları otomatik tetiklemez. Bu nedenle toplayıcı, CI'ı veri dalı üzerinde `workflow_dispatch` ile açıkça başlatır. Test edilen commit üzerinde `CI validation` kontrolü oluşur. Bunun için toplayıcıya `contents: write`, `pull-requests: write`, `actions: write` verilmiştir; genel repository izinlerini genişletmek gerekmez.

GitHub Settings → Actions → General → Workflow permissions altında **Allow GitHub Actions to create and approve pull requests** açık olmalıdır. Mevcut entegrasyon bu ayarı okuyamadığı için panelden doğrulama gerekir. Hiçbir bypass aktörü eklenmesi gerekmez. Veri PR'ı birleştirildikten sonra Supabase aktarımı `supabase-import.yml` ile yalnızca main üzerinde çalışır; PR oluşturulmadan önce veritabanı güncellenmez.

Kurala `CI validation` eklendikten ve veri botunun PR izni açıldıktan sonra kural Active yapılabilir. Yeni veri PR'ları başarılı kontrolden sonra kullanıcı tarafından birleştirilir; bu akışta otomatik veri toplama sürer, canlıya alma onaylı PR birleştirmesine bağlıdır.
