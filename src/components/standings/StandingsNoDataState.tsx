import React from "react";
import { HelpCircle } from "lucide-react";
import type { ParsedStandingContext } from "@/utils/standingsParsing";

/** Seçili grup için puan durumu satırı yokken gösterilen boş durum. */
export function StandingsNoDataState({ activeContext }: { activeContext: ParsedStandingContext | undefined }) {
  return (
    <div className="py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center mx-auto mb-3 text-ink-3 border border-line">
        <HelpCircle size={22} />
      </div>
      <h3 className="text-sm font-bold text-ink mb-1">
        Bu grup için puan durumu verisi henüz mevcut değil.
      </h3>
      <p className="text-xs text-ink-3 max-w-sm mx-auto">
        Seçtiğiniz {activeContext?.leagueFullName} - {activeContext?.displayGroup} kategorisine ait resmi puan cetveli TVF il temsilciliği tarafından sisteme girildiğinde burada görüntülenecektir.
      </p>
    </div>
  );
}
