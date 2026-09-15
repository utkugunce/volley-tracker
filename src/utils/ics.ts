import { Match } from "@/types/fixture";

/**
 * Formats a Date object or date/time strings into iCalendar format (YYYYMMDDTHHMMSS).
 */
function formatIcsDateTime(dateStr?: string, timeStr?: string, durationHours: number = 2): { start: string; end: string } | null {
  if (!dateStr || dateStr === "TBD") return null;

  // Clean date YYYY-MM-DD
  const dateParts = dateStr.trim().split("-");
  if (dateParts.length !== 3) return null;
  const year = dateParts[0];
  const month = dateParts[1].padStart(2, "0");
  const day = dateParts[2].padStart(2, "0");

  let hour = 14;
  let minute = 0;

  if (timeStr && timeStr.includes(":")) {
    const timeParts = timeStr.trim().split(":");
    const parsedH = parseInt(timeParts[0], 10);
    const parsedM = parseInt(timeParts[1], 10);
    if (!isNaN(parsedH)) hour = parsedH;
    if (!isNaN(parsedM)) minute = parsedM;
  }

  const startHStr = String(hour).padStart(2, "0");
  const startMStr = String(minute).padStart(2, "0");

  const endH = (hour + durationHours) % 24;
  const endHStr = String(endH).padStart(2, "0");

  const start = `${year}${month}${day}T${startHStr}${startMStr}00`;
  const end = `${year}${month}${day}T${endHStr}${startMStr}00`;

  return { start, end };
}

/**
 * Escapes characters for iCalendar text values (newlines, commas, semicolons).
 */
function escapeIcsText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates a single VEVENT block for a match.
 */
function generateVEvent(match: Match): string | null {
  const dt = formatIcsDateTime(match.date, match.time);
  if (!dt) return null;

  const summary = `${match.home_team} - ${match.away_team}`;
  const location = [match.hall, match.city].filter(Boolean).join(", ");
  const descLines: string[] = [
    `${match.category || "TVF Voleybol Ligi"} - ${match.group || ""}`.trim(),
    match.score && match.score !== "- : -" ? `Skor: ${match.score}` : "",
    match.match_no ? `Maç No: ${match.match_no}` : "",
    "Kaynak: TVFSCORE (Volley-Tracker)",
  ].filter(Boolean);

  const desc = escapeIcsText(descLines.join("\n"));
  const uid = `match-${match.id || Math.random().toString(36).slice(2)}@volley-tracker`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dt.start}`,
    `DTEND:${dt.end}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : "",
    `DESCRIPTION:${desc}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].filter(Boolean).join("\r\n");
}

/**
 * Generates a complete .ics calendar string for a single match.
 */
export function generateMatchIcs(match: Match): string | null {
  const vevent = generateVEvent(match);
  if (!vevent) return null;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//volley-tracker//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`${match.home_team} vs ${match.away_team}`)}`,
    vevent,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Generates a complete .ics calendar string for a collection of matches (e.g. season or favorites).
 */
export function generateSeasonIcs(matches: Match[], calendarName: string): string {
  const events = matches
    .map((m) => generateVEvent(m))
    .filter(Boolean);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//volley-tracker//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers client-side browser file download for .ics content.
 */
export function downloadIcsFile(filename: string, content: string): void {
  if (typeof window === "undefined" || !content) return;

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
