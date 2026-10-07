import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  compactKadinlar2LigData,
  expandKadinlar2LigData,
  isCompactKadinlar2LigData,
} from "../kadinlar2LigPayload";
import type { Kadinlar2LigData } from "@/types/kadinlar2Lig";

function loadData(): Kadinlar2LigData {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "kadinlar_2_lig.json"), "utf-8"));
}

describe("kadinlar2LigPayload", () => {
  it("grup fikstürlerini indekslere çevirir ve aynı yapıya geri açar", () => {
    const data = loadData();
    const compact = compactKadinlar2LigData(data);
    expect(isCompactKadinlar2LigData(compact)).toBe(true);

    const expanded = expandKadinlar2LigData(compact);
    expect(expanded.gruplar.length).toBe(data.gruplar.length);
    expanded.gruplar.forEach((group, i) => {
      const original = data.gruplar[i];
      expect(group.grup_no).toBe(original.grup_no);
      expect(group.puan_durumu).toEqual(original.puan_durumu);
      expect(group.fikstur.map((m) => m.id)).toEqual(original.fikstur.map((m) => m.id));
      expect(group.fikstur.map((m) => ({ ...m, takim_a_logo: "", takim_b_logo: "" }))).toEqual(
        original.fikstur.map((m) => ({ ...m, takim_a_logo: "", takim_b_logo: "" }))
      );
    });
    expect(expanded.tum_maclar.length).toBe(data.tum_maclar.length);
    expect(expanded.metadata).toEqual(data.metadata);
    expect(expanded.tum_takimlar).toEqual(data.tum_takimlar);
  });

  it("serileştirilmiş yükü belirgin biçimde küçültür", () => {
    const data = loadData();
    const full = JSON.stringify(data).length;
    const compact = JSON.stringify(compactKadinlar2LigData(data)).length;
    expect(compact).toBeLessThan(full * 0.7);
  });

  it("eşleşmeyen grup maçı varsa veriyi sıkıştırmadan döndürür", () => {
    const data = loadData();
    const broken = {
      ...data,
      gruplar: [{ ...data.gruplar[0], fikstur: [{ ...data.gruplar[0].fikstur[0], id: "yok" }] }],
    };
    const result = compactKadinlar2LigData(broken);
    expect(isCompactKadinlar2LigData(result)).toBe(false);
    expect(expandKadinlar2LigData(result)).toBe(broken);
  });

  it("tam veri expand edildiğinde aynen döner", () => {
    const data = loadData();
    expect(expandKadinlar2LigData(data)).toBe(data);
  });
});
