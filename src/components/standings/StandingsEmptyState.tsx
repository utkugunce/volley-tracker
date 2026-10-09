import React from "react";
import { HelpCircle } from "lucide-react";
import { EmptyState } from "@/components/arc/empty-state/empty-state";

/** Hiç puan durumu anahtarı yokken gösterilen boş durum. */
export function StandingsEmptyState() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
      <EmptyState
        icon={<HelpCircle size={22} />}
        title="Puan Durumu Verisi Henüz Açıklanmadı"
        description="Bu il veya kategori için resmi puan cetveli TVF tarafından sisteme girildiğinde burada görüntülenecektir."
      />
    </div>
  );
}

