import React from "react";

/** Temel iskelet bloğu. `motion-reduce` kullanıcıları için animasyon kapanır. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div aria-hidden="true" className={`animate-pulse motion-reduce:animate-none rounded-lg bg-slate-800/70 ${className}`} />
);

/** Erişilebilir yükleniyor kabı: ekran okuyuculara tek bir duyuru yapar. */
export const SkeletonRegion: React.FC<{ label?: string; className?: string; children: React.ReactNode }> = ({
  label = "Yükleniyor",
  className = "",
  children,
}) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
);

/** Sayfa üst çubuğu iskeleti (geri düğmesi + sağ aksiyonlar). */
export const SkeletonTopBar: React.FC = () => (
  <div aria-hidden="true" className="sticky top-0 z-30 bg-surface-muted/95 border-b border-slate-800">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-8 w-40" />
    </div>
  </div>
);

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = "" }) => (
  <div aria-hidden="true" className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 ${className}`}>
    <Skeleton className="h-4 w-1/3" />
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? "w-full" : "w-5/6"}`} />
    ))}
  </div>
);
