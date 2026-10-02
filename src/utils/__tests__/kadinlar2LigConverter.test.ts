import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  K2_CATEGORY,
  convertK2MatchToMatch,
  getKadinlar2LigMatchTeamNames,
  getKadinlar2LigTeamName,
  getKadinlar2LigTeamNameVariants,
  isKadinlar2LigMatchFavorite,
  kadinlar2LigMatchHasTeamQuery,
} from "../kadinlar2LigConverter";
import { getVolleyboxMapping } from "../volleybox";
import { Kadinlar2LigData, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

function baseMatch(overrides: Partial<Kadinlar2LigMatch> = {}): Kadinlar2LigMatch {
  return {
    id: "m1",
    mac_no: "1",
    grup_no: 1,
    grup_adi: "Grup 1",
    hafta: 1,
    devre: 1,
    tarih: "03.10.2026",
    gun: "CUMARTESİ",
    saat: "14:00",
    sehir: "İSTANBUL",
    salon: "Salon",
    takim_a: "ARNAVUTKÖY BLD. SPOR",
    takim_b: "BİLİNMEYEN TAKIM XYZ",
    takim_a_id: "1",
    takim_b_id: "2",
    takim_a_logo: "",
    takim_b_logo: "",
    set_a: "",
    set_b: "",
    skor: "- : -",
    set_sonuclari: "",
    durum: "OYNANACAK",
    mac_durumu_kod: "O",
    ...overrides,
  };
}

describe("getKadinlar2LigTeamName (Altyapı ile aynı eşleme mekanizması)", () => {
  it("JSON'daki volleybox_name'i önceliklendirir", () => {
    expect(getKadinlar2LigTeamName("ARNAVUTKÖY BLD. SPOR", "Özel Ad")).toBe("Özel Ad");
  });

  it("volleybox_name yoksa volleybox-mappings.json'daki matched_as ile çözer", () => {
    expect(getKadinlar2LigTeamName("ARNAVUTKÖY BLD. SPOR")).toBe("Arnavutköy Belediyesi SK");
    expect(getKadinlar2LigTeamName("ARNAVUTKÖY BLD. SPOR", null)).toBe("Arnavutköy Belediyesi SK");
  });

  it("sponsor eklenerek yeniden adlandırılan TVF takımlarını alias ile çözer", () => {
    expect(getKadinlar2LigTeamName("BUFF GYM PARS AKADEMİ")).toBe("Buff Gym Sivas Pars Akademi Spor Kulübü");
    expect(getKadinlar2LigTeamName("LANUEVA KOZMETİK ANADOLU MARMARA")).toBe("Lanueva Kozmetik Anadolu Marmara SK");
  });

  it("eşleşmeyen takımda hata vermeden mevcut (TVF) adı döndürür", () => {
    expect(getKadinlar2LigTeamName("  BİLİNMEYEN TAKIM XYZ ")).toBe("BİLİNMEYEN TAKIM XYZ");
    expect(getKadinlar2LigTeamName("", undefined)).toBe("");
    expect(getKadinlar2LigTeamName(undefined, undefined)).toBe("");
  });

  it("ad varyantları Volleybox adı + TVF adı içerir (favori/arama için)", () => {
    expect(getKadinlar2LigTeamNameVariants("ARNAVUTKÖY BLD. SPOR")).toEqual([
      "Arnavutköy Belediyesi SK",
      "ARNAVUTKÖY BLD. SPOR",
    ]);
    expect(getKadinlar2LigTeamNameVariants("BİLİNMEYEN TAKIM XYZ")).toEqual(["BİLİNMEYEN TAKIM XYZ"]);
  });
});

describe("Kadınlar 2. Ligi maç dönüştürücü", () => {
  it("takım adlarını Volleybox adına çevirir; eşleşmeyen takımda TVF adı kalır", () => {
    const m = baseMatch();
    expect(getKadinlar2LigMatchTeamNames(m)).toEqual({
      home: "Arnavutköy Belediyesi SK",
      away: "BİLİNMEYEN TAKIM XYZ",
    });
    const converted = convertK2MatchToMatch(m);
    expect(converted.home_team).toBe("Arnavutköy Belediyesi SK");
    expect(converted.away_team).toBe("BİLİNMEYEN TAKIM XYZ");
    expect(converted.category).toBe(K2_CATEGORY);
  });

  it("maçtaki takim_x_volleybox_name değerini kullanır", () => {
    const converted = convertK2MatchToMatch(
      baseMatch({ takim_b: "ESKİ AD", takim_b_volleybox_name: "Volleybox Adı" })
    );
    expect(converted.away_team).toBe("Volleybox Adı");
  });

  it("favori ve arama hem Volleybox hem TVF adıyla çalışır", () => {
    const m = baseMatch();
    expect(isKadinlar2LigMatchFavorite(m, (n) => n === "Arnavutköy Belediyesi SK")).toBe(true);
    expect(isKadinlar2LigMatchFavorite(m, (n) => n === "ARNAVUTKÖY BLD. SPOR")).toBe(true);
    expect(isKadinlar2LigMatchFavorite(m, () => false)).toBe(false);
    expect(kadinlar2LigMatchHasTeamQuery(m, "belediyesi sk")).toBe(true);
    expect(kadinlar2LigMatchHasTeamQuery(m, "bld. spor")).toBe(true);
    expect(kadinlar2LigMatchHasTeamQuery(m, "yok böyle")).toBe(false);
  });
});

describe("data/kadinlar_2_lig.json Volleybox ad kapsamı", () => {
  const data: Kadinlar2LigData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "kadinlar_2_lig.json"), "utf-8")
  );

  it("tüm takımlar Volleybox adına çözülür ve JSON ile eşleme dosyası tutarlıdır", () => {
    const unresolved: string[] = [];
    const mismatched: string[] = [];
    for (const t of data.tum_takimlar) {
      if (!t.volleybox_name || !t.volleybox_url) {
        unresolved.push(t.takim_adi);
        continue;
      }
      const mapping = getVolleyboxMapping(t.takim_adi, K2_CATEGORY);
      if (!mapping || mapping.matched_as !== t.volleybox_name || mapping.volleybox_url !== t.volleybox_url) {
        mismatched.push(t.takim_adi);
      }
    }
    expect(unresolved).toEqual([]);
    expect(mismatched).toEqual([]);
    expect(data.metadata.volleybox_eslesme_sayisi).toBe(data.tum_takimlar.length);
  });

  it("maç satırlarındaki Volleybox adları takım kayıtlarıyla aynıdır", () => {
    const byName = new Map(data.tum_takimlar.map((t) => [t.takim_adi, t]));
    for (const m of data.tum_maclar) {
      expect(m.takim_a_volleybox_name).toBe(byName.get(m.takim_a)?.volleybox_name);
      expect(m.takim_b_volleybox_name).toBe(byName.get(m.takim_b)?.volleybox_name);
    }
  });
});
