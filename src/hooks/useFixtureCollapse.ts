import { useState } from "react";

/**
 * Fikstür tablosunun daraltma durumu: kontrollü (`isCollapsed`) ya da kontrolsüz
 * (`defaultCollapsed` ile başlayan iç state) çalışır.
 */
export function useFixtureCollapse(
  isCollapsible: boolean,
  controlledIsCollapsed: boolean | undefined,
  onToggleCollapse: (() => void) | undefined,
  defaultCollapsed: boolean
) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = isCollapsible
    ? controlledIsCollapsed !== undefined
      ? controlledIsCollapsed
      : internalCollapsed
    : false;

  const handleToggleCollapse = () => {
    if (!isCollapsible) return;
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  return { isCollapsed, handleToggleCollapse };
}
