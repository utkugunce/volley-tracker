import React from "react";
import { HelpCircle } from "lucide-react";

/** Hiç puan durumu anahtarı yokken gösterilen boş durum. */
export function StandingsEmptyState() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
      <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-3 text-ink-3 border border-line">
        <HelpCircle size={22} />
      </div>
      <h3 className="text-sm font-bold text-ink mb-1">
        Puan Durumu Verisi Henüz Açıklanmadı
      </h3>
      <p className="text-xs text-ink-3 max-w-sm mx-auto">
        Bu il veya kategori için resmi puan cetveli TVF tarafından sisteme girildiğinde burada görüntülenecektir.
      </p>
    </div>
  );
}
