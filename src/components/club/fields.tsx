import React from "react";

export const inputCls =
  "w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm outline-none focus:border-primary";
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-ink-2 hover:text-ink disabled:opacity-50";

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-xs font-bold text-ink-2 ${className}`}>
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
