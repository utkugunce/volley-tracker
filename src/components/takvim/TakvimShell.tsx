"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/Header";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { getAppRoute, type AppMainTab } from "@/utils/dashboardRoutes";

/**
 * /takvim sayfasının çerçevesi: diğer ana sayfalarla aynı Header (ana sekmeler) ve AppShell.
 * Sekme değişimleri ayrı rotalara yönlenir; veri çekilmez.
 */
export const TakvimShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const onSelectTab = (tab: AppMainTab) => router.push(getAppRoute(tab));
  return (
    <AppShell
      header={
        <Header
          activeTab="calendar"
          onSelectTab={onSelectTab}
          favoritesCount={0}
          showOnlyFavorites={false}
          onToggleFavoritesOnly={() => {}}
        />
      }
      footer={<DashboardFooter city={undefined} />}
    >
      <div className="max-w-6xl mx-auto w-full px-2 sm:px-3 space-y-4">{children}</div>
    </AppShell>
  );
};
