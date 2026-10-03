import { describe, expect, it } from "vitest";
import config from "../../next.config.mjs";

type Rule = { source: string; has: { key: string; value: string }[]; destination: string };

describe("eski ?city= adresleri için yönlendirme kuralları", () => {
  it("ASCII il slug'ını yönlendirir; all / ASCII dışı değerleri yönlendirmez", async () => {
    const rules = (await config.redirects?.()) as Rule[];
    expect(rules.map((r) => r.source)).toEqual(
      expect.arrayContaining(["/", "/fikstur", "/puan-durumu", "/sonuclar", "/gunun-maclari", "/grup-durumu"]),
    );
    const re = new RegExp(rules[0].has[0].value);
    expect(re.exec("istanbul")?.groups?.city).toBe("istanbul");
    expect(re.exec("Istanbul")?.groups?.city).toBe("Istanbul");
    expect(re.test("all")).toBe(false);
    expect(re.test("İstanbul")).toBe(false);
    expect(re.test("Tüm İller")).toBe(false);
    expect(re.test("")).toBe(false);
  });
});
