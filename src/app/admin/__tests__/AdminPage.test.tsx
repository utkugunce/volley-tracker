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
});
