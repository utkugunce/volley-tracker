import { useState, useMemo, useCallback } from "react";

/**
 * Şehir / lig bazlı gizleme-daraltma (accordion) durumu ve toplu aç/kapat kontrolleri.
 * `keys`: o an listelenen tüm anahtarlar (toplu daraltma ve "hepsi daraltıldı mı" için).
 * `defaultCollapsed`: varsayılan olarak daraltılmış (gizli) mi gelsin (varsayılan: true).
 */
export function useCollapseControls(keys: string[], defaultCollapsed: boolean = true) {
  // overrides: kullanıcının manuel olarak açtığı (false) veya kapattığı (true) durumlar
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  // bulkState: kullanıcının "Tümünü Göster" (expanded) veya "Tümünü Gizle" (collapsed) butonuna basıp basmadığı
  const [bulkState, setBulkState] = useState<"expanded" | "collapsed" | null>(null);

  const isKeyCollapsed = useCallback(
    (key: string): boolean => {
      if (key in overrides) {
        return overrides[key];
      }
      if (bulkState === "expanded") return false;
      if (bulkState === "collapsed") return true;
      return defaultCollapsed;
    },
    [overrides, bulkState, defaultCollapsed]
  );

  const toggle = useCallback(
    (key: string) => {
      const current = isKeyCollapsed(key);
      setOverrides((prev) => ({
        ...prev,
        [key]: !current,
      }));
    },
    [isKeyCollapsed]
  );

  const areAllCollapsed = useMemo(() => {
    return keys.length === 0 ? defaultCollapsed : keys.every((k) => isKeyCollapsed(k));
  }, [keys, defaultCollapsed, isKeyCollapsed]);

  const expandAll = useCallback(() => {
    setBulkState("expanded");
    setOverrides({});
  }, []);

  const collapseAll = useCallback(() => {
    setBulkState("collapsed");
    setOverrides({});
  }, []);

  const collapsed: Record<string, boolean> = useMemo(() => {
    const result: Record<string, boolean> = {};
    keys.forEach((k) => {
      result[k] = isKeyCollapsed(k);
    });
    return new Proxy(result, {
      get(target, prop: string) {
        if (typeof prop === "string") {
          if (prop in target) return target[prop];
          return isKeyCollapsed(prop);
        }
        return undefined;
      },
    });
  }, [keys, isKeyCollapsed]);

  return { collapsed, toggle, areAllCollapsed, expandAll, collapseAll };
}

export type CollapseControls = ReturnType<typeof useCollapseControls>;
