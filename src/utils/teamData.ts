/**
 * Takım verisi yardımcıları. Uygulama genelinde `@/utils/teamData` üzerinden içe aktarılır;
 * gerçek uygulama `src/utils/team/` altındaki modüllere bölünmüştür (bu dosya yalnızca yeniden dışa aktarır).
 */
export type { ClubSisterTeam, HeadToHeadComparison, HeadToHeadMatch, OtherCityTeam, Player, TeamDetails, TeamListItem, TeamMatchDetail, TeamStandingContext } from "./team/types";
export { extractVolleyboxTeamId, loadAllCityData, loadTeamRosters } from "./team/loaders";
export { getTeamDetailsBySlug } from "./team/details";
export { extractClubRoot, findClubSisterTeams } from "./team/sisters";
export { getAllTeamSlugs, getAllTeamsList } from "./team/lists";
export { getHeadToHeadComparison } from "./team/headToHead";
