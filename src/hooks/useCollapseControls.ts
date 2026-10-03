import { useState } from "react";

/**
 * Şehir / lig bazlı gizleme-daraltma (accordion) durumu ve toplu aç/kapat kontrolleri.
 * `keys`: o an listelenen tüm anahtarlar (toplu daraltma ve "hepsi daraltıldı mı" için).
 */
export function useCollapseControls(keys: string[]) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const areAllCollapsed = keys.length === 0 ? false : keys.every((k) => Boolean(collapsed[k]));

  const expandAll = () => {
    setCollapsed({});
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    keys.forEach((k) => {
      next[k] = true;
    });
    setCollapsed(next);
  };

  return { collapsed, toggle, areAllCollapsed, expandAll, collapseAll };
}

export type CollapseControls = ReturnType<typeof useCollapseControls>;
