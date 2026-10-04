import { createClubResourceHandlers } from "@/utils/club/resourceRoute";
import { validateMatchNoteInput } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

export const { GET, POST, PUT, DELETE } = createClubResourceHandlers({
  table: "match_notes",
  label: "Maç notu",
  readAction: "note:read",
  writeAction: "note:write",
  maxRowsPerClub: 1000,
  columns: "id, club_slug, match_ref, opponent, match_date, body, visibility, created_at, updated_at",
  orderBy: [{ column: "created_at", ascending: false }],
  validate: validateMatchNoteInput,
});
