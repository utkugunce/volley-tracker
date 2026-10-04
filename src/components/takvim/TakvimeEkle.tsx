import React from "react";
import { CalendarPlus } from "lucide-react";

export interface TakvimSubscription {
  slug: string;
  label: string;
}

/** Abonelik adresleri (PR #26): /takvim/<slug>.ics. iPhone / Mac için webcal:// şeması kullanılır. */
export const TAKVIM_SITE_HOST = "altyapivoleybol.com.tr";

export function webcalUrl(slug: string): string {
  return `webcal://${TAKVIM_SITE_HOST}/takvim/${slug}.ics`;
}

export const TakvimeEkle: React.FC<{ subscriptions: TakvimSubscription[] }> = ({ subscriptions }) => (
  <section aria-labelledby="takvime-ekle-baslik" className="rounded-2xl border border-line bg-panel shadow-card px-4 py-3">
    <div className="flex items-center gap-2">
      <CalendarPlus size={16} aria-hidden="true" className="text-primary shrink-0" />
      <h2 id="takvime-ekle-baslik" className="font-display font-bold text-ink text-sm">
        Takvime ekle
      </h2>
    </div>
    <p className="mt-1 text-xs text-ink-2">
      Maçlar telefonunun veya bilgisayarının takvimine abone olarak eklenir; saat ve salon değişiklikleri kendiliğinden güncellenir.
    </p>
    <ul className="mt-2.5 flex flex-wrap gap-2">
      {subscriptions.map((s) => (
        <li key={s.slug}>
          <a
            href={webcalUrl(s.slug)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface-muted text-xs font-bold text-ink hover:bg-surface-raised hover:border-primary/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <CalendarPlus size={13} aria-hidden="true" className="text-primary" />
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  </section>
);
