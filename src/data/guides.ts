export interface GuideSection {
  id: string;
  title: string;
  content: string;
  highlights?: string[];
  table?: {
    caption?: string;
    headers: string[];
    rows: string[][];
  };
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface InternalLinkRef {
  title: string;
  url: string;
  description: string;
  badge?: string;
}

export interface GuideArticle {
  slug: string;
  title: string;
  shortTitle: string;
  category: "Kurallar & Statüler" | "Yaş Grupları" | "Şehir Rehberleri" | "Ligler & Turnuvalar";
  categorySlug: "kurallar-statuler" | "yas-gruplari" | "sehir-rehberleri" | "ligler";
  description: string;
  keywords: string[];
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  featured?: boolean;
  summary: string;
  tableOfContents: { id: string; title: string }[];
  sections: GuideSection[];
  faqs: GuideFaq[];
  relatedSlugs: string[];
  internalLinks: InternalLinkRef[];
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "puan-durumu-ve-averaj-hesaplama",
    title: "Voleybolda Puan Durumu ve Averaj Nasıl Hesaplanır?",
    shortTitle: "Puan Durumu ve Averaj",
    category: "Kurallar & Statüler",
    categorySlug: "kurallar-statuler",
    description:
      "TVF ve FIVB voleybol liglerinde puan durumu hesaplama kuralları: 3-2-1-0 puan baremi, set averajı, sayı averajı formülleri ve eşitlik durumları.",
    keywords: [
      "voleybol puan durumu nasıl hesaplanır",
      "voleybol averaj hesaplama",
      "voleybol set averajı",
      "voleybol sayı averajı formülü",
      "tvf puanlama sistemi",
      "3-2-1-0 puan baremi voleybol",
    ],
    readTime: "5 dk okuma",
    publishedAt: "2026-10-15",
    updatedAt: "2026-10-27",
    featured: true,
    summary:
      "Voleybolda puan durumu yalnızca galibiyete göre belirlenmez; set skoruna göre 3, 2 veya 1 puan kazanılır. Puan eşitliğinde sırasıyla galibiyet sayısı, set averajı ve sayı averajı devreye girer.",
    tableOfContents: [
      { id: "puan-baremi", title: "1. 3-2-1-0 Puanlama Sistemi" },
      { id: "set-averaji", title: "2. Set Averajı Nedir ve Nasıl Hesaplanır?" },
      { id: "sayi-averaji", title: "3. Sayı Averajı (Katsayı) Hesabı" },
      { id: "siralama-kriterleri", title: "4. Eşitlik Durumunda Sıralama Önceliği" },
      { id: "hukmen-maclar", title: "5. Hükmen Mağlubiyet ve İhraç Kuralları" },
    ],
    sections: [
      {
        id: "puan-baremi",
        title: "1. 3-2-1-0 Puanlama Sistemi",
        content:
          "Türkiye Voleybol Federasyonu (TVF) ve uluslararası voleybol standartlarında (FIVB) maçlar sonucunda takımlara verilen puanlar, maçın neticesine ve bitiş setine göre değişir. Futbol veya basketboldan farklı olarak voleybolda 3-2 biten bir maçta kaybeden takım da puanla ödüllendirilir.",
        highlights: [
          "3-0 veya 3-1 Galibiyet: Kazanan takıma 3 Puan, kaybedene 0 Puan.",
          "3-2 Galibiyet: Kazanan takıma 2 Puan, kaybedene 1 Puan.",
          "Hükmen Mağlubiyet: Sahaya çıkmayan takıma 0 Puan ve (-1) Puan ceza, rakibe 3 Puan (setler 3-0, sayılar 25-0, 25-0, 25-0).",
        ],
        table: {
          caption: "TVF Resmi Maç Sonucu Puan Dağılım Tablosu",
          headers: ["Maç Skoru", "Galip Takım Puanı", "Mağlup Takım Puanı", "Not"],
          rows: [
            ["3 - 0", "3 Puan", "0 Puan", "Net Galibiyet"],
            ["3 - 1", "3 Puan", "0 Puan", "Net Galibiyet"],
            ["3 - 2", "2 Puan", "1 Puan", "Tie-break Galibiyeti"],
            ["2 - 3", "1 Puan", "2 Puan", "Tie-break Mağlubiyeti (Teselli Puanı)"],
            ["1 - 3", "0 Puan", "3 Puan", "Puan Verilmez"],
            ["0 - 3", "0 Puan", "3 Puan", "Puan Verilmez"],
          ],
        },
      },
      {
        id: "set-averaji",
        title: "2. Set Averajı Nedir ve Nasıl Hesaplanır?",
        content:
          "Voleybolda set averajı, bir takımın lig boyunca kazandığı toplam set sayısının, kaybettiği toplam set sayısına bölünmesiyle elde edilen katsayıdır (oran). Çıkarma işlemiyle değil, bölme işlemiyle hesaplanır.",
        highlights: [
          "Formül: Set Averajı = Alınan Set / Verilen Set",
          "Örnek: Bir takım 30 set kazanıp 10 set kaybetmişse Set Averajı = 30 / 10 = 3.000'dir.",
          "Hiç set kaybetmeyen takımın katsayısı sonsuz (∞) kabul edilir ve en üstte yer alır.",
        ],
      },
      {
        id: "sayi-averaji",
        title: "3. Sayı Averajı (Katsayı) Hesabı",
        content:
          "Set averajları da eşit olan takımlar arasında 'Sayı Averajı' (Rally Ratio) incelenir. Tıpkı set averajında olduğu gibi, kazanılan toplam sayıların kaybedilen toplam sayılara bölünmesiyle bulunur.",
        highlights: [
          "Formül: Sayı Averajı = Kazanılan Toplam Sayı / Kaybedilen Toplam Sayı",
          "Katsayı virgülden sonra en az 4 hane olarak değerlendirilir (Örn: 1.1524).",
          "Sayı averajı yüksek olan takım puan cetvelinde üst sırada yer alır.",
        ],
      },
      {
        id: "siralama-kriterleri",
        title: "4. Eşitlik Durumunda Sıralama Önceliği",
        content:
          "TVF Lig Talimatı ve Müsabaka Yönetmeliği'ne göre lig aşaması tamamlandığında takımların sıralaması şu hiyerarşik önceliğe göre belirlenir:",
        highlights: [
          "1. Öncelik - Toplam Galibiyet Sayısı: En çok maç kazanan takım üstte yer alır.",
          "2. Öncelik - Toplam Puan: Galibiyet sayıları eşitse toplanan puanlara bakılır.",
          "3. Öncelik - Set Averajı: Puanlar da eşitse Alınan Set / Verilen Set katsayısı yüksek olan öne geçer.",
          "4. Öncelik - Sayı Averajı: Set katsayıları eşitse Kazanılan Sayı / Kaybedilen Sayı oranı uygulanır.",
          "5. Öncelik - İkili Karşılaşmalar: Her şey eşitse iki takımın aralarında oynadığı maçlardaki galibiyet ve set üstünlüğüne bakılır.",
        ],
      },
      {
        id: "hukmen-maclar",
        title: "5. Hükmen Mağlubiyet ve İhraç Kuralları",
        content:
          "Müsabaka saatinde geçerli bir mazeret olmaksızın sahada asgari oyuncu sayısıyla yer almayan ya da cezalı sporcu oynatan kulüpler hükmen mağlup sayılır. Hükmen mağlubiyet durumunda takım puan cetvelinde 1 puan silinme cezası alır ve rakip takım 3-0 (25-0, 25-0, 25-0) galip tescil edilir. Aynı sezon içinde iki kez mazeretsiz maça çıkmayan takım ligden ihraç edilir.",
      },
    ],
    faqs: [
      {
        question: "Voleybolda 3-2 biten maçta puanlar nasıl paylaşılır?",
        answer:
          "Maçı 3-2 kazanan takım 2 puan alırken, 2 set alıp maçı tie-break setinde kaybeden takım 1 puan (teselli puanı) kazanır.",
      },
      {
        question: "Puan durumunda iki takımın puanı eşitse averaja mı bakılır galibiyete mi?",
        answer:
          "TVF resmi talimatlarına göre ilk önce toplam galibiyet sayısına bakılır. Galibiyet sayısı eşit olan takımlarda toplam puan, ardından set averajı ve sayı averajı dikkate alınır.",
      },
      {
        question: "Set averajı eksiye düşebilir mi?",
        answer:
          "Hayır, voleybolda averaj çıkarma yöntemiyle değil bölme yöntemiyle hesaplandığı için set averajı eksiye düşmez; her zaman pozitif bir katsayıdır.",
      },
    ],
    relatedSlugs: ["tvf-altyapi-yas-kategorileri-ve-kurallari", "turkiye-sampiyonasi-statu-ve-finaller", "kadinlar-2-lig-statu-ve-playoff"],
    internalLinks: [
      {
        title: "Canlı Altyapı Puan Durumu",
        url: "/puan-durumu",
        description: "81 ilin resmi TVF altyapı liglerindeki güncel puan cetvellerini görüntüleyin.",
        badge: "Canlı Tablolar",
      },
      {
        title: "Grup ve Sıralama Durumu",
        url: "/grup-durumu",
        description: "Tüm il ve lig kategorilerindeki grup içi sıralamaları ve averajları karşılaştırın.",
        badge: "Analiz",
      },
    ],
  },
  {
    slug: "tvf-altyapi-yas-kategorileri-ve-kurallari",
    title: "2026-2027 TVF Altyapı Voleybol Yaş Grupları ve Kuralları",
    shortTitle: "Yaş Grupları ve Kurallar",
    category: "Yaş Grupları",
    categorySlug: "yas-gruplari",
    description:
      "2026-2027 sezonu resmi TVF voleybol yaş kategorileri: Mini, Midi, Küçük, Yıldız ve Genç kategorilerinin doğum yılları, file yükseklikleri, top ölçüleri ve libero kuralları.",
    keywords: [
      "voleybol yaş grupları 2026",
      "mini voleybol doğum yılı",
      "midi voleybol kaç yaş",
      "küçük kızlar voleybol doğum yılı",
      "yıldız kızlar voleybol yaş grubu",
      "voleybol file yükseklikleri",
      "midi voleybolda libero oynar mı",
    ],
    readTime: "6 dk okuma",
    publishedAt: "2026-10-18",
    updatedAt: "2026-10-27",
    featured: true,
    summary:
      "TVF altyapı liglerinde kategoriler doğum yılına göre belirlenir. Mini, Midi, Küçük, Yıldız ve Genç yaş kategorilerinde file boyları, top numaraları ve libero izinleri kademeli olarak yetişkin voleyboluna evrilir.",
    tableOfContents: [
      { id: "dogum-yillari", title: "1. 2026-2027 Resmi Doğum Yılları Tablosu" },
      { id: "file-yukseklikleri", title: "2. Kategoriye Göre File Yükseklikleri" },
      { id: "libero-kurallari", title: "3. Libero Kuralı Hangi Yaşta Başlar?" },
      { id: "top-ozellikleri", title: "4. Resmi Top Boyutları ve Ağırlıkları" },
      { id: "ust-kategoride-oynama", title: "5. Üst Yaş Kategorisinde Oynama Şartları" },
    ],
    sections: [
      {
        id: "dogum-yillari",
        title: "1. 2026-2027 Resmi Doğum Yılları Tablosu",
        content:
          "Türkiye Voleybol Federasyonu Altyapı Ligleri Yönergesi gereğince, sporcuların lisans kategorisi gün ve aya bakılmaksızın doğum yılı esasına göre tescil edilir.",
        highlights: [
          "Mini Voleybol: 2016 - 2017 doğumlu sporcular.",
          "Midi Voleybol: 2014 - 2015 doğumlu sporcular.",
          "Küçükler Kategorisi: 2012 - 2013 doğumlu sporcular.",
          "Yıldızlar Kategorisi: 2010 - 2011 doğumlu sporcular.",
          "Gençler Kategorisi: 2008 - 2009 doğumlu sporcular.",
        ],
        table: {
          caption: "2026-2027 Sezonu TVF Yaş Kategorisi Eşleştirme Tablosu",
          headers: ["Kategori", "Doğum Yılları", "Yaş Aralığı", "Libero İzni", "File Boyu (Kız/Erkek)"],
          rows: [
            ["Mini Voleybol", "2016 - 2017", "9 - 10 Yaş", "YASAK", "2.00 m / 2.00 m"],
            ["Midi Voleybol", "2014 - 2015", "11 - 12 Yaş", "YASAK", "2.10 m / 2.15 m"],
            ["Küçükler", "2012 - 2013", "13 - 14 Yaş", "SERBEST (İsteğe Bağlı)", "2.15 m / 2.24 m"],
            ["Yıldızlar", "2010 - 2011", "15 - 16 Yaş", "SERBEST", "2.24 m / 2.35 m"],
            ["Gençler", "2008 - 2009", "17 - 18 Yaş", "SERBEST", "2.24 m / 2.43 m"],
          ],
        },
      },
      {
        id: "file-yukseklikleri",
        title: "2. Kategoriye Göre File Yükseklikleri",
        content:
          "Farklı yaş gruplarının fiziksel gelişimine uygun olarak resmi file yükseklikleri kademeli olarak yükseltilir. Nizami file yüksekliği filenin ortasından ölçülür; kenarlardaki yükseklik ortadaki yükseklikten en fazla 2 cm fazla olabilir.",
        highlights: [
          "Mini Voleybol: 2.00 m (Kız ve Erkek ortak)",
          "Midi Kızlar: 2.10 m | Midi Erkekler: 2.15 m",
          "Küçük Kızlar: 2.15 m | Küçük Erkekler: 2.24 m",
          "Yıldız Kızlar: 2.24 m | Yıldız Erkekler: 2.35 m",
          "Genç Kızlar: 2.24 m | Genç Erkekler: 2.43 m (FIVB Yetişkin Standardı)",
        ],
      },
      {
        id: "libero-kurallari",
        title: "3. Libero Kuralı Hangi Yaşta Başlar?",
        content:
          "TVF sporcuların erken yaşta tek bir mevkide kısıtlanmasını önlemek ve tüm temel voleybol becerilerini (servis, manşet, smaç, pas, savunma) eksiksiz kazanmalarını sağlamak amacıyla Mini ve Midi voleybol kategorilerinde libero kullanımını kesin olarak yasaklamıştır.",
        highlights: [
          "Midi Voleybolda libero oynatılması durumunda takım hükmen mağlup sayılır.",
          "Küçükler kategorisinden (13-14 yaş) itibaren libero oyuncu kaydı serbesttir.",
          "Yıldız ve Genç kategorilerinde ise uluslararası FIVB libero protokolleri (çift libero dahil) geçerlidir.",
        ],
      },
      {
        id: "top-ozellikleri",
        title: "4. Resmi Top Boyutları ve Ağırlıkları",
        content:
          "Gelişim çağındaki sporcuların omuz ve bilek sağlığını korumak için top boyutları ve hava basınçları sınırlandırılmıştır. Mini ve Midi voleybol müsabakalarında 4 numara hafifletilmiş toplar kullanılırken; Küçükler, Yıldızlar ve Gençlerde 5 numara standart maç topu kullanılır.",
      },
      {
        id: "ust-kategoride-oynama",
        title: "5. Üst Yaş Kategorisinde Oynama Şartları",
        content:
          "Bir sporcu kendi yaş kategorisinde kulüp kadrosunda yer alırken, kulübün üst yaş kategorisindeki takımlarında da resmi maç kadrosuna girebilir. Ancak alt yaş kategorisinde oynaması kesinlikle yasaktır ve tespiti halinde müsabaka hükmen tescil edilir.",
      },
    ],
    faqs: [
      {
        question: "2014 doğumlu bir voleybolcu hangi kategoride oynar?",
        answer: "2026-2027 sezonunda 2014 doğumlu sporcular Midi Voleybol kategorisinde mücadele eder.",
      },
      {
        question: "Midi voleybol maçında libero sahaya çıkabilir mi?",
        answer: "Hayır. TVF talimatları gereği Midi voleybolda libero kuralı uygulanmaz; her sporcu 6 pozisyonda da dönüşümlü oynamalıdır.",
      },
      {
        question: "Küçük takım sporcusu Genç takım maçında forma giyebilir mi?",
        answer: "Evet. Lisanslı bir sporcu kulübünün izni ve sağlık yeterliliği doğrultusunda üst yaş kategorilerinde forma giyebilir.",
      },
    ],
    relatedSlugs: ["puan-durumu-ve-averaj-hesaplama", "voleybol-lisansi-nasil-cikarilir", "turkiye-sampiyonasi-statu-ve-finaller"],
    internalLinks: [
      {
        title: "Çocuğum Hangi Ligde Oynar? (Hesaplayıcı)",
        url: "/hangi-ligde-oynar",
        description: "Doğum yılı ve cinsiyet seçerek saniyeler içinde resmi lig kategorisini ve kurallarını öğrenin.",
        badge: "İnteraktif Araç",
      },
      {
        title: "81 İl Kulüpler Dizini",
        url: "/kulupler",
        description: "İl ve ilçenizdeki resmi TVF tescilli altyapı kulüplerini inceleyin.",
        badge: "Kulüpler",
      },
    ],
  },
  {
    slug: "turkiye-sampiyonasi-statu-ve-finaller",
    title: "TVF Altyapı Türkiye Şampiyonası Statüsü ve Final Aşamaları",
    shortTitle: "Türkiye Şampiyonası Statüsü",
    category: "Ligler & Turnuvalar",
    categorySlug: "ligler",
    description:
      "TVF altyapı liglerinde il birinciliklerinden Türkiye Şampiyonası Finallerine giden yol: Festival Voleybol, yarı finaller, grup etapları ve kontenjan belirleme sistemi.",
    keywords: [
      "tvf altyapı türkiye şampiyonası statüsü",
      "voleybol altyapı türkiye finalleri",
      "festival voleybol nedir",
      "yıldız kızlar türkiye şampiyonası",
      "genç kızlar türkiye finalleri nerede",
      "altyapı il kontenjanları nasıl belirlenir",
    ],
    readTime: "5 dk okuma",
    publishedAt: "2026-10-20",
    updatedAt: "2026-10-27",
    featured: true,
    summary:
      "Her sezon 81 ilde düzenlenen yerel liglerin ardından en başarılı kulüpler, TVF Türkiye Şampiyonası Grup, Yarı Final ve Final aşamalarında Türkiye'nin en iyisi olmak için parkeye çıkar.",
    tableOfContents: [
      { id: "il-birinciligi", title: "1. İl Birinciliği Etabı ve Sıralama" },
      { id: "il-kontenjanlari", title: "2. İl Kontenjanları Nasıl Belirlenir?" },
      { id: "grup-yari-final", title: "3. Grup ve Yarı Final Müsabakaları" },
      { id: "festival-voleybol", title: "4. Festival Voleybol Konsepti (Midi & Küçük)" },
      { id: "turkiye-finalleri", title: "5. Türkiye Şampiyonası Finalleri (Yıldız & Genç)" },
    ],
    sections: [
      {
        id: "il-birinciligi",
        title: "1. İl Birinciliği Etabı ve Sıralama",
        content:
          "Her ilin TVF İl Temsilciliği tarafından düzenlenen yerel ligler, genellikle Ekim-Mart ayları arasında oynanır. Normal sezon ve play-off turlarının ardından il şampiyonu ve dereceye giren takımlar ilan edilir.",
        highlights: [
          "İl liglerinde TVF resmi hakemleri ve il gözlemcileri görev yapar.",
          "Müsabakalar sonucunda federasyonun o ile tanıdığı kontenjan sayısı kadar takım bir sonraki tura katılma hakkı kazanır.",
        ],
      },
      {
        id: "il-kontenjanlari",
        title: "2. İl Kontenjanları Nasıl Belirlenir?",
        content:
          "İllerin Türkiye Şampiyonası yarı finallerine veya finallerine kaç takımla katılacağı TVF Altyapı Talimatı ile belirlenir. Bu kontenjanlar ildeki aktif kulüp ve takım sayısına ve o il takımlarının geçmiş sezonlardaki Türkiye derecelerine göre puanlanarak tahsis edilir.",
        highlights: [
          "İstanbul, Ankara, İzmir ve Bursa gibi yüksek takım sayısına sahip iller birden fazla kontenjana sahiptir.",
          "Doğu ve Güneydoğu illeri bölgesel grup merkezlerinde karşılaşarak yarı final hakkı elde eder.",
        ],
      },
      {
        id: "grup-yari-final",
        title: "3. Grup ve Yarı Final Müsabakaları",
        content:
          "Doğrudan finallere katılım hakkı olmayan illerin birincileri, TVF tarafından belirlenen tarafsız grup merkezlerinde toplanır. 4'erli veya 6'şarlı gruplar halinde tek devreli lig usulü oynanan maçlar sonucunda grup birincileri yarı finale veya finallere yükselir.",
      },
      {
        id: "festival-voleybol",
        title: "4. Festival Voleybol Konsepti (Midi & Küçük)",
        content:
          "Midi ve Küçükler kategorilerinde TVF, Türkiye finallerini dev bir şenlik havasında 'Festival Voleybol' adı altında organize eder. Onlarca ilin yüzlerce genç sporcusu aynı salonda ve fuar merkezlerinde kurulan çoklu kortlarda spor ahlakı ve kardeşlik ruhuyla mücadele eder.",
      },
      {
        id: "turkiye-finalleri",
        title: "5. Türkiye Şampiyonası Finalleri (Yıldız & Genç)",
        content:
          "Yıldızlar ve Gençler kategorilerinde finaller 16 veya 32 takımın katılımıyla düzenlenir. 4 grupta tek devre oynanan maçların ardından çapraz eşleşmeler, çeyrek final, yarı final ve final müsabakalarıyla Türkiye Şampiyonu belirlenir.",
      },
    ],
    faqs: [
      {
        question: "Bir ilden Türkiye finallerine kaç takım katılabilir?",
        answer:
          "Takım sayısı ildeki kulüp popülasyonuna göre değişir. İstanbul'dan 4-6 takım doğrudan gidebilirken, daha küçük iller grup müsabakalarından geçerek katılır.",
      },
      {
        question: "Festival Voleybol hangi kategoriler için düzenlenir?",
        answer:
          "Geleneksel olarak Midi Kız/Erkek ve Küçük Kız/Erkek yaş kategorileri için Festival Voleybol formatı uygulanmaktadır.",
      },
    ],
    relatedSlugs: ["tvf-altyapi-yas-kategorileri-ve-kurallari", "puan-durumu-ve-averaj-hesaplama", "istanbul-voleybol-altyapi-ligleri-rehberi"],
    internalLinks: [
      {
        title: "Lig İstatistikleri ve Liderler",
        url: "/istatistikler",
        description: "En skorer kulüpleri ve yaş kategorilerine göre averaj liderlerini inceleyin.",
        badge: "İstatistikler",
      },
      {
        title: "Fikstür ve Maç Takvimi",
        url: "/fikstur",
        description: "Devam eden yerel lig maçlarının salon, tarih ve saat bilgilerine ulaşın.",
        badge: "Fikstür",
      },
    ],
  },
  {
    slug: "kadinlar-2-lig-statu-ve-playoff",
    title: "TVF Kadınlar 2. Ligi Statüsü, Play-Off ve Finallere Yükselme Sistemi",
    shortTitle: "Kadınlar 2. Lig Statüsü",
    category: "Ligler & Turnuvalar",
    categorySlug: "ligler",
    description:
      "TVF Kadınlar 2. Voleybol Ligi statüsü: 16 grup, çeyrek final ve yarı final etabı, finallerden Kadınlar 1. Ligi'ne yükselen 4 kulübün belirlenme süreci.",
    keywords: [
      "tvf kadınlar 2 lig statüsü",
      "kadınlar 2 lig play off nasıl oynanır",
      "kadınlar 2 lig çeyrek final grupları",
      "1 lige yükselme maçları voleybol",
      "kadınlar 2 lig küme düşme",
    ],
    readTime: "5 dk okuma",
    publishedAt: "2026-10-22",
    updatedAt: "2026-10-27",
    featured: true,
    summary:
      "Türkiye'nin 16 grubunda 160'tan fazla kulübün yer aldığı devasa Kadınlar 2. Ligi'nde normal sezon, çeyrek final, yarı final ve final etaplarıyla Kadınlar 1. Ligi'ne çıkacak 4 takım belirlenir.",
    tableOfContents: [
      { id: "lig-yapisi", title: "1. 16 Gruplu Normal Sezon Yapısı" },
      { id: "ceyrek-final", title: "2. Çeyrek Final Kuraları ve Eşleşmeler" },
      { id: "yari-final", title: "3. Yarı Final Aşaması" },
      { id: "final-etabi", title: "4. Final Etabı ve 1. Lig'e Yükselen 4 Takım" },
      { id: "kume-dusme", title: "5. Küme Düşme Baremleri" },
    ],
    sections: [
      {
        id: "lig-yapisi",
        title: "1. 16 Gruplu Normal Sezon Yapısı",
        content:
          "TVF Kadınlar 2. Ligi coğrafi yakınlık esasına göre 16 gruba ayrılmıştır. Gruplarda çift devreli deplasmanlı lig usulü uygulanır. Normal sezon sonunda gruplarında ilk 2 sırayı alan takımlar Çeyrek Final oynamaya hak kazanır.",
        highlights: [
          "Toplam 16 Grup ve 160'ın üzerinde aktif kadın voleybol kulübü mücadele eder.",
          "Grup 1. ve 2.'leri olmak üzere toplam 32 takım Çeyrek Final etabına yükselir.",
        ],
      },
      {
        id: "ceyrek-final",
        title: "2. Çeyrek Final Kuraları ve Eşleşmeler",
        content:
          "Çeyrek finale kalan 32 takım, TVF tarafından kura çekimiyle 4'erli 8 gruba ayrılır. Federasyonca belirlenen tarafsız illerde tek devreli lig usulü turnuva maçları oynanır. Gruplarında 1. ve 2. olan 16 takım Yarı Final etabına yükselir.",
      },
      {
        id: "yari-final",
        title: "3. Yarı Final Aşaması",
        content:
          "Yarı finale yükselen 16 takım 4'erli 4 gruba dağıtılır. Tarafsız merkezde 3 gün süren tek devreli müsabakalar sonucunda gruplarında ilk ikiye giren 8 takım Türkiye Final Etabına adını yazdırır.",
      },
      {
        id: "final-etabi",
        title: "4. Final Etabı ve 1. Lig'e Yükselen 4 Takım",
        content:
          "Final etabı 4'erli 2 grup halinde oynanır (1. Grup ve 2. Grup). Tek devreli lig maçları sonunda her iki grubun 1. ve 2. sıralarını elde eden toplam 4 kulüp, bir sonraki sezon TVF Kadınlar 1. Ligi'nde mücadele etme hakkı kazanır.",
      },
      {
        id: "kume-dusme",
        title: "5. Küme Düşme Baremleri",
        content:
          "Gruplarında son sıralarda yer alan takımlar yerel il mahalli liglerine düşer. İki maça mazeretsiz çıkmayan veya ligden çekilen kulüpler doğrudan düşürülür.",
      },
    ],
    faqs: [
      {
        question: "Kadınlar 2. Ligi'nden 1. Lig'e kaç takım yükselir?",
        answer: "Final etabı sonunda her iki final grubunun ilk iki sırasını alan toplam 4 takım Kadınlar 1. Ligi'ne yükselir.",
      },
      {
        question: "Kadınlar 2. Ligi'nde maçlar nerede oynanır?",
        answer: "Normal sezon maçları kulüplerin kendi salonlarında ev sahibi/deplasman usulü, play-off etapları ise TVF'nin belirlediği tarafsız şehir merkezlerinde oynanır.",
      },
    ],
    relatedSlugs: ["puan-durumu-ve-averaj-hesaplama", "tvf-altyapi-yas-kategorileri-ve-kurallari", "istanbul-voleybol-altyapi-ligleri-rehberi"],
    internalLinks: [
      {
        title: "Kadınlar 2. Ligi Özel Portalı",
        url: "/kadinlar-2-ligi",
        description: "16 grup, puan durumları, fikstür ve sonuçların tamamı tek ekranda.",
        badge: "K2 Portalı",
      },
      {
        title: "Kadınlar 2. Lig Resmi Statü Sayfası",
        url: "/kadinlar-2-ligi/statu",
        description: "Federasyonun güncel resmi talimat metni ve yükselme şeması.",
        badge: "Resmi Statü",
      },
    ],
  },
  {
    slug: "voleybol-lisansi-nasil-cikarilir",
    title: "Voleybol Lisansı Nasıl Çıkarılır? Kulüp ve Okul Lisansı Rehberi",
    shortTitle: "Voleybol Lisansı Çıkarma",
    category: "Kurallar & Statüler",
    categorySlug: "kurallar-statuler",
    description:
      "Voleybol lisansı çıkarma şartları, sağlık raporu (Ek-5), veli izin belgesi, e-Devlet spor bilgi sistemi başvurusu ve kulüp tescil işlemleri kılavuzu.",
    keywords: [
      "voleybol lisansı nasıl çıkarılır",
      "tvf lisans evrakları",
      "voleybol sağlık raporu ek 5",
      "kulüp voleybol lisansı çıkarma",
      "voleybol veli izin belgesi",
      "e devlet sporcu lisansı başvurusu",
    ],
    readTime: "4 dk okuma",
    publishedAt: "2026-10-19",
    updatedAt: "2026-10-27",
    featured: false,
    summary:
      "Voleybol liglerinde forma giyebilmek için resmi sporcu lisansı şarttır. Kulüp lisansı ve okul sporları lisansı farklıdır; TVF resmi kulüp liglerinde yalnızca kulüp lisansı geçerlidir.",
    tableOfContents: [
      { id: "lisans-turleri", title: "1. Kulüp Lisansı ile Okul Lisansı Arasındaki Fark" },
      { id: "gerekli-evraklar", title: "2. Lisans İçin Gerekli Resmi Belgeler" },
      { id: "saglik-raporu", title: "3. Sağlık Raporu (Ek-5 Formu)" },
      { id: "e-devlet-basvuru", title: "4. e-Devlet Spor Bilgi Sistemi Üzerinden Süreç" },
      { id: "vize-yenileme", title: "5. Sezonluk Lisans Vize Yenileme" },
    ],
    sections: [
      {
        id: "lisans-turleri",
        title: "1. Kulüp Lisansı ile Okul Lisansı Arasındaki Fark",
        content:
          "Sporcuların sıklıkla karıştırdığı en önemli konu kulüp ve okul lisanslarıdır. Okul sporları lisansı yalnızca Gençlik ve Spor Bakanlığı Okul Sporları müsabakalarında geçerlidir. TVF'nin düzenlediği hiçbir il altyapı liginde okul lisansıyla maça çıkılamaz; kulüp lisansı tescil edilmelidir.",
      },
      {
        id: "gerekli-evraklar",
        title: "2. Lisans İçin Gerekli Resmi Belgeler",
        content: "İlk kez kulüp lisansı çıkaracak bir voleybolcunun hazırlaması gereken evraklar şunlardır:",
        highlights: [
          "Sağlık Raporu (Spor Yapmaya Uygundur ibareli Ek-5 belgesi).",
          "Veli İzin Belgesi (18 yaşından küçük sporcular için noter veya kulüp huzurunda imzalı).",
          "Kulüp Tescil Fişi (Kulüp yetkilisi ve sporcu/veli tarafından imzalanmış 2 nüsha).",
          "2 Adet Biyometrik veya Vesikalık Fotoğraf (Son 6 ayda çekilmiş).",
          "T.C. Kimlik Kartı Aslı ve Fotokopisi.",
        ],
      },
      {
        id: "saglik-raporu",
        title: "3. Sağlık Raporu (Ek-5 Formu)",
        content:
          "Aile hekimliklerinden veya tam teşekküllü hastanelerden temin edilir. Raporda hekim kaşesi ve 'Voleybol spor dalında müsabakalara katılmasında sakınca yoktur' onayının bulunması zorunludur.",
      },
      {
        id: "e-devlet-basvuru",
        title: "4. e-Devlet Spor Bilgi Sistemi Üzerinden Süreç",
        content:
          "Veli, e-Devlet kapısı üzerinden Gençlik ve Spor Bakanlığı Spor Bilgi Sistemi'ne giriş yaparak 'Veli İzin İşlemleri' menüsünden çocuğunun ilgili voleybol kulübüne tesciline dijital onay vermelidir.",
      },
      {
        id: "vize-yenileme",
        title: "5. Sezonluk Lisans Vize Yenileme",
        content:
          "Kulüp lisansları her sezon başında yenilenir. Vize işlemi için güncel sağlık raporu ve federasyon vize bedelinin yatırılması gerekir.",
      },
    ],
    faqs: [
      {
        question: "Voleybol lisansı kaç yaşında çıkarılabilir?",
        answer: "Mini voleybol kategorisinden itibaren (9-10 yaş) sporculara kulüp lisansı tescil edilebilir.",
      },
      {
        question: "Bir sporcu aynı anda iki farklı voleybol kulübünde lisanslı olabilir mi?",
        answer: "Hayır. Bir sporcunun aynı sezonda yalnızca bir TVF kulübünde aktif lisansı bulunabilir.",
      },
    ],
    relatedSlugs: ["tvf-altyapi-yas-kategorileri-ve-kurallari", "puan-durumu-ve-averaj-hesaplama", "istanbul-voleybol-altyapi-ligleri-rehberi"],
    internalLinks: [
      {
        title: "Yakınınızdaki Voleybol Kulüpleri",
        url: "/kulupler",
        description: "Şehriniz ve ilçenizdeki tescilli voleybol altyapı kulüplerini harita ve listeyle bulun.",
        badge: "Kulüp Arama",
      },
      {
        title: "Yaş Kategorisi Sorgulama",
        url: "/hangi-ligde-oynar",
        description: "Hangi yaş kategorisinde lisans çıkarılacağını anında tespit edin.",
        badge: "Hesaplayıcı",
      },
    ],
  },
  {
    slug: "istanbul-voleybol-altyapi-ligleri-rehberi",
    title: "İstanbul Voleybol Altyapı Ligleri Rehberi — Salonlar, Gruplar ve Takvim",
    shortTitle: "İstanbul Altyapı Rehberi",
    category: "Şehir Rehberleri",
    categorySlug: "sehir-rehberleri",
    description:
      "İstanbul TVF altyapı ligleri rehberi: Süper Lig ve 1. Lig kademeleri, Burhan Felek, 50. Yıl Deniz Esinduy ve Çamlıca salonları, fikstür ve kulüp yapısı.",
    keywords: [
      "istanbul altyapı voleybol ligleri",
      "50 yıl deniz esinduy voleybol maçları",
      "burhan felek altyapı maç takvimi",
      "istanbul genç kızlar voleybol süper lig",
      "istanbul yıldız kızlar voleybol fikstürü",
      "tvf istanbul il temsilciliği",
    ],
    readTime: "5 dk okuma",
    publishedAt: "2026-10-21",
    updatedAt: "2026-10-27",
    featured: true,
    summary:
      "Türkiye'nin en rekabetçi ve en çok takıma sahip voleybol merkezi İstanbul'da altyapı ligleri Süper Lig ve 1. Lig olmak üzere iki kademede oynanır. Her hafta yüzlerce maç efsanevi salonlarda hayat bulur.",
    tableOfContents: [
      { id: "lig-kademeleri", title: "1. İstanbul Lig Kademeleri: Süper Lig ve 1. Lig" },
      { id: "mac-salonlari", title: "2. İstanbul'un Başlıca Voleybol Salonları" },
      { id: "fikstur-takip", title: "3. Fikstür ve Maç Takvimi Nasıl Takip Edilir?" },
      { id: "anadolu-avrupa", title: "4. Anadolu ve Avrupa Yakası Kulüp Dağılımı" },
      { id: "sampiyona-yolu", title: "5. İstanbul'dan Türkiye Şampiyonası'na Katılım" },
    ],
    sections: [
      {
        id: "lig-kademeleri",
        title: "1. İstanbul Lig Kademeleri: Süper Lig ve 1. Lig",
        content:
          "İstanbul'da kulüp sayısı çok yüksek olduğu için Genç Kızlar ve Yıldız Kızlar kategorilerinde ligler 'Süper Lig' ve '1. Lig' olmak üzere iki seviyeli piramit sisteminde organize edilir. Süper Lig'de köklü kulüpler yer alırken, 1. Lig'de gelişim kulüpleri mücadele eder.",
        highlights: [
          "Süper Lig: VakıfBank, Eczacıbaşı, Fenerbahçe, THY, Beşiktaş, Galatasaray gibi dev altyapı kulüpleri.",
          "1. Lig: Çok sayıda yerel gelişim kulübü ve özel spor kulüpleri.",
        ],
      },
      {
        id: "mac-salonlari",
        title: "2. İstanbul'un Başlıca Voleybol Salonları",
        content:
          "İstanbul altyapı müsabakaları ağırlıklı olarak her iki yakadaki resmi TVF salonlarında oynanır:",
        highlights: [
          "50. Yıl Deniz Esinduy Voleybol Salonu (Üsküdar / Kadıköy sınırı): Anadolu yakasının ana mabedi.",
          "Burhan Felek Vestel Voleybol Salonu (Üsküdar): Kritik finaller ve derbi karşılaşmaları.",
          "TVF Çamlıca Spor Salonu (Üsküdar / Çamlıca): Yoğun hafta sonu altyapı fikstürü.",
          "Osman Solakoğlu Spor Salonu (Bayrampaşa): Avrupa yakasının ana salonu.",
          "Bahçelievler Engelliler Spor Salonu (Bahçelievler): Avrupa yakası altyapı maçları.",
        ],
      },
      {
        id: "fikstur-takip",
        title: "3. Fikstür ve Maç Takvimi Nasıl Takip Edilir?",
        content:
          "Haftalık bültenler TVF İstanbul İl Temsilciliği tarafından yayınlanır ve platformumuzda anlık olarak dijitalleştirilir. Salon, saat ve tarih değişiklikleri anında sistemimize yansır.",
      },
      {
        id: "anadolu-avrupa",
        title: "4. Anadolu ve Avrupa Yakası Kulüp Dağılımı",
        content:
          "İstanbul'da Kadıköy, Üsküdar, Ataşehir, Ümraniye (Anadolu) ile Bakırköy, Sarıyer, Beşiktaş, Kadıköy (Avrupa) ilçelerinde yoğun bir voleybol kulübü kümelenmesi bulunur.",
      },
      {
        id: "sampiyona-yolu",
        title: "5. İstanbul'dan Türkiye Şampiyonası'na Katılım",
        content:
          "İstanbul ili Türkiye Şampiyonası finallerine en yüksek kontenjanı ayıran ildir. Süper Lig final etabını ilk 4 veya ilk 6 sırada tamamlayan kulüpler doğrudan Türkiye Finallerine gider.",
      },
    ],
    faqs: [
      {
        question: "50. Yıl Deniz Esinduy Salonu'na nasıl gidilir?",
        answer: "Kadıköy veya Üsküdar'dan kalkan toplu taşıma araçlarıyla ve Marmaray Ayrılık Çeşmesi durağından kısa bir yürüyüşle ulaşılabilir.",
      },
      {
        question: "İstanbul altyapı maçları seyirciye açık mı?",
        answer: "Evet, tüm resmi TVF altyapı maçları velilere ve sporseverlere ücretsiz olarak açıktır.",
      },
    ],
    relatedSlugs: ["ankara-voleybol-altyapi-ligleri-rehberi", "izmir-voleybol-altyapi-ligleri-rehberi", "puan-durumu-ve-averaj-hesaplama"],
    internalLinks: [
      {
        title: "İstanbul Altyapı Fikstürü",
        url: "/fikstur/istanbul",
        description: "Bu haftaki tüm İstanbul altyapı maçlarının salon ve saat bilgileri.",
        badge: "İstanbul Fikstür",
      },
      {
        title: "İstanbul Puan Durumu",
        url: "/puan-durumu/istanbul",
        description: "Genç, Yıldız, Küçük ve Midi İstanbul liglerinin güncel puan cetvelleri.",
        badge: "İstanbul Puan",
      },
      {
        title: "İstanbul Voleybol Kulüpleri",
        url: "/kulupler/istanbul",
        description: "İlçe ilçe İstanbul'un tescilli voleybol kulüpleri rehberi.",
        badge: "Kulüpler",
      },
    ],
  },
  {
    slug: "ankara-voleybol-altyapi-ligleri-rehberi",
    title: "Ankara Voleybol Altyapı Ligleri Rehberi — Salonlar ve Başkent Ekolü",
    shortTitle: "Ankara Altyapı Rehberi",
    category: "Şehir Rehberleri",
    categorySlug: "sehir-rehberleri",
    description:
      "Başkent Ankara'nın voleybol altyapı rehberi: Beştepe ve Selim Sırrı Tarcan salonları, TVF Spor Lisesi ekolü, lig grupları ve fikstür detayları.",
    keywords: [
      "ankara altyapı voleybol ligleri",
      "beştepe voleybol salonu maçları",
      "selim sırrı tarcan altyapı fikstür",
      "ankara genç kızlar voleybol ligi",
      "ankara voleybol kulüpleri",
      "tvf ankara il temsilciliği",
    ],
    readTime: "4 dk okuma",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-27",
    featured: false,
    summary:
      "Türk voleybolunun kalbi ve federasyonun merkezi olan Ankara, köklü altyapı kulüpleri, TVF Spor Lisesi ve Beştepe Kampüsü ile üst düzey bir altyapı ligine ev sahipliği yapar.",
    tableOfContents: [
      { id: "ankara-ekolu", title: "1. Başkent Voleybol Ekolü ve Kulüpler" },
      { id: "salonlar", title: "2. Beştepe ve Selim Sırrı Tarcan Salonları" },
      { id: "lig-formati", title: "3. Ankara Altyapı Lig Formatı" },
      { id: "finallere-katilim", title: "4. Ankara'dan Türkiye Şampiyonası'na Geçiş" },
    ],
    sections: [
      {
        id: "ankara-ekolu",
        title: "1. Başkent Voleybol Ekolü ve Kulüpler",
        content:
          "Ankara; İlbank, Karayolları, TVF Spor Lisesi, VakıfBank Ankara, Ziraat Bankkart ve Halkbank gibi hem kadın hem erkek voleybolunda Türkiye'nin lokomotifi olan kulüplerin altyapılarına sahiptir.",
      },
      {
        id: "salonlar",
        title: "2. Beştepe ve Selim Sırrı Tarcan Salonları",
        content:
          "Müsabakalar ağırlıklı olarak TVF Beştepe Voleybol Kampüsü Salonu'nda ve tarihi Selim Sırrı Tarcan Voleybol Salonu'nda oynanır.",
      },
      {
        id: "lig-formati",
        title: "3. Ankara Altyapı Lig Formatı",
        content:
          "Grup aşamaları tek veya çift devreli olarak oynanır; ardından final gruplarına kalan takımlar il derecelerini belirlemek için mücadele eder.",
      },
      {
        id: "finallere-katilim",
        title: "4. Ankara'dan Türkiye Şampiyonası'na Geçiş",
        content:
          "Ankara il birinciliğini elde eden kulüpler doğrudan veya yarı final etabından Türkiye Şampiyonası finallerine katılır.",
      },
    ],
    faqs: [
      {
        question: "Beştepe Voleybol Salonu nerede?",
        answer: "Ankara Yenimahalle / Beştepe mevkiinde, TVF ana hizmet binasının yanında yer alır.",
      },
    ],
    relatedSlugs: ["istanbul-voleybol-altyapi-ligleri-rehberi", "izmir-voleybol-altyapi-ligleri-rehberi", "turkiye-sampiyonasi-statu-ve-finaller"],
    internalLinks: [
      {
        title: "Ankara Altyapı Fikstürü",
        url: "/fikstur/ankara",
        description: "Ankara ilindeki tüm yaş kategorisi maçlarının tarih ve saatleri.",
        badge: "Ankara Fikstür",
      },
      {
        title: "Ankara Puan Durumu",
        url: "/puan-durumu/ankara",
        description: "Ankara altyapı liglerinin resmi puan cetvelleri.",
        badge: "Ankara Puan",
      },
      {
        title: "Ankara Voleybol Kulüpleri",
        url: "/kulupler/ankara",
        description: "Çankaya, Yenimahalle, Keçiören ve diğer ilçelerdeki voleybol kulüpleri.",
        badge: "Kulüpler",
      },
    ],
  },
  {
    slug: "izmir-voleybol-altyapi-ligleri-rehberi",
    title: "İzmir Voleybol Altyapı Ligleri Rehberi — Ege'nin Voleybol Gücü",
    shortTitle: "İzmir Altyapı Rehberi",
    category: "Şehir Rehberleri",
    categorySlug: "sehir-rehberleri",
    description:
      "İzmir TVF altyapı ligleri: Atatürk Voleybol Salonu (Sigorta Shop Arena), Arkas, Göztepe, Karşıyaka ve Rota Koleji altyapı rekabeti ve maç takvimi.",
    keywords: [
      "izmir altyapı voleybol ligleri",
      "izmir atatürk voleybol salonu maçları",
      "izmir genç kızlar voleybol fikstürü",
      "izmir voleybol kulüpleri",
      "arkas altyapı maçları",
      "karşıyaka voleybol altyapı",
    ],
    readTime: "4 dk okuma",
    publishedAt: "2026-10-24",
    updatedAt: "2026-10-27",
    featured: false,
    summary:
      "Ege'nin spor başkenti İzmir; Arkas Spor, Karşıyaka, Göztepe, Rota Koleji ve Gelişim Koleji gibi voleybol ekolü kulüpleriyle her yaş kategorisinde Türkiye finallerinin daimi adayıdır.",
    tableOfContents: [
      { id: "izmir-ekolu", title: "1. Ege'nin Voleybol Ekolü" },
      { id: "ataturk-salonu", title: "2. İzmir Atatürk Voleybol Salonu" },
      { id: "lig-gruplari", title: "3. İl Grupları ve Fikstür Yapısı" },
    ],
    sections: [
      {
        id: "izmir-ekolu",
        title: "1. Ege'nin Voleybol Ekolü",
        content:
          "İzmir, Türk voleyboluna kazandırdığı sayısız milli sporcuyla altyapının en dinamik merkezlerinden biridir. Özellikle altyapı tesisleşmesi ve sporcu taraması konusunda öncüdür.",
      },
      {
        id: "ataturk-salonu",
        title: "2. İzmir Atatürk Voleybol Salonu",
        content:
          "Alsancak'ta yer alan tarihi Atatürk Voleybol Salonu, kentin hem profesyonel liglerine hem de altyapı finallerine ev sahipliği yapar.",
      },
      {
        id: "lig-gruplari",
        title: "3. İl Grupları ve Fikstür Yapısı",
        content:
          "Mini, Midi, Küçük, Yıldız ve Genç kategorilerinde düzenlenen il ligleri hafta sonu yoğun maç takvimiyle Alsancak ve Gaziemir salonlarında oynanır.",
      },
    ],
    faqs: [
      {
        question: "İzmir Atatürk Voleybol Salonu nerede?",
        answer: "Konak / Alsancak semtinde, Kültürpark ve Alsancak Garı'na yürüme mesafesindedir.",
      },
    ],
    relatedSlugs: ["istanbul-voleybol-altyapi-ligleri-rehberi", "bursa-voleybol-altyapi-ligleri-rehberi", "turkiye-sampiyonasi-statu-ve-finaller"],
    internalLinks: [
      {
        title: "İzmir Altyapı Fikstürü",
        url: "/fikstur/izmir",
        description: "İzmir ilinde oynanan tüm altyapı karşılaşmalarının güncel saatleri.",
        badge: "İzmir Fikstür",
      },
      {
        title: "İzmir Puan Durumu",
        url: "/puan-durumu/izmir",
        description: "İzmir lig gruplarının canlı puan durumu tablosu.",
        badge: "İzmir Puan",
      },
      {
        title: "İzmir Voleybol Kulüpleri",
        url: "/kulupler/izmir",
        description: "Konak, Karşıyaka, Bornova ve Gaziemir voleybol kulüpleri.",
        badge: "Kulüpler",
      },
    ],
  },
  {
    slug: "bursa-voleybol-altyapi-ligleri-rehberi",
    title: "Bursa Voleybol Altyapı Ligleri Rehberi — Cengiz Göllü ve Kulüpler",
    shortTitle: "Bursa Altyapı Rehberi",
    category: "Şehir Rehberleri",
    categorySlug: "sehir-rehberleri",
    description:
      "Bursa altyapı voleybol ligleri: Cengiz Göllü Voleybol Salonu, Bursa BBSK, Nilüfer Belediyespor, Çekirge salonu ve fikstür rehberi.",
    keywords: [
      "bursa altyapı voleybol ligleri",
      "cengiz göllü voleybol salonu maçları",
      "bursa genç kızlar voleybol puan durumu",
      "bursa voleybol kulüpleri",
      "nilüfer belediyespor altyapı",
      "bursa altyapı fikstür",
    ],
    readTime: "4 dk okuma",
    publishedAt: "2026-10-25",
    updatedAt: "2026-10-27",
    featured: false,
    summary:
      "Marmara'nın güçlü voleybol kenti Bursa; Cengiz Göllü Voleybol Salonu gibi dünya standartlarında bir komplekse ve Nilüfer Belediyespor, Bursa BBSK gibi güçlü altyapı kulüplerine ev sahipliği yapar.",
    tableOfContents: [
      { id: "cengiz-gollu", title: "1. Cengiz Göllü Voleybol Salonu" },
      { id: "bursa-kulup-yapisi", title: "2. Bursa Altyapı Kulüp Yapısı" },
      { id: "lig-gruplari", title: "3. Grup Aşamaları ve Fikstür" },
    ],
    sections: [
      {
        id: "cengiz-gollu",
        title: "1. Cengiz Göllü Voleybol Salonu",
        content:
          "Türk voleybolunun efsane ismi Cengiz Göllü'nün adını taşıyan salon, modern zemin ve seyirci kapasitesiyle Bursa altyapısının ana merkezidir.",
      },
      {
        id: "bursa-kulup-yapisi",
        title: "2. Bursa Altyapı Kulüp Yapısı",
        content:
          "Nilüfer Belediyespor, Bursa Büyükşehir Belediyespor, MG Spor Kulübü ve Nova Gençlik gibi kulüpler yaş kategorilerinde kıyasıya mücadele eder.",
      },
      {
        id: "lig-gruplari",
        title: "3. Grup Aşamaları ve Fikstür",
        content:
          "Bursa il ligleri normal sezon maçları ve ardından oynanan play-off etaplarıyla tamamlanarak Türkiye Şampiyonası biletleri sahiplerini bulur.",
      },
    ],
    faqs: [
      {
        question: "Cengiz Göllü Voleybol Salonu nerede?",
        answer: "Bursa Nilüfer ilçesinde, Fethiye Mahallesi sınırlarında yer alır.",
      },
    ],
    relatedSlugs: ["istanbul-voleybol-altyapi-ligleri-rehberi", "izmir-voleybol-altyapi-ligleri-rehberi", "puan-durumu-ve-averaj-hesaplama"],
    internalLinks: [
      {
        title: "Bursa Altyapı Fikstürü",
        url: "/fikstur/bursa",
        description: "Bursa'daki haftalık resmi altyapı maç programı.",
        badge: "Bursa Fikstür",
      },
      {
        title: "Bursa Puan Durumu",
        url: "/puan-durumu/bursa",
        description: "Bursa yerel liglerindeki güncel puan durumları.",
        badge: "Bursa Puan",
      },
      {
        title: "Bursa Voleybol Kulüpleri",
        url: "/kulupler/bursa",
        description: "Nilüfer, Osmangazi, Yıldırım ilçelerindeki voleybol kulüpleri.",
        badge: "Kulüpler",
      },
    ],
  },
];

export function getAllGuides(): GuideArticle[] {
  return GUIDE_ARTICLES;
}

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((g) => g.slug === slug);
}

export function getFeaturedGuides(): GuideArticle[] {
  return GUIDE_ARTICLES.filter((g) => g.featured);
}

export function getGuidesByCategory(categorySlug: string): GuideArticle[] {
  return GUIDE_ARTICLES.filter((g) => g.categorySlug === categorySlug);
}

export function getRelatedGuides(currentSlug: string): GuideArticle[] {
  const current = getGuideBySlug(currentSlug);
  if (!current) return [];
  return current.relatedSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((g): g is GuideArticle => g !== undefined);
}
