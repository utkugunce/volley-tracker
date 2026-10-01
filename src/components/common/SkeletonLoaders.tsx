"use client";

import React from "react";

/**
 * Tekil maç satırı iskeleti (CompactMatchRow karşılığı)
 * min-h-[46px] yükseklik ve sıfır CLS (Cumulative Layout Shift)
 */
export const MatchRowSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Maç bilgisi yükleniyor"
      className="flex items-center min-h-[46px] px-2.5 py-1.5 border-b border-line/50 bg-surface-muted animate-pulse select-none"
    >
      {/* Sol: Saat & Durum */}
      <div className="w-[74px] shrink-0 flex flex-col justify-center gap-1 pr-1.5 border-r border-line/40">
        <div className="h-3.5 w-12 rounded bg-slate-700/50" />
        <div className="h-2.5 w-9 rounded bg-slate-800/70" />
      </div>

      {/* Orta: Takımlar */}
      <div className="flex-1 min-w-0 flex items-center justify-between px-2.5">
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 pr-2">
          {/* Ev Sahibi */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-700/60 shrink-0" />
            <div className="h-3 w-32 max-w-[65%] rounded bg-slate-700/50" />
          </div>
          {/* Deplasman */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-700/60 shrink-0" />
            <div className="h-3 w-28 max-w-[60%] rounded bg-slate-700/50" />
          </div>
        </div>

        {/* Set Skorları (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 pr-2.5">
          <div className="w-6 h-6 rounded bg-slate-800/60" />
          <div className="w-6 h-6 rounded bg-slate-800/60" />
          <div className="w-6 h-6 rounded bg-slate-800/60" />
        </div>

        {/* Toplam Skor */}
        <div className="w-[32px] shrink-0 flex flex-col items-center justify-center gap-1 pl-1.5 border-l border-line/40">
          <div className="w-3.5 h-3 rounded bg-slate-700/60" />
          <div className="w-3.5 h-3 rounded bg-slate-700/60" />
        </div>
      </div>

      {/* Sağ: Aksiyon Butonları */}
      <div className="w-[46px] shrink-0 flex items-center justify-end gap-1.5 pl-1.5">
        <div className="w-4 h-4 rounded-full bg-slate-800/70" />
      </div>
    </div>
  );
};

/**
 * Kart görünümlü maç iskeleti (Dashboard & Günün Maçları Grid kartı)
 */
