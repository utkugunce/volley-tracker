import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClubShell } from "@/components/club/ClubShell";
import { LoginForm } from "@/components/club/LoginForm";
import { getSessionUser, isAuthConfigured } from "@/utils/club/server";
import { safeNextPath } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sonraki?: string; hata?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.sonraki);

  if (isAuthConfigured()) {
    const user = await getSessionUser().catch(() => null);
    if (user) redirect(next);
  }

  return (
    <ClubShell title="Kulüp / Antrenör Girişi">
      <LoginForm next={next} errorKey={params.hata} />
    </ClubShell>
  );
}
