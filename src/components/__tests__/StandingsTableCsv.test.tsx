import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  StandingsTable,
  generateStandingsCsv,
  downloadStandingsCsv,
} from "../StandingsTable";
import { StandingItem } from "@/types/fixture";

describe("Puan Durumu CSV Dışa Aktarma (GÖREV 7)", () => {
  const mockItems: StandingItem[] = [
    {
      rank: 1,
      team: "Eczacıbaşı",
      played: 8,
      won: 8,
      lost: 0,
      points: 24,
      sets_won: 24,
      sets_lost: 2,
      set_ratio: "12.000",
      points_won: 650,
      points_lost: 480,
      point_ratio: "1.354",
      form: ["W", "W", "W", "W", "W"],
    },
    {
      rank: 2,
      team: "VakıfBank Spor Kulübü; Genç Takım", // noktalı virgüllü isim testi
      played: 8,
      won: 7,
      lost: 1,
      points: 21,
      sets_won: 22,
      sets_lost: 5,
      set_ratio: "4.400",
      points_won: 640,
      points_lost: 510,
      point_ratio: "1.255",
      form: ["W", "W", "L", "W", "W"],
    },
  ];

  describe("generateStandingsCsv", () => {
    it("çıktının başına Türkçe Excel için UTF-8 BOM (\uFEFF) ekler", () => {
      const csv = generateStandingsCsv(mockItems);
      expect(csv.charCodeAt(0)).toBe(0xfeff);
    });

    it("doğru sütun başlıklarını ve ';' ayırıcısını kullanır", () => {
      const csv = generateStandingsCsv(mockItems);
      const lines = csv.split("\r\n");
      const header = lines[0].replace("\uFEFF", "");
      expect(header).toBe(
        "Sıra;Takım;Oynadığı;Galibiyet;Mağlubiyet;Puan;Aldığı Set;Verdiği Set;Set Oranı;Aldığı Sayı;Verdiği Sayı;Sayı Oranı"
      );
    });

    it("verileri doğru sırayla satırlara yazar", () => {
      const csv = generateStandingsCsv(mockItems);
      const lines = csv.split("\r\n");
      expect(lines).toHaveLength(3); // Header + 2 rows

      const row1 = lines[1].split(";");
      expect(row1[0]).toBe("1"); // Sıra
      expect(row1[1]).toBe("Eczacıbaşı"); // Takım
      expect(row1[2]).toBe("8"); // O
      expect(row1[3]).toBe("8"); // G
      expect(row1[4]).toBe("0"); // M
      expect(row1[5]).toBe("24"); // Puan
      expect(row1[6]).toBe("24"); // AS
      expect(row1[7]).toBe("2"); // YS
      expect(row1[8]).toBe("12.000"); // Set Oranı
      expect(row1[9]).toBe("650"); // Aldığı Sayı
      expect(row1[10]).toBe("480"); // Verdiği Sayı
      expect(row1[11]).toBe("1.354"); // Sayı Oranı
    });

    it("noktalı virgül veya tırnak içeren takım isimlerini tırnak içine alır", () => {
      const csv = generateStandingsCsv(mockItems);
      const lines = csv.split("\r\n");
      const row2Raw = lines[2];
      expect(row2Raw).toContain('"VakıfBank Spor Kulübü; Genç Takım"');
    });
  });

  describe("StandingsTable UI Entegrasyonu", () => {
    const mockStandingsData = {
      "Genç Kızlar Süper Lig - A Grubu": mockItems,
    };

    it("puan durumu tablosu başlığında 'CSV İndir' butonunu gösterir", () => {
      render(
        <StandingsTable
          standingsData={mockStandingsData}
          city="İstanbul"
        />
      );

      const downloadButton = screen.getByRole("button", {
        name: "Puan durumunu CSV olarak indir",
      });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toHaveTextContent("CSV İndir");
    });

    it("CSV İndir butonuna tıklandığında indirme akışını tetikler", () => {
      // Mock URL.createObjectURL & document.createElement
      const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-csv");
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === "a") {
          el.click = clickSpy;
        }
        return el;
      });

      render(
        <StandingsTable
          standingsData={mockStandingsData}
          city="İstanbul"
        />
      );

      const downloadButton = screen.getByRole("button", {
        name: "Puan durumunu CSV olarak indir",
      });
      fireEvent.click(downloadButton);

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
    });
  });
});
