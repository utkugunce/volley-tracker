import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamVolleyboxLink } from "../TeamVolleyboxLink";

describe("TeamVolleyboxLink", () => {
  it("shows the mapped official name and profile for the Bizimkent U16 B team", () => {
    const sourceName = "Bizimkent Voleybol Spor Kulübü U16 - B";
    const officialName = "Bizimkent Spor Kulübü U16";
    const profileUrl = "https://women.volleybox.net/tr/bizimkent-spor-kulubu-u16-t54145";

    render(
      <TeamVolleyboxLink
        teamName={sourceName}
        category="Yıldız Kızlar Süper Lig"
        city="İstanbul"
        showLogo={false}
        showFavoriteButton={false}
      >
        {sourceName}
      </TeamVolleyboxLink>
    );

    expect(screen.getByRole("link", { name: officialName })).toHaveAttribute(
      "href",
      "/takim/bizimkent-spor-kulubu-u16?sehir=istanbul"
    );
    expect(screen.getByTitle(`${officialName} — Volleybox Takım Profili`)).toHaveAttribute(
      "href",
      profileUrl
    );
  });

  it("shows the mapped official name for Bizimkent İlkokulu in the U18 1st league", () => {
    const officialName = "Bizimkent İlkokulu Spor Kulübü U18";
    const profileUrl = "https://women.volleybox.net/tr/bizimkent-lkokulu-spor-kulubu-u18-t47013";

    render(
      <TeamVolleyboxLink
        teamName="Bizimkent İlkokulu"
        category="Genç Kızlar 1. Ligi - 5. Bölge"
        city="İstanbul"
        showLogo={false}
        showFavoriteButton={false}
      >
        Bizimkent İlkokulu
      </TeamVolleyboxLink>
    );

    expect(screen.getByRole("link", { name: officialName })).toBeInTheDocument();
    expect(screen.getByTitle(`${officialName} — Volleybox Takım Profili`)).toHaveAttribute(
      "href",
      profileUrl
    );
  });

  it("shows the mapped B-team name for the İzmir 1. Lig C-group Dost fixture", () => {
    const officialName = "Dost Spor - B U18";
    const profileUrl = "https://women.volleybox.net/tr/dost-spor-u18-t53583";

    render(
      <TeamVolleyboxLink
        teamName="Dost Spor U18"
        category="Genç Kızlar 1. Ligi - Genç Kız - C Gr"
        city="İzmir"
        showLogo={false}
        showFavoriteButton={false}
      >
        Dost Spor U18
      </TeamVolleyboxLink>
    );

    expect(screen.getByRole("link", { name: officialName })).toBeInTheDocument();
    expect(screen.getByTitle(`${officialName} — Volleybox Takım Profili`)).toHaveAttribute(
      "href",
      profileUrl
    );
  });

  it("shows the mapped Çanakkalespor U16 name for the legacy Çanakkale source name", () => {
    const officialName = "Çanakkalespor U16";
    const profileUrl = "https://women.volleybox.net/tr/canakkalespor-u16-t44826";

    render(
      <TeamVolleyboxLink
        teamName="Çanakkale Belediyespor"
        category="Yıldız Kızlar Süper Lig"
        city="Çanakkale"
        showLogo={false}
        showFavoriteButton={false}
      >
        Çanakkale Belediyespor
      </TeamVolleyboxLink>
    );

    expect(screen.getByRole("link", { name: officialName })).toBeInTheDocument();
    expect(screen.getByTitle(`${officialName} — Volleybox Takım Profili`)).toHaveAttribute(
      "href",
      profileUrl
    );
  });
});