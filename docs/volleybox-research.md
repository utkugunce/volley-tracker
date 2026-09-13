# Volleybox.net Ön Araştırma Raporu (Görev 0)

**Tarih:** 14 Eylül 2026  
**Araştırmacı:** AI Pair Programmer / Antigravity  
**Kapsam:** TVF Genç Kızlar Süper Lig (U18) ve Yıldız Kızlar Süper Lig (U16) takımlarının Volleybox.net üzerindeki profil yapısı, URL formatı ve arama yetenekleri.

---

## 1. Genel Yapı ve Alan Adı (Domain) Mimarisi

- **Ana Platform:** Volleybox, erkek ve kadın voleybolu için farklı alt alan adları (subdomains) kullanmaktadır:
  - Erkek Voleybolu: `https://volleybox.net/`
  - Kadın Voleybolu: `https://women.volleybox.net/`
- Projemizdeki ligler **Genç Kızlar (U18)** ve **Yıldız Kızlar (U16)** olduğu için hedef platform doğrudan **`https://women.volleybox.net/`** alt alan adıdır.
- Eğer bir kullanıcı doğrudan ana alan adı üzerinden `https://volleybox.net/<slug>-t<id>` bağlantısına giderse, Volleybox sunucusu `HTTP 301 Moved Permanently` ile `https://women.volleybox.net/<slug>-t<id>` adresine yönlendirme yapmaktadır.

---

## 2. Profil URL Formatı ve Sayfa Yapısı

- **URL Deseni:** `https://women.volleybox.net/<slug>-t<id>`
  - `<slug>`: Kulüp/takım adının URL-dostu hali (küçük harf, tire ile ayrılmış).
  - `-t<id>`: Takım ID'si. `t` harfi ve ardından gelen benzersiz numerik kimlik (Örn: `t19499`, `t2110`).
- **A Takım vs U18 / U16 Ayrımı:**
  - Volleybox'ta yaş kategorileri kulüp ana sayfasında sadece bir sekme ya da filtre **değildir**.
  - U18 ve U16 takımları sistemde **tamamen bağımsız birer takım (`type: "T"`) profili** olarak tutulmaktadır. Kendi ID'leri, kendi güncel/geçmiş kadroları (roster), lig başarıları ve takım sıralamaları mevcuttur.
  - Örnekler:
    - **VakıfBank Profesyonel A Takımı:** `https://women.volleybox.net/vakfbank-t2309` (ID: `T2309`)
    - **VakıfBank U18 (Genç Kız):** `https://women.volleybox.net/vakfbank-u18-t19499` (ID: `T19499`)
    - **VakıfBank U16 (Yıldız Kız):** `https://women.volleybox.net/vakfbank-u17-t37362` (ID: `T37362` - Başlık: *VakıfBank U16*)

---

## 3. Arama ve Otomatik Tamamlama API'si (Search / Autocomplete Endpoint)

Volleybox'ın herkese açık, programatik olarak sorgulanabilen bir arama uç noktası **mevcuttur**:

- **Endpoint:** `POST https://women.volleybox.net/ajax/get_tags_ajax`
- **Gerekli HTTP Başlıkları (Headers):**
  - `User-Agent`: Standart tarayıcı kimliği
  - `X-Requested-With`: `XMLHttpRequest`
- **Form Parametreleri (POST Data):**
  - `query`: Arama yapılacak terim (örn. `"Fenerbahçe"`, `"Eczacıbaşı"`)
  - `mainSearchRequest`: `"1"`
  - `gender`: `"W"` (Kadın kategorisini filtrelemek için)
- **Dönen Veri Yapısı (JSON Array):**
  ```json
  [
    {
      "id": "T27716",
      "name": "Fenerbahçe U18<img ... />",
      "search": "Fenerbahçe U18",
      "desc": "U18 • İstanbul • Turkey",
      "image": "/media/upload/teams/...",
      "type": "T",
      "subtype": "C",
      "link": "https://women.volleybox.net/fenerbahce-u18-t27716"
    }
  ]
  ```
- **Sonuç:** Bu API sayesinde kulüplerin resmi isimleri programatik olarak taranıp insan onayına sunulabilmektedir.

---

## 4. Yaş Kategorisi Eşleşme Analizi (U18 / U16 Taraması)

İstanbul Genç ve Yıldız Kızlar Süper Lig fikstüründe yer alan kulüpler incelenmiştir.

### A) Hem U18 (Genç) Hem U16 (Yıldız) Takımı Bulunan Kulüpler:
Aşağıdaki 17 kulübün Volleybox üzerinde doğrudan ilgili yaş kategorisine ait doğrulanmış bağımsız profilleri mevcuttur:

1. **VakıfBank:**
   - U18: `https://women.volleybox.net/vakfbank-u18-t19499` (T19499)
   - U16: `https://women.volleybox.net/vakfbank-u17-t37362` (T37362)
2. **Fenerbahçe:**
   - U18: `https://women.volleybox.net/fenerbahce-u18-t27716` (T27716)
   - U16: `https://women.volleybox.net/fenerbahce-u16-t41423` (T41423)
3. **Eczacıbaşı:**
   - U18: `https://women.volleybox.net/eczacbas-u18-t10844` (T10844)
   - U16: `https://women.volleybox.net/eczacbas-u17-t39199` (T39199)
4. **Galatasaray:**
   - U18: `https://women.volleybox.net/galatasaray-u18-t36341` (T36341)
   - U16: `https://women.volleybox.net/galatasaray-u16-t41437` (T41437)
