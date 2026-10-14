import { describe, it, expect } from "vitest";
import { buildClubPyramid } from "../team/clubPyramid";
type PyramidInput = Parameters<typeof buildClubPyramid>[0];

describe("buildClubPyramid", () => {
  it("returns null if clubTeams has 1 or fewer teams", () => {
    const singleTeam: PyramidInput = {
      teamName: "Tek Takım SK",
      clubTeams: [
        {
          teamName: "Tek Takım SK",
          slug: "tek-takim-sk",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/tek-takim-sk",
          isCurrent: true,
        },
      ],
    };
    expect(buildClubPyramid(singleTeam)).toBeNull();
  });

  it("categorizes teams into pyramid tiers (Senior, U18, U16, U14/U12, Other)", () => {
    const multiTeam: PyramidInput = {
      teamName: "Örnek Voleybol SK Genç Kız",
      clubTeams: [
        {
          teamName: "Örnek Voleybol SK A Takımı",
          slug: "ornek-voleybol-sk-a-takimi",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/ornek-voleybol-sk-a-takimi",
          leagueName: "Kadınlar 2. Lig 1. Grup",
          isCurrent: false,
        },
        {
          teamName: "Örnek Voleybol SK Genç Kız",
          slug: "ornek-voleybol-sk-genc-kiz",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/ornek-voleybol-sk-genc-kiz",
          ageCategory: "Genç",
          leagueName: "Genç Kızlar Süper Lig",
          isCurrent: true,
        },
        {
          teamName: "Örnek Voleybol SK Yıldız Kız",
          slug: "ornek-voleybol-sk-yildiz-kiz",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/ornek-voleybol-sk-yildiz-kiz",
          ageCategory: "Yıldız",
          leagueName: "Yıldız Kızlar 1. Lig",
          isCurrent: false,
        },
        {
          teamName: "Örnek Voleybol SK Küçük Kız",
          slug: "ornek-voleybol-sk-kucuk-kiz",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/ornek-voleybol-sk-kucuk-kiz",
          ageCategory: "Küçük",
          leagueName: "Küçük Kızlar A Grubu",
          isCurrent: false,
        },
        {
          teamName: "Örnek Voleybol SK Gelişim",
          slug: "ornek-voleybol-sk-gelisim",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/ornek-voleybol-sk-gelisim",
          leagueName: "Özel Gelişim Ligi",
          isCurrent: false,
        },
      ],
    };

    const pyramid = buildClubPyramid(multiTeam);
    expect(pyramid).not.toBeNull();
    if (!pyramid) return;

    expect(pyramid.totalTeams).toBe(5);
    expect(pyramid.tiers.length).toBe(5);

    const seniorTier = pyramid.tiers.find((t) => t.key === "senior");
    expect(seniorTier).toBeDefined();
    expect(seniorTier?.teams[0].teamName).toBe("Örnek Voleybol SK A Takımı");

    const u18Tier = pyramid.tiers.find((t) => t.key === "u18");
    expect(u18Tier).toBeDefined();
    expect(u18Tier?.teams[0].teamName).toBe("Örnek Voleybol SK Genç Kız");

    const u16Tier = pyramid.tiers.find((t) => t.key === "u16");
    expect(u16Tier).toBeDefined();
    expect(u16Tier?.teams[0].teamName).toBe("Örnek Voleybol SK Yıldız Kız");

    const u14Tier = pyramid.tiers.find((t) => t.key === "u14_u12");
    expect(u14Tier).toBeDefined();
    expect(u14Tier?.teams[0].teamName).toBe("Örnek Voleybol SK Küçük Kız");

    const otherTier = pyramid.tiers.find((t) => t.key === "other");
    expect(otherTier).toBeDefined();
    expect(otherTier?.teams[0].teamName).toBe("Örnek Voleybol SK Gelişim");
  });

  it("preserves isCurrent flag on the currently viewed team", () => {
    const data: PyramidInput = {
      teamName: "VakıfBank Genç",
      clubTeams: [
        {
          teamName: "VakıfBank Sultanlar",
          slug: "vakifbank-sultanlar",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/vakifbank-sultanlar",
          leagueName: "Vodafone Sultanlar Ligi",
          isCurrent: false,
        },
        {
          teamName: "VakıfBank Genç",
          slug: "vakifbank-genc",
          city: "istanbul",
          citySlug: "istanbul",
          path: "/takim/vakifbank-genc",
          ageCategory: "Genç",
          isCurrent: true,
        },
      ],
    };

    const result = buildClubPyramid(data);
    expect(result).not.toBeNull();
    const u18 = result?.tiers.find((t) => t.key === "u18");
    expect(u18?.teams[0].isCurrent).toBe(true);
  });
});
