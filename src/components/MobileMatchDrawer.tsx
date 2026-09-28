"use client";

import React, { useState, useRef, useEffect } from "react";
import { Match, StandingItem } from "@/types/fixture";
import { MatchInspectorPanel } from "./match/MatchInspectorPanel";

export interface MobileMatchDrawerProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  allMatches?: Match[];
  standings?: Record<string, StandingItem[]>;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export const MobileMatchDrawer: React.FC<MobileMatchDrawerProps> = ({
  isOpen,
  match,
  onClose,
  allMatches = [],
  standings = {},
  onToggleFavorite,
  isFavorite = false,
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const currentDragY = useRef(0);

  // ESC tuşuyla kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Swipe down (Aşağı kaydırarak kapatma) dokunmatik işleyicileri
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentDragY.current = 0;
    setDragY(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      currentDragY.current = deltaY;
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentDragY.current > 100) {
      onClose();
    }
    setDragY(0);
    currentDragY.current = 0;
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
      {/* 1. Arka Plan Karartması (Backdrop) */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 motion-reduce:animate-none animate-[drawer-backdrop-in_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Alttan Açılan Çekmece (Bottom Sheet Sheet Drawer) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Maç Detayı"
        className="relative z-10 w-full max-h-[85vh] bg-[#1E222D] border-t border-[#2A2E3D] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden motion-reduce:animate-none animate-[drawer-sheet-in_280ms_cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Çekmece Tepe Çubuğu (Drag Handle Bar) */}
        <div
          className="w-full pt-3 pb-1.5 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="my-2 h-1 w-10 rounded-full bg-slate-600 transition-colors active:bg-slate-500" />
        </div>

        {/* Çekmece İçeriği: MatchInspectorPanel */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8 custom-scrollbar">
          <MatchInspectorPanel
            match={match}
            allMatches={allMatches}
            standings={standings}
            onClose={onClose}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        </div>
      </div>
    </div>
  );
};
