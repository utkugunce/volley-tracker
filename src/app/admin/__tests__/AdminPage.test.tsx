import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/utils/supabaseClient", () => ({
  getSupabaseClient: () => null,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import AdminPage from "../page";
import { VolleyboxBotTab } from "../_components/VolleyboxBotTab";

// Auth atlanmaz: yalnız giriş (oturumsuz) ekranının render'ı ve tema sınıfları denetlenir.
describe("Admin sayfası (oturumsuz giriş ekranı)", () => {
  it("giriş formunu, h1 başlığını ve main landmark'ını render eder", () => {
    render(<AdminPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Yönetim Paneli" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByLabelText("Supabase e-posta")).toBeInTheDocument();
    expect(screen.getByLabelText("Supabase şifre")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Supabase ile Giriş Yap/ })).toBeInTheDocument();
  });

  it("giriş düğmesi Fileönü 'done' tokenlarını kullanır (koyu metin / açık yeşil zemin)", () => {
    render(<AdminPage />);
    const btn = screen.getByRole("button", { name: /Supabase ile Giriş Yap/ });
    expect(btn.className).toContain("bg-done");
    expect(btn.className).toContain("text-done-fg");
  });

  it("panel kaynağında WCAG'a uymayan beyaz-üstü-orta-ton (red-500/blue-500 dolgu) kalmadı", async () => {
    const fs = await import("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../page.tsx"), "utf8");
    expect(src).not.toMatch(/bg-red-500 text-white/);
    expect(src).not.toMatch(/bg-blue-500 text-white/);
  });

  it("VolleyboxBotTab canlı konsol, canlı tarayıcı görünümü ve kontrol düğmelerini render eder", () => {
    render(<VolleyboxBotTab token="" />);
    expect(
      screen.getByRole("heading", { name: /Volleybox Otomatik Maç Ekleme Botu/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Canlı İşlem Günlüğü \(Adım Adım Bot Hareketleri\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Canlı Tarayıcı Görünümü \(Volleybox Form Ekranı\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Botu Başlat \(Maçları Ekle\)/ })
    ).toBeInTheDocument();
  });

  it("VolleyboxBotTab profesyonel lig seçeneklerini ve hızlı filtre haplarını içerir", () => {
    render(<VolleyboxBotTab token="" />);
    const select = screen.getByLabelText("Hedef İl / Turnuva");
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/⭐ Tüm Profesyonel Ligler/)).toBeInTheDocument();
    expect(screen.getByText(/TVF Kadınlar 2\. Ligi/)).toBeInTheDocument();
    expect(screen.getByText(/Arabica Coffee House Kadınlar Voleybol 1\. Ligi/)).toBeInTheDocument();
    expect(screen.getByText(/Vodafone Sultanlar Ligi/)).toBeInTheDocument();

    // Hızlı filtre butonları
    expect(screen.getByRole("button", { name: /⭐ Tüm Pro Ligler/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /🏐 Kadınlar 2\. Lig/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /🏐 Kadınlar 1\. Lig/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /🏐 Sultanlar Ligi/ })).toBeInTheDocument();
  });
});