5. **Beşiktaş:**
   - U18: `https://women.volleybox.net/besiktas-u18-t12698` (T12698)
   - U16: `https://women.volleybox.net/besiktas-u16-t41475` (T41475)
6. **Türk Hava Yolları (THY):**
   - U18: `https://women.volleybox.net/turk-hava-yollar-sk-u18-t41166` (T41166)
   - U16: `https://women.volleybox.net/turk-hava-yollar-sk-u16-t41413` (T41413)
7. **Bahçelievler Belediyespor:**
   - U18: `https://women.volleybox.net/bahcelievler-belediyespor-u18-t41163` (T41163)
   - U16: `https://women.volleybox.net/bahcelievler-belediyespor-u16-t41433` (T41433)
8. **Beylikdüzü Voleybol 2021 / İhtisas:**
   - U18: `https://women.volleybox.net/beylikduzu-voleybol-2021-u18-t41225` (T41225)
   - U16: `https://women.volleybox.net/beylikduzu-voleybol-htisas-u16-t41470` (T41470)
9. **Eyüpsultan Belediyesi SK:**
   - U18: `https://women.volleybox.net/eyupsultan-belediyesi-sk-u18-t41164` (T41164)
   - U16: `https://women.volleybox.net/eyupsultan-belediyesi-sk-u16-t41639` (T41639)
10. **Yeşilyurt:**
    - U18: `https://women.volleybox.net/yesilyurt-u18-t25963` (T25963)
    - U16: `https://women.volleybox.net/yesilyurt-spor-kulubu-u16-t41646` (T41646)
11. **Sarıyer Belediyesi:**
    - U18: `https://women.volleybox.net/saryer-belediyesi-u20-t15556` (T15556)
    - U16: `https://women.volleybox.net/saryer-belediyesi-u16-t41441` (T41441)
12. **Ümraniye Belediyesi SK:**
    - U18: `https://women.volleybox.net/umraniye-belediyesi-spor-kulubu-u18-t54140` (T54140)
    - U16: `https://women.volleybox.net/umraniye-belediyesi-spor-kulubu-u15-t41050` (T41050)
13. **İstanbul Büyükşehir Belediyesi (İBB):**
    - U18: `https://women.volleybox.net/bb-spor-u18-t30200` (T30200)
    - U16: `https://women.volleybox.net/bb-spor-kulubu-u16-t41641` (T41641)
14. **Es Voleybol:**
    - U18: `https://women.volleybox.net/es-voleybol-u18-t30461` (T30461)
    - U16: `https://women.volleybox.net/es-voleybol-u16-t41476` (T41476)
15. **Marmara Akademi:**
    - U18: `https://women.volleybox.net/mehmet-erdem-marmara-akademi-spor-kulubu-u18-t41165` (T41165)
    - U16: `https://women.volleybox.net/mehmet-erdem-marmara-akademi-spor-kulubu-u16-t41445` (T41445)
16. **Silivri Çağrıbey:**
    - U18: `https://women.volleybox.net/silivri-cagrbey-sk-u18-t54138` (T54138)
    - U16: `https://women.volleybox.net/silivri-cagrbey-sk-u16-t41644` (T41644)
17. **Bizimkent Voleybol:**
    - U18: `https://women.volleybox.net/bizimkent-voleybol-spor-kulubu-u18-t41227` (T41227)
    - U16: `https://women.volleybox.net/bizimkent-voleybol-spor-kulubu-u16-t41638` (T41638)

### B) Diğer Yerel Kulüplerin Durumu:
- **Milan Atletik:** Hem U18 (`t41178`) hem U16 (`t41642`) profili mevcut.
- **Başakşehir Belediyesi:** Hem U18 (`t54179`) hem U16 (`t54146`) profili mevcut.
- **Olimpia 2017:** Hem U18 (`t44653`) hem U16 (`t54144`) profili mevcut.
- **Roberteam (Robert Koleji SK):** Hem U18 (`t41220`) hem U16 (`t54142`) profili mevcut.
- **Tuzla Rekor:** Hem U18 (`t54159`) hem U16 (`t54143`) profili mevcut.
- **Smaç SK:** U16 (`t41645`) mevcut, U18 profili bulunamadı.
- **Güngören Voleybol:** U18 (`t54141`) mevcut, U16 profili bulunamadı.
- **Konak (Sarıyer Konak SK):** U18 (`t41222`) ve U16 (`t41643`) mevcut.

### C) Profiline Ulaşılamayan / Bulunamayan Takımlar:
- **Pegasus:** Volleybox üzerinde sadece Hollanda ve İtalya'daki "Pegasus" takımları mevcuttur; İstanbul yerel ligindeki amatör Pegasus voleybol kulübünün Volleybox kaydı yoktur. *(Eşleştirme yapılmayacaktır).*

---

## 5. Sonuç ve Öneriler (Görev 1 İçin Strateji)

1. Volleybox Türk altyapı liglerini (özellikle İstanbul U18 ve U16 liglerini) şaşırtıcı derecede yüksek oranda (neredeyse %95) ayrı yaş kategorisi sayfalarıyla indekslemiştir.
2. Bu nedenle `club_level_only` (A takımına yönlendirme) durumuna çok nadiren ihtiyaç duyulacaktır; takımların ezici çoğunluğu doğrudan `"confidence": "verified"` ile kendi U18 veya U16 sayfalarına bağlanabilir.
3. Bulunamayan amatör takımlar (örn. Pegasus) için kılavuza sadık kalınarak hiçbir kayıt eklenmeyecek, arayüzde düz metin olarak kalacaktır.
