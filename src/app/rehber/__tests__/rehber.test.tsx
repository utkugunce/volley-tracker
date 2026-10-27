import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RehberPage, { metadata as rehberMetadata } from "../page";
import GuideDetailPage, {
  generateStaticParams,
  generateMetadata,
} from "../[slug]/page";
import { getAllGuides } from "@/data/guides";
import sitemap from "@/app/sitemap";

describe("/rehber Sayfa ve SEO Testleri", () => {
  it("rehber ana sayfa metadata başlığı marka ekini çift içermez", () => {
    const title = rehberMetadata.title as string;
    expect(title).toBeDefined();
    expect(title).not.toContain(" | Altyapı Voleybol");
    expect(title).not.toContain(" — Altyapı Voleybol");
  });

  it("rehber ana sayfası bileşenlerini ve öne çıkan kartları render eder", () => {
    render(<RehberPage />);

    expect(
      screen.getByRole("heading", { name: "Voleybol Rehberi & Kılavuzlar", level: 1 })
    ).toBeInTheDocument();

    expect(screen.getByText("Öne Çıkan Temel Kılavuzlar")).toBeInTheDocument();
    expect(screen.getByText("Tüm Rehber ve Kılavuz Makaleleri")).toBeInTheDocument();
  });

  it("arama ve filtreleme kutusu girdi ile kılavuzları filtreler", () => {
    render(<RehberPage />);

    const searchInput = screen.getByPlaceholderText(/Rehberde ara/);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "averaj" } });
    const matches = screen.getAllByText("Voleybolda Puan Durumu ve Averaj Nasıl Hesaplanır?");
    expect(matches.length).toBeGreaterThanOrEqual(1);

    fireEvent.change(searchInput, { target: { value: "bulunmayanbiraramaifadesi999" } });
    expect(screen.getByText("Aradığınız kriterlere uygun rehber bulunamadı")).toBeInTheDocument();
  });

  it("generateStaticParams tüm rehber slug'larını içerir", async () => {
    const params = await generateStaticParams();
    const guides = getAllGuides();
    expect(params.length).toBe(guides.length);

    const slugs = params.map((p) => p.slug);
    for (const g of guides) {
      expect(slugs).toContain(g.slug);
    }
  });

  it("generateMetadata dinamik rehber için doğru başlık üretir", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "puan-durumu-ve-averaj-hesaplama" }),
    });

    expect(meta.title).toBe("Voleybolda Puan Durumu ve Averaj Nasıl Hesaplanır?");
    expect(meta.openGraph?.type).toBe("article");
  });

  it("generateMetadata bulunamayan slug için güvenli başlık döner", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "olmayan-rehber-slug" }),
    });

    expect(meta.title).toBe("Rehber Bulunamadı");
  });

  it("detay sayfası geçerli rehberi başlık, bölümler ve FAQ ile render eder", async () => {
    const ui = await GuideDetailPage({
      params: Promise.resolve({ slug: "puan-durumu-ve-averaj-hesaplama" }),
    });
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: "Voleybolda Puan Durumu ve Averaj Nasıl Hesaplanır?",
        level: 1,
      })
    ).toBeInTheDocument();

    const sections = screen.getAllByText(/3-2-1-0 Puanlama Sistemi/);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Sıkça Sorulan Sorular (SSS)")).toBeInTheDocument();
  });

  it("sitemap /rehber ve tüm rehber makalelerini içerir", () => {
    const sm = sitemap();
    const urls = sm.map((item) => item.url);

    expect(urls).toContain("https://altyapivoleybol.com.tr/rehber");
    expect(urls).toContain(
      "https://altyapivoleybol.com.tr/rehber/puan-durumu-ve-averaj-hesaplama"
    );
    expect(urls).toContain(
      "https://altyapivoleybol.com.tr/rehber/tvf-altyapi-yas-kategorileri-ve-kurallari"
    );
  });
});
