import { useState, useEffect } from "react";

/** Spotlight arama modalı durumu + Ctrl+K / Cmd+K kısayolu. */
export function useSearchShortcut() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Ctrl+K / Cmd+K ile hızlı arama açma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isSearchOpen, setIsSearchOpen };
}
