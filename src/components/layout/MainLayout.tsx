"use client";

import React from "react";

export interface MainLayoutProps {
  header: React.ReactNode;
  leftSidebar?: React.ReactNode;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  header,
  leftSidebar,
  children,
  rightSidebar,
  footer,
  className = "",
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-[#121212] text-[#F1F5F9] font-sans antialiased selection:bg-blue-600 selection:text-white ${className}`}>
      {/* 1. Üstte Sabitlenen Header Alanı */}
      <div className="sticky top-0 z-40 bg-[#1E222D]/95 backdrop-blur-md border-b border-[#2A2E3D] shadow-xl">
        {header}
      </div>

      {/* 2. 3 Kolonlu Ana Grid Alanı */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto px-1 sm:px-2 md:px-3 lg:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-3.5 items-start">
          {/* Sol Kolon (%20): Sabitlenen favoriler, il ve yaş grubu bazlı hiyerarşik lig navigasyon ağacı */}
          {leftSidebar && (
            <aside 
              aria-label="Lig Navigasyonu"
              className="hidden lg:block lg:col-span-3 xl:col-span-2.5 sticky top-[65px] h-[calc(100vh-77px)] overflow-y-auto custom-scrollbar bg-[#1E222D] border border-[#2A2E3D] rounded-2xl my-3 shadow-lg"
            >
              {leftSidebar}
            </aside>
          )}

          {/* Orta Kolon (%52): Ana maç akışı, filtreler, fikstür ve sonuçlar */}
          <main 
            aria-label="Ana Maç Akışı ve İçerik"
            className={`w-full col-span-1 min-w-0 py-2 sm:py-3 space-y-4 ${
              leftSidebar && rightSidebar
                ? "lg:col-span-6 xl:col-span-6.5"
                : leftSidebar
                ? "lg:col-span-9 xl:col-span-9.5"
                : rightSidebar
                ? "lg:col-span-9 xl:col-span-9"
                : "lg:col-span-12"
            }`}
          >
            {children}
          </main>

          {/* Sağ Kolon (%28): Tıklanan maçı inceleyen bağlamsal detay paneli */}
          {rightSidebar && (
            <aside 
              aria-label="Maç Detay Paneli"
              className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-[65px] h-[calc(100vh-77px)] overflow-y-auto custom-scrollbar bg-[#1E222D] border border-[#2A2E3D] rounded-2xl my-3 shadow-lg"
            >
              {rightSidebar}
            </aside>
          )}
        </div>
      </div>

      {/* 3. Altbilgi (Footer) */}
      {footer && (
        <div className="mt-auto border-t border-[#2A2E3D] bg-[#181A20]">
          {footer}
        </div>
      )}
    </div>
  );
};
