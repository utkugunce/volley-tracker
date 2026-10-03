import { createClubResourceHandlers } from "@/utils/club/resourceRoute";
import { validateRosterInput } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

export const { GET, POST, PUT, DELETE } = createClubResourceHandlers({
  table: "club_roster_entries",
  label: "Kadro",
  readAction: "roster:read",
  writeAction: "roster:write",
  maxRowsPerClub: 200,
  columns: "id, club_slug, name, shirt_number, position, height_cm, birth_year, is_staff, is_visible, updated_at",
  orderBy: [
    { column: "is_staff", ascending: true },
    { column: "shirt_number", ascending: true },
    { column: "name", ascending: true },
  ],
  validate: validateRosterInput,
});
