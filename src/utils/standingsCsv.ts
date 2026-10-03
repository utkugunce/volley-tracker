import { StandingItem } from "@/types/fixture";
import { slugify } from "@/utils/slugify";

/**
 * Puan durumu verilerini Türkçe Excel uyumlu UTF-8 BOM ve ';' ayırıcılı CSV'ye çevirir.
 */
export function generateStandingsCsv(items: StandingItem[]): string {
  const BOM = "\uFEFF";
  const header = [
    "Sıra",
    "Takım",
    "Oynadığı",
    "Galibiyet",
    "Mağlubiyet",
    "Puan",
    "Aldığı Set",
    "Verdiği Set",
    "Set Oranı",
    "Aldığı Sayı",
    "Verdiği Sayı",
    "Sayı Oranı",
  ].join(";");

  const rows = items.map((row) => {
    const escapedTeam =
      row.team.includes(";") || row.team.includes('"')
        ? `"${row.team.replace(/"/g, '""')}"`
        : row.team;

    return [
      row.rank,
      escapedTeam,
      row.played,
      row.won,
      row.lost,
      row.points,
      row.sets_won,
      row.sets_lost,
      row.set_ratio,
      row.points_won,
      row.points_lost,
      row.point_ratio,
    ].join(";");
  });

  return BOM + [header, ...rows].join("\r\n");
}

export function downloadStandingsCsv(items: StandingItem[], groupName?: string): void {
  if (typeof window === "undefined" || items.length === 0) return;

  const csv = generateStandingsCsv(items);
  const groupSlug = slugify(groupName || "puan-durumu");
  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `puan-durumu-${groupSlug}-${todayStr}.csv`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
