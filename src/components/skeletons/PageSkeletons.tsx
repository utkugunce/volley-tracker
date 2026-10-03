import React from "react";
import { MatchFeedSkeleton } from "@/components/common/SkeletonLoaders";
import { Skeleton, SkeletonCard, SkeletonRegion, SkeletonTopBar } from "./Skeleton";

/** Ana sayfa / il sayfaları: başlık, sekmeler ve maç listesi. */
export const DashboardSkeleton: React.FC = () => (
  <SkeletonRegion className="min-h-screen bg-canvas" label="Maç verileri yükleniyor">
    <div aria-hidden="true" className="bg-canvas/90 border-b border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-32 hidden sm:block" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 pb-2 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-24 shrink-0" />
        ))}
      </div>
    </div>
    <div aria-hidden="true" className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <MatchFeedSkeleton rows={8} />
    </div>
  </SkeletonRegion>
);

/** /takim/[slug]: takım başlığı, istatistik kartları ve maç listesi. */
export const TeamPageSkeleton: React.FC = () => (
  <SkeletonRegion className="min-h-screen bg-slate-900 pb-16" label="Takım sayfası yükleniyor">
    <SkeletonTopBar />
    <div aria-hidden="true" className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <SkeletonCard lines={5} />
      <SkeletonCard lines={4} />
    </div>
  </SkeletonRegion>
);

/** /istatistikler: başlık, kategori sekmeleri ve liderlik kartları. */
export const StatsPageSkeleton: React.FC = () => (
  <SkeletonRegion className="min-h-screen bg-slate-900 pb-16" label="İstatistikler yükleniyor">
    <SkeletonTopBar />
    <div aria-hidden="true" className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-28 shrink-0" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} lines={5} />
        ))}
      </div>
    </div>
  </SkeletonRegion>
);

/** /karsilastir: başlık, iki takım seçici ve karşılaştırma tablosu. */
export const ComparePageSkeleton: React.FC = () => (
  <SkeletonRegion className="min-h-screen bg-slate-900 pb-16" label="Karşılaştırma yükleniyor">
    <SkeletonTopBar />
    <div aria-hidden="true" className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      </div>
      <SkeletonCard lines={6} />
      <SkeletonCard lines={4} />
    </div>
  </SkeletonRegion>
);
