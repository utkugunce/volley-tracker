import { createClubResourceHandlers } from "@/utils/club/resourceRoute";
import { validateAnnouncementInput } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

export const { GET, POST, PUT, DELETE } = createClubResourceHandlers({
  table: "club_announcements",
  label: "Duyuru",
  readAction: "announcement:read",
  writeAction: "announcement:write",
  maxRowsPerClub: 100,
  columns: "id, club_slug, title, body, pinned, expires_at, created_at, updated_at",
  orderBy: [
    { column: "pinned", ascending: false },
    { column: "created_at", ascending: false },
  ],
  validate: (input) => validateAnnouncementInput(input),
});
