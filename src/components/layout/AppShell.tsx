"use client";

import React from "react";
import { ThemeTokens } from "./ThemeTokens";

export interface AppShellProps {
  header: React.ReactNode;
  leftSidebar?: React.ReactNode;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  section?: "altyapi" | "kadinlar-2-lig";
}

export const AppShell: React.FC<AppShellProps> = ({
  header,
  leftSidebar,
  children,
  rightSidebar,
  footer,
  className = "",
  section = "altyapi",
}) => {
  const [headerHeight, setHeaderHeight] = React.useState(64);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  return (
    <div
      ref={rootRef}
      data-section={section}
      className={`min-h-screen flex flex-col bg-[var(--portal-background)] text-ink font-sans antialiased selection:bg-selected-strong selection:text-white ${className}`}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-3.5 items-start">
          {leftSidebar && (
            <aside
              aria-label="Lig Navigasyonu"
              style={sidebarStyle}
              className="hidden lg:block lg:col-span-3 xl:col-span-2.5 sticky overflow-y-auto custom-scrollbar bg-[var(--portal-panel)] border border-[var(--portal-border)] rounded-2xl my-3 shadow-lg"
            >
              {leftSidebar}
            </aside>
          )}

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

          {rightSidebar && (
            <aside
              aria-label="Maç Detay Paneli"
              style={sidebarStyle}
              className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky overflow-y-auto custom-scrollbar bg-[var(--portal-panel)] border border-[var(--portal-border)] rounded-2xl my-3 shadow-lg"
            >
              {rightSidebar}
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