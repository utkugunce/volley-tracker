import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database, UserCheck, Bell, Cookie, FileText, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
  description:
    "Altyapı Voleybol gizlilik politikası, kişisel verilerin korunması (KVKK/GDPR), çerez kullanımı ve çocuk verilerinin korunması ilkeleri.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink py-10 px-4 sm:px-6">
      <main className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-6"
          >
            <ArrowLeft size={14} />
            <span>Ana Sayfaya Dön</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Shield size={24} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Gizlilik Politikası ve KVKK Aydınlatma Metni
              </h1>
              <p className="text-xs text-ink-2 mt-1">Son Güncelleme: Ekim 2026</p>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            1. Veri Sorumlusu ve Genel Yaklaşım
          </h2>
          <p>
            Altyapı Voleybol (“Platform”), 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuat (GDPR dâhil) uyarınca veri sorumlusu sıfatıyla hareket etmektedir. Bu politika, platformumuzu ziyaret eden, kulüp panelini kullanan ve bildirim servislerimize abone olan kullanıcıların kişisel verilerinin işlenmesine ilişkin aydınlatma yükümlülüğümüzün yerine getirilmesi amacıyla hazırlanmıştır.
          </p>
          <p>
            Platformumuz, ziyaretçilerin kişisel gizliliğine azami hassasiyet gösterir. <strong>Kişisel veriler asla ticari amaçla satılmaz, üçüncü taraf reklamverenlerle paylaşılmaz veya profilleme amacıyla işlenmez.</strong>
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Database size={16} className="text-primary" />
            2. Toplanan Kişisel Veriler ve İşlenme Amaçları
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Web Push Bildirim Verileri:</strong> Canlı maç ve fikstür hatırlatmalarını tarayıcınıza iletebilmek amacıyla Web Push API üzerinden oluşturulan şifreli cihaz bildirim uç noktası (endpoint) ile açık anahtarlar (p256dh, auth) ve kullanıcının seçtiği favori takım/maç listeleri saklanır.
            </li>
            <li>
              <strong>Kulüp ve Antrenör Hesap Bilgileri:</strong> Kulüp paneline giriş ve üyelik talepleri için e-posta adresi, kulüp yetkilendirme rolleri (yönetici / antrenör) ve kullanıcı tarafından girilen başvuru notu saklanır. Şifre tutulmaz; güvenli tek kullanımlık bağlantı (Magic Link) ile oturum açılır.
            </li>
            <li>
              <strong>Kadro ve Sporcu Bilgileri:</strong> Kulüp yöneticileri tarafından takımlarının resmi listelerini kamuya duyurmak üzere girilen sporcu adı-soyadı, forma numarası, mevkii, boy ve doğum yılı verileri.
            </li>
            <li>
              <strong>Güvenlik ve Ağ Günlükleri (IP Adresleri):</strong> Kötü niyetli saldırıları, spam girişimlerini ve brute-force yetkisiz erişimleri engellemek üzere istek hız sınırı (rate limiting) mekanizması kapsamında istemci IP adresleri geçici olarak işlenir.
            </li>
            <li>
              <strong>Kullanım Analitiği (İsteğe Bağlı):</strong> Yalnızca kullanıcı açık onay (opt-in) verdiği takdirde, sitenin performansını ölçmek ve teknik hataları gidermek amacıyla anonimleştirilmiş sayfa görüntüleme istatistikleri (Vercel Analytics) toplanır.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <UserCheck size={16} className="text-primary" />
            3. Çocukların ve 13 Yaş Altı Bireylerin Korunması (COPPA & KVKK Uyum)
          </h2>
          <p>
            Platformumuz Türkiye genelinde genç, yıldız ve küçük kızlar kategorilerindeki spor organizasyonlarını konu almaktadır. Bu kapsamda çocukların kişisel verilerinin korunması en öncelikli prensibimizdir:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              13 yaşından küçük çocuklara yönelik hedefli reklamcılık veya davranışsal izleme kesinlikle yapılmaz.
            </li>
            <li>
              Kulüp panelleri üzerinden kadroya dahil edilen 13 yaşından küçük sporcuların verilerinin işlenmesi, yalnızca ilgili spor kulübü yetkilisinin veli/yasal temsilci rızasını aldığını teyit etmesi şartıyla mümkündür.
            </li>
            <li>
              Veliler veya yasal temsilciler, çocuklarına ait herhangi bir sporcu kaydının silinmesini veya anonimleştirilmesini talep ettikleri takdirde, bu talep derhal ve koşulsuz olarak yerine getirilir.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Cookie size={16} className="text-primary" />
            4. Çerezler (Cookies) ve Yerel Depolama (LocalStorage)
          </h2>
          <p>
            Sitemizde kullanılan depolama teknolojileri şunlardır:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Zorunlu Teknik Tercihler:</strong> Tema tercihi (koyu/açık mod), dil tercihi (Türkçe/İngilizce) ve açık oturum jetonları (yalnızca kulüp paneli kullanıcıları için) tarayıcınızın yerel depolama alanında tutulur. Bunlar olmadan site temel işlevlerini yerine getiremez.
            </li>
            <li>
              <strong>Analiz Çerezleri (Rızaya Bağlı):</strong> Sitemizi nasıl kullandığınızı anlamamıza yardımcı olan Vercel Analytics, ilk ziyaretinizde onay vermediğiniz sürece kesinlikle yüklenmez. Tercihinizi sayfa altındaki çerez yönetim panelinden dilediğiniz zaman değiştirebilirsiniz.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            5. İlgili Kişinin Hakları (KVKK Madde 11 & GDPR Hakları)
          </h2>
          <p>
            KVKK’nın 11. maddesi ve GDPR uyarınca her ilgili kişi; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, verilerin silinmesini veya yok edilmesini talep etme hakkına sahiptir.
          </p>
          <p>
            Push bildirim aboneliğinizi tarayıcı bildirim ayarlarından ya da sitemizdeki bildirim butonundan tek bir tıklama ile anında sonlandırabilirsiniz.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            6. İletişim ve Veri Sahibi Başvurusu
          </h2>
          <p>
            Kişisel verilerinizle, gizlilik haklarınızla veya sporcu kayıtlarıyla ilgili tüm soru, talep ve başvurularınızı veri sorumlusu iletişim adresimize iletebilirsiniz:
          </p>
          <div className="bg-surface-muted p-4 rounded-xl border border-line font-mono text-xs text-ink space-y-1">
            <p><strong>E-posta:</strong> admin@altyapivoleybol.com.tr</p>
            <p><strong>Platform:</strong> Altyapı Voleybol (TVF Fikstür & Puan Durumu Takip Portalı)</p>
            <p><strong>Konu Başlığı:</strong> Kişisel Veri Talebi / KVKK Başvurusu</p>
          </div>
        </section>
      </main>
    </div>
  );
}
