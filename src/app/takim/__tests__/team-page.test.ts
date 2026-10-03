import { describe, it, expect } from "vitest";
import { buildTeamMetadata, getTeamCanonicalPath } from "../team-page";

describe("takım sayfası SEO", () => {
  it("kanonik yolu şehir varyantıyla ve varyantsız üretir", () => {
    expect(getTeamCanonicalPath("zeren")).toBe("/takim/zeren");
    expect(getTeamCanonicalPath("vakifbank", "İzmir")).toBe("/takim/vakifbank/%C4%B0zmir");
  });

  it("var olan takım için başlık (şablon eki olmadan), açıklama, canonical ve puan durumu bilgisi üretir", async () => {
    const meta = await buildTeamMetadata("zeren");
    expect(meta.title).toBe("Zeren Spor Kulübü U18");
    expect(String(meta.description)).toContain("puan durumunda");
    expect(meta.alternates?.canonical).toBe("https://altyapivoleybol.com.tr/takim/zeren");
    expect(meta.robots).toBeUndefined();
  });

  it("olmayan takım için noindex döner", async () => {
    const meta = await buildTeamMetadata("yok-boyle-takim-9");
    expect(meta.robots).toMatchObject({ index: false });
    expect(meta.alternates).toBeUndefined();
  });
});
