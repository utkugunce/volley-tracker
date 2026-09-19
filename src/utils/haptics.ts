/**
 * Mobil cihazlarda hafif dokunsal titreşim (Haptic Feedback) tetikler.
 * Desteklemeyen cihazlarda veya masaüstünde sessizce göz ardı edilir.
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "selection" = "light"): void {
  if (typeof window === "undefined" || !("navigator" in window) || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (type) {
      case "light":
      case "selection":
        navigator.vibrate(8);
        break;
      case "medium":
        navigator.vibrate(18);
        break;
      case "heavy":
        navigator.vibrate(30);
        break;
      case "success":
        navigator.vibrate([10, 30, 15]);
        break;
    }
  } catch {
    // Haptic hatası durumunda sessiz kal
  }
}
