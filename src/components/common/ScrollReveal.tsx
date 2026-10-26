"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Milisaniye cinsinden giriş gecikmesi (okuma sırasına göre stagger için, örn. 0, 60, 120) */
  delayMs?: number;
}

/**
 * Bölmelerin görünüm alanına (viewport) girdiğinde yalnızca bir kez
 * `cubic-bezier(0.22, 1, 0.36, 1)` eğrisiyle yükselerek belirmesini sağlar.
 * `prefers-reduced-motion: reduce` aktifse veya IntersectionObserver yoksa
 * doğrudan son durumunda (hareketsiz) gösterilir.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delayMs = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -24px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? ({ transitionDelay: `${delayMs}ms` } as React.CSSProperties) : undefined}
      className={`scroll-reveal-section ${revealed ? "is-revealed" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
};
