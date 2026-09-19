"use client";

import React from "react";
import { Printer } from "lucide-react";

interface PrintScheduleButtonProps {
  title?: string;
  className?: string;
}

export const PrintScheduleButton: React.FC<PrintScheduleButtonProps> = ({
  title = "Bülten Yazdır / PDF",
  className = "",
}) => {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      onClick={handlePrint}
      type="button"
      className={`no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/70 hover:border-slate-600 transition-all active:scale-95 shadow-xs cursor-pointer ${className}`}
      title="Haftalık maç fikstürünü panoya asmak veya PDF olarak kaydetmek için yazdırın"
    >
      <Printer size={13} className="text-slate-400" />
      <span>{title}</span>
    </button>
  );
};
