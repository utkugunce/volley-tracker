import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ArrowLeft, AlertCircle, Mail, FileCheck, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "DMCA ve Telif Hakkı Bildirimi (Uyar-Kaldır)",
  description:
    "Altyapı Voleybol DMCA ve FSEK telif hakları politikası, uyar-kaldır mekanizması ve yetkili telif hakları temsilcisi iletişim bilgileri.",
};

export default function DmcaPage() {
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
              <Scale size={24} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                DMCA ve Telif Hakkı Politikası (Uyar-Kaldır)
              </h1>
              <p className="text-xs text-ink-2 mt-1">Son Güncelleme: Ekim 2026</p>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <AlertCircle size={16} className="text-primary" />
            1. Telif Haklarına Saygı ve Yasal Dayanak
          </h2>
          <p>
            Altyapı Voleybol (“Platform”), fikri mülkiyet haklarına ve telif sahiplerinin haklarına tam saygı gösterir. Platformumuz, 5846 sayılı Fikir ve Sanat Eserleri Kanunu (“FSEK”), 5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Hakkında Kanun ve Birleşik Devletler Dijital Milenyum Telif Hakkı Yasası (“DMCA”, 17 U.S.C. § 512) çerçevesinde <strong>yer sağlayıcı (hosting provider)</strong> olarak faaliyet göstermektedir.
          </p>
          <p>
            Kullanıcılar veya kulüp temsilcileri tarafından yüklenen duyurular, maç notları, takım amblemleri veya kadro metinlerinde herhangi bir telif hakkı ihlali bulunması durumunda, platformumuz “Uyar-Kaldır” (Notice and Takedown) prensibini titizlikle işletir.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            2. Yetkili Telif Temsilcisi (Designated DMCA Agent)
          </h2>
          <p>
            Telif hakkı ihlali bildirimlerinizi iletebileceğiniz yetkili temsilcimizin iletişim bilgileri aşağıdadır:
          </p>
          <div className="bg-surface-muted p-4 rounded-xl border border-line font-mono text-xs text-ink space-y-1">
            <p><strong>Yetkili Birim:</strong> Altyapı Voleybol Telif Hakları & Yasal Bildirim Departmanı</p>
            <p><strong>E-posta:</strong> admin@altyapivoleybol.com.tr</p>
            <p><strong>Web:</strong> https://altyapivoleybol.com.tr/dmca</p>
            <p><strong>Yanıt Süresi:</strong> İnceleme ve geri dönüş en geç 48 iş saati içinde tamamlanır.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <FileCheck size={16} className="text-primary" />
            3. İhlal Bildiriminde Bulunma Prosedürü (Takedown Notice)
          </h2>
          <p>
            Telif hakkına konu olan bir eserin platformumuz üzerinde izinsiz paylaşıldığını düşünüyorsanız, bildiriminizin geçerli sayılabilmesi için aşağıdaki bilgileri içermesi gerekmektedir:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              İhlal edildiği iddia edilen telifli eserin tam tanımı ve varsa kayıt numarası veya tescil belgesi.
            </li>
            <li>
              İhlal teşkil ettiği iddia edilen materyalin sitemizdeki tam URL adresi veya konumu.
            </li>
            <li>
              Sizinle iletişim kurabileceğimiz ad, soyad, e-posta adresi ve telefon bilgileri.
            </li>
            <li>
              Materyalin kullanımının telif hakkı sahibi veya yetkili temsilcisi tarafından onaylanmadığına iyi niyetle inandığınıza dair açık beyan.
            </li>
            <li>
              Bildirimdeki bilgilerin doğru olduğunu ve yalan beyanda bulunma cezası altında hak sahibi adına hareket etmeye yetkili olduğunuzu belirten beyan ve imzanız (fiziki veya elektronik).
            </li>
          </ol>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-6 space-y-4 text-sm leading-relaxed text-ink-2">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <RefreshCw size={16} className="text-primary" />
            4. Karşı Bildirim ve Tekrarlayan İhlal Politikası
          </h2>
          <p>
            İçeriği kaldırılan kullanıcılar, içeriğin yanlışlıkla veya hatalı kimlik tespiti sonucu kaldırıldığını düşünüyorlarsa gerekçeleriyle birlikte karşı bildirim (counter-notification) sunma hakkına sahiptir.
          </p>
          <p>
            <strong>Tekrarlayan İhlal Politikası:</strong> Başkalarının fikri mülkiyet haklarını mükerrer olarak ihlal ettiği tespit edilen kulüp/kullanıcı hesaplarının erişim yetkileri kalıcı olarak iptal edilir.
          </p>
        </section>
      </main>
    </div>
  );
}