export const MatchCardSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Maç kartı yükleniyor"
      className="glass-panel border border-slate-800/80 bg-slate-900/60 rounded-2xl p-4 animate-pulse space-y-3.5"
    >
      {/* Üst Kısım: Lig / Kategori & Saat */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 rounded bg-sky-900/40" />
          <div className="h-3.5 w-24 rounded bg-slate-700/50" />
        </div>
        <div className="h-4 w-14 rounded-full bg-slate-800/70" />
      </div>

      {/* Takımlar ve Skor Alanı */}
      <div className="space-y-2.5">
        {/* Ev Sahibi */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-xl bg-slate-800/20">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-700/60 shrink-0" />
            <div className="h-3.5 w-36 max-w-[70%] rounded bg-slate-700/60" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-700/50 shrink-0" />
        </div>
        {/* Deplasman */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-xl bg-slate-800/20">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-700/60 shrink-0" />
            <div className="h-3.5 w-32 max-w-[65%] rounded bg-slate-700/60" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-700/50 shrink-0" />
        </div>
      </div>

      {/* Alt Bilgi: Salon & Set Skorları */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <div className="h-3 w-28 rounded bg-slate-800/70" />
        <div className="flex items-center gap-1">
          <div className="h-4 w-9 rounded bg-slate-800/60" />
          <div className="h-4 w-9 rounded bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
};

/**
 * Fikstür ve Sonuçlar akışı için lig başlıklı iskelet liste
 */
export const MatchFeedSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-4">
      {/* Tarih / Durum Filtre Şeridi İskeleti */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-lg bg-slate-800/70" />
          <div className="h-7 w-20 rounded-lg bg-slate-800/70" />
          <div className="h-7 w-20 rounded-lg bg-slate-800/70" />
        </div>
        <div className="h-7 w-28 rounded-lg bg-slate-800/70" />
      </div>

      {/* 1. Lig Bölümü */}
      <div className="rounded-xl border border-line bg-surface-muted overflow-hidden shadow-sm animate-pulse">
        <div className="flex items-center justify-between px-3 py-2.5 bg-panel border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-700/60" />
            <div className="h-3.5 w-40 rounded bg-slate-700/60" />
          </div>
          <div className="h-4 w-12 rounded bg-slate-800/60" />
        </div>
        <div className="divide-y divide-line/50">
          {Array.from({ length: rows }).map((_, i) => (
            <MatchRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Puan Durumu Tablosu İskeleti
 */
export const StandingsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div
      role="status"
      aria-label="Puan durumu tablosu yükleniyor"
      className="space-y-4 animate-pulse select-none"
    >
      {/* Filtre Barı İskeleti */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-xl bg-slate-800/80" />
          <div className="h-8 w-24 rounded-xl bg-slate-800/80" />
          <div className="h-8 w-28 rounded-xl bg-slate-800/80" />
        </div>
        <div className="h-7 w-20 rounded-lg bg-slate-800/60" />
      </div>

      {/* Tablo Kartı */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 overflow-hidden shadow-sm">
        {/* Tablo Başlık Barı */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="h-4 w-48 rounded bg-slate-700/60" />
          <div className="h-6 w-16 rounded-lg bg-slate-800/60" />
        </div>

        {/* Tablo Gövdesi */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-500 border-b border-slate-800/70 text-[10px] uppercase">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-4 text-left">Takım</th>
                <th className="py-2.5 px-2 text-center w-8">O</th>
                <th className="py-2.5 px-2 text-center w-8">G</th>
                <th className="py-2.5 px-2 text-center w-8">M</th>
                <th className="py-2.5 px-2 text-center w-8">AS</th>
                <th className="py-2.5 px-2 text-center w-8">VS</th>
                <th className="py-2.5 px-2 text-center w-12">Oran</th>
                <th className="py-2.5 px-3 text-center w-12 font-bold">Puan</th>
                <th className="py-2.5 px-3 text-center w-20">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {Array.from({ length: rows }).map((_, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="py-3 px-3 text-center">
                    <div className="w-4 h-4 mx-auto rounded bg-slate-800/70" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-700/60 shrink-0" />
                      <div className="h-3.5 w-36 max-w-[80%] rounded bg-slate-700/50" />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center"><div className="w-4 h-3 mx-auto rounded bg-slate-800/60" /></td>
                  <td className="py-3 px-2 text-center"><div className="w-4 h-3 mx-auto rounded bg-slate-800/60" /></td>
                  <td className="py-3 px-2 text-center"><div className="w-4 h-3 mx-auto rounded bg-slate-800/60" /></td>
                  <td className="py-3 px-2 text-center"><div className="w-4 h-3 mx-auto rounded bg-slate-800/60" /></td>
                  <td className="py-3 px-2 text-center"><div className="w-4 h-3 mx-auto rounded bg-slate-800/60" /></td>
                  <td className="py-3 px-2 text-center"><div className="w-6 h-3 mx-auto rounded bg-slate-800/60" /></td>
                  <td className="py-3 px-3 text-center"><div className="w-6 h-4 mx-auto rounded bg-slate-700/60" /></td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-800/70" />
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-800/70" />
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-800/70" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * Ana Sayfa Portalı için İskelet (Hero + Hızlı Filtreler + Maç Kartları + Alt Izgara)
 */
export const HomePortalSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Ana sayfa portali yükleniyor"
      className="space-y-4 animate-pulse select-none"
    >
      {/* 1. Canlı Merkez Banner İskeleti */}
      <div className="glass-panel border border-slate-800/80 bg-slate-900/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              <div className="h-4 w-44 rounded bg-slate-700/60" />
            </div>
            <div className="h-3 w-64 max-w-[85%] rounded bg-slate-800/70" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-800/70" />
            <div className="h-6 w-16 rounded-full bg-slate-800/70" />
          </div>
        </div>
      </div>

      {/* 2. Filtre Butonları ve Hızlı Şehir Hapları */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-20 rounded-lg bg-slate-800/80" />
          <div className="h-8 w-24 rounded-lg bg-slate-800/80" />
          <div className="h-8 w-24 rounded-lg bg-slate-800/80" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-12 rounded-lg bg-slate-800/60" />
          <div className="h-7 w-16 rounded-lg bg-slate-800/60" />
          <div className="h-7 w-16 rounded-lg bg-slate-800/60" />
        </div>
      </div>

      {/* 3. Maç Kartları Izgarası (2 Sütun) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>

      {/* 4. Alt Grup Liderleri & Aktif İller 2 Sütunlu Izgara İskeleti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        <div className="glass-panel border border-slate-800/80 bg-slate-900/50 rounded-2xl p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-slate-700/60" />
          <div className="space-y-2">
            <div className="h-9 rounded-xl bg-slate-800/40" />
            <div className="h-9 rounded-xl bg-slate-800/40" />
            <div className="h-9 rounded-xl bg-slate-800/40" />
          </div>
        </div>
        <div className="glass-panel border border-slate-800/80 bg-slate-900/50 rounded-2xl p-4 space-y-3">
          <div className="h-4 w-28 rounded bg-slate-700/60" />
          <div className="space-y-2">
            <div className="h-9 rounded-xl bg-slate-800/40" />
            <div className="h-9 rounded-xl bg-slate-800/40" />
            <div className="h-9 rounded-xl bg-slate-800/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sekmeye özel akıllı iskelet yükleyici bileşeni (Dashboard & Sekme Geçişlerinde CLS'yi sıfırlar)
 */
export const TabViewSkeleton: React.FC<{ tab?: string }> = ({ tab = "home" }) => {
  switch (tab) {
    case "standings":
    case "group-status":
      return <StandingsTableSkeleton />;
    case "fixtures":
    case "results":
      return <MatchFeedSkeleton rows={6} />;
    case "today":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse">
            <div className="h-6 w-36 rounded bg-slate-700/60" />
            <div className="h-6 w-20 rounded bg-slate-800/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        </div>
      );
    case "home":
    default:
      return <HomePortalSkeleton />;
  }
};
