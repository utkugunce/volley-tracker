import React from "react";
import type { FormResult, TeamMatchSummary } from "@/utils/standingsForm";

export const FormDots = ({ form, source }: { form: FormResult[]; source?: TeamMatchSummary["formSource"] }) => {
  const padded: (FormResult | null)[] = [...form.slice(-5)];
  while (padded.length < 5) padded.push(null);
  return (
    <div
      className="flex items-center justify-center gap-1"
      role="img"
      aria-label={form.length ? `Son ${form.length} maç: ${form.map((f) => (f === "W" ? "G" : "M")).join(" ")}` : "Form verisi yok"}
      title={source === "standings" ? "Form: TVF puan tablosundan (yalnız oynanan maçlar)" : undefined}
    >
      {padded.map((f, i) =>
        f === null ? (
          <span key={i} className="h-[18px] w-[18px] rounded-full border border-dashed border-line" aria-hidden="true" />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] font-display text-[9px] font-bold leading-none ${
              f === "W" ? "border-done text-done" : "border-form-loss text-form-loss"
            }`}
          >
            {f === "W" ? "G" : "M"}
          </span>
        )
      )}
    </div>
  );
};
