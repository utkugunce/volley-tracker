"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/arc/button/button";

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
    <Button
      onClick={handlePrint}
      type="button"
      variant="secondary"
      size="sm"
      className={`no-print cursor-pointer ${className}`}
      title="Haftalık maç fikstürünü panoya asmak veya PDF olarak kaydetmek için yazdırın"
    >
      <Printer size={13} className="text-slate-400 mr-1.5" />
      <span>{title}</span>
    </Button>
  );
};
