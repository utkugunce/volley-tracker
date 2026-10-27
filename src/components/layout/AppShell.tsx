"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThemeTokens } from "./ThemeTokens";
import { PanelLeftOpen } from "lucide-react";

export interface AppShellProps {
  header: React.ReactNode;
  leftSidebar?: React.ReactNode;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  inspector?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  section?: "altyapi" | "kadinlar-2-lig" | "sultanlar" | "kadinlar-1-lig";
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  leftSidebar,
  children,
  rightSidebar,
  inspector,
  footer,
  className = "",
  section = "altyapi",
}) => {
  const [headerHeight, setHeaderHeight] = useState(64);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // localStorage'dan lig ağacı daraltma tercihini oku
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("app_left_sidebar_collapsed");
        if (stored === "true") {
          setIsLeftCollapsed(true);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleToggleLeftCollapse = () => {
    setIsLeftCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("app_left_sidebar_collapsed", String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const el = headerRef.current;
    const root = rootRef.current;
    if (!el) return;

    let lastHeight = 0;
    const apply = () => {
      const h = el.offsetHeight;
      if (h > 0 && h !== lastHeight) {
        lastHeight = h;
        setHeaderHeight((prev) => (prev !== h ? h : prev));
        root?.style.setProperty("--app-header-h", `${h}px`);
      }
    };

    apply();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sidebarStyle = {
    top: `${headerHeight + 12}px`,
    height: `calc(100vh - ${headerHeight + 24}px)`,
  };

  const activeRightSidebar = rightSidebar ?? inspector;
  const hasLeft = Boolean(leftSidebar && !isLeftCollapsed);
  const hasRight = Boolean(activeRightSidebar);

  const mainColClass =
    hasLeft && hasRight
      ? "lg:col-span-6 xl:col-span-6"
      : hasLeft
      ? "lg:col-span-9 xl:col-span-9"
      : hasRight
      ? "lg:col-span-9 xl:col-span-9"
      : "lg:col-span-12";

  // Sol sidebar bileşeni onToggleCollapse prop'unu kabul ediyorsa aktar
  const renderedLeftSidebar =
    React.isValidElement(leftSidebar) && leftSidebar
      ? React.cloneElement(leftSidebar as React.ReactElement<{ onToggleCollapse?: () => void }>, {
          onToggleCollapse: handleToggleLeftCollapse,
        })
      : leftSidebar;

  return (
    <div
      ref={rootRef}
      data-section={section}
      className={`min-h-screen flex flex-col pb-20 lg:pb-0 bg-[var(--portal-background)] text-ink font-sans antialiased selection:bg-selected-strong selection:text-white ${className}`}
      style={{
        "--portal-background": ThemeTokens.background,
        "--portal-panel": ThemeTokens.panel,
        "--portal-border": ThemeTokens.border,
      } as React.CSSProperties}
    >
      <div ref={headerRef} className="sticky top-0 z-40 bg-[var(--portal-panel)] backdrop-blur-md border-b border-[var(--portal-border)] shadow-xl">
        {header}
      </div>

      <div className="flex-1 w-full max-w-[1720px] mx-auto px-1 sm:px-2 md:px-3 lg:px-4">
        {/* Lig Ağacı Daraltıldığında Hızlı Açma Butonu (Floating pill) */}
        {leftSidebar && isLeftCollapsed && (
          <button
            type="button"
            onClick={handleToggleLeftCollapse}
            className="hidden lg:inline-flex fixed left-3 top-20 z-30 items-center gap-2 px-3 py-2 rounded-xl bg-surface/95 backdrop-blur-md hover:bg-surface-raised border border-primary/40 text-primary hover:text-white shadow-xl transition-all active:scale-95 cursor-pointer text-xs font-bold animate-in fade-in-50 duration-200"
            title="Lig Ağacını Göster"
            aria-label="Lig Ağacını Göster"
          >
            <PanelLeftOpen size={15} className="text-primary" />
            <span className="text-xs font-bold">Lig Ağacını Aç</span>
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-3.5 items-start">
          {leftSidebar && !isLeftCollapsed && (
            <aside
              aria-label="Lig Navigasyonu"
              style={sidebarStyle}
              className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky overflow-y-auto custom-scrollbar bg-[var(--portal-panel)] border border-[var(--portal-border)] rounded-2xl my-3 shadow-lg transition-all duration-300"
            >
              {renderedLeftSidebar}
            </aside>
          )}

          <main
            id="main-content"
            aria-label="Ana Maç Akışı ve İçerik"
            className={`w-full col-span-1 min-w-0 py-2 sm:py-3 space-y-4 transition-all duration-300 ease-in-out ${mainColClass}`}
          >
            {children}
          </main>

          {activeRightSidebar && (
            <aside
              aria-label="Maç Detay Paneli"
              style={sidebarStyle}
              className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky overflow-y-auto custom-scrollbar bg-[var(--portal-panel)] border border-[var(--portal-border)] rounded-2xl my-3 shadow-lg transition-all duration-300"
            >
              {activeRightSidebar}
            </aside>
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-auto border-t border-[var(--portal-border)] bg-[var(--portal-panel)]">
          {footer}
        </div>
      )}
    </div>
  );
};
