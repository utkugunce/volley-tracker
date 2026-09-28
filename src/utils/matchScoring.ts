import type { Match } from "@/types/fixture";

export const isMatchScored = (match: Match): boolean => {
  if (match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined) return true;
  if (match.score && match.score.trim() !== "" && match.score.trim() !== "- : -" && match.score.toLowerCase() !== "vs") return true;
  if (match.volleybox?.has_score && match.volleybox?.score) return true;
  return false;
};