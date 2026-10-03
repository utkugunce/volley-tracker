import React from "react";
import { Info } from "lucide-react";

interface PlayoffRuleNoteProps {
  cutoff?: number;
  className?: string;
}

/** Play-off hesabının kuralını kısaca açıklar (şeffaflık). Olasılık değil, yalnızca kesin matematiksel durum gösterilir. */
export const PlayoffRuleNote: React.FC<PlayoffRuleNoteProps> = ({ cutoff, className = "" }) => (
  <details className={`group text-xs text-slate-400 ${className}`}>
    <summary className="inline-flex items-center gap-1.5 cursor-pointer select-none font-semibold text-slate-300 hover:text-white list-none">
      <Info size={13} className="text-primary" />
      <span>Bu durum nasıl hesaplanıyor?</span>
    </summary>
    <div className="mt-2 space-y-1.5 bg-slate-900/60 border border-slate-800 rounded-xl p-3 leading-relaxed">
      <p>
        Tahmin ya da yüzde yoktur; yalnızca kesin matematiksel durum gösterilir
        {cutoff ? ` (ilk ${cutoff} play-off/final etabına girer)` : ""}. Bir maçtan en fazla 3, en az 0 puan alınır.
      </p>
      <ul className="list-disc pl-4 space-y-1">
        <li>
          <b className="text-emerald-300">Garanti:</b> En fazla puanı kendi mevcut puanına eşit veya üstüne çıkabilen takım sayısı
          {cutoff ? ` ${cutoff - 1}` : " ilk sıra sayısının bir eksiği"} veya daha az.
        </li>
        <li>
          <b className="text-form-loss">Elenmiş:</b> Mevcut puanı, takımın alabileceği en yüksek puandan kesin olarak fazla olan takım sayısı
          {cutoff ? ` ${cutoff}` : " ilk sıra sayısı"} veya daha çok.
        </li>
        <li>
          <b className="text-amber-300">Açık:</b> İkisi de henüz kesinleşmedi. Puan eşitliğinde averaj bilinmediği için eşitlik rakip lehine sayılır.
        </li>
        <li>
          <b className="text-slate-200">Belirsiz:</b> Grubun fikstürü tamamlanmadıysa (her takım çifti aynı sayıda eşleşmemişse ya da
          puan durumu ile maç sonuçları uyuşmuyorsa) kalan maç sayısı bilinemez; bu durumda hesap yapılmaz.
        </li>
      </ul>
      <p>Kalan maçlar, TVF/il temsilciliği fikstüründe açıklanmış oynanmamış ve ertelenmiş maçlardır.</p>
    </div>
  </details>
);
