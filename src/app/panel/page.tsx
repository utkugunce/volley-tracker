import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClubShell, SetupNotice } from "@/components/club/ClubShell";
import { PanelClient } from "@/components/club/PanelClient";
import { getSessionUser, isAuthConfigured } from "@/utils/club/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kulüp Paneli",
  robots: { index: false, follow: false },
};

export default async function PanelPage() {
  if (!isAuthConfigured() || !getSupabaseAdmin()) {
    return (
      <ClubShell title="Kulüp Paneli">
        <SetupNotice kind="not_configured" />
      </ClubShell>
    );
  }

  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/giris?sonraki=/panel");

  return (
    <ClubShell title="Kulüp Paneli">
      <PanelClient email={user.email ?? ""} />
    </ClubShell>
  );
}
