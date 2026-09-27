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
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Alttan Açılan Çekmece (Bottom Sheet Sheet Drawer) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Maç Detayı"
        className="relative z-10 w-full max-h-[90vh] bg-[#1E222D] border-t border-[#2A2E3D] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out"
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
        >
          <div className="w-12 h-1.5 rounded-full bg-[#475569] active:bg-[#64748B] transition-colors" />
        </div>

        {/* Çekmece İçeriği: MatchInspectorPanel */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
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
