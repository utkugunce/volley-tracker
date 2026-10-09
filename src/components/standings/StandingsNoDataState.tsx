import React from "react";
import { HelpCircle } from "lucide-react";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import type { ParsedStandingContext } from "@/utils/standingsParsing";

/** Seçili grup için puan durumu satırı yokken gösterilen boş durum. */
export function StandingsNoDataState({ activeContext }: { activeContext: ParsedStandingContext | undefined }) {
  return (
    <div className="py-12 px-4 text-center">
      <EmptyState
        icon={<HelpCircle size={22} />}
        title="Bu grup için puan durumu verisi henüz mevcut değil."
        description={`Seçtiğiniz ${activeContext?.leagueFullName || ""} - ${activeContext?.displayGroup || ""} kategorisine ait resmi puan cetveli TVF il temsilciliği tarafından sisteme girildiğinde burada görüntülenecektir.`}
      />
    </div>
  );
}

