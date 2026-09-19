"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, WifiOff, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Standalone / Yüklü PWA kontrolü
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(display-mode: standalone)")?.matches) ||
        (window.navigator as any)?.standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));

      // 2. iOS Safari tespiti
      const userAgent = window.navigator?.userAgent?.toLowerCase() || "";
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // 3. Online/Offline dinleyicisi
      setIsOffline(typeof window.navigator?.onLine === "boolean" ? !window.navigator.onLine : false);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 4. BeforeInstallPrompt (Chrome, Edge, Android)
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  // Zaten uygulama olarak açıldıysa veya reddedildiyse butonu gösterme
  const canShowPrompt = !isStandalone && (installPrompt !== null || (isIos && !dismissed));

  return (
    <>
      {/* ÇEVRİMDISI BİLDİRİM ŞERİDİ */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-amber-950/95 border border-amber-600/80 text-amber-200 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
            <WifiOff size={18} />
          </div>
          <div className="text-xs min-w-0 flex-1">
            <strong className="block text-white font-bold">Çevrimdışı Mod</strong>
            <span className="text-amber-300/80">İnternet bağlantısı yok. Önbellekteki maç verileri gösteriliyor.</span>
          </div>
        </div>
      )}

      {/* PWA YÜKLEME BUTONU (Header veya sabit çubuk için) */}
      {canShowPrompt && !dismissed && (
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-red border border-red-400/40 transition-all active:scale-95 cursor-pointer"
          title="Altyapı Voleybol uygulamasını telefonunuza veya bilgisayarınıza yükleyin"
        >
          <Smartphone size={14} className="animate-pulse" />
          <span className="hidden sm:inline">Uygulamayı Yükle</span>
          <span className="sm:hidden">Yükle</span>
        </button>
      )}

      {/* iOS Safari Rehber Modalı */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary mb-4">
              <Download size={24} />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">Uygulamayı iPhone&apos;a Yükle</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              VolleyTracker&apos;ı tam ekran uygulama olarak kullanmak ve maçları hızlıca takip etmek için:
            </p>
            <ol className="text-xs text-slate-300 space-y-2.5 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-bold flex items-center justify-center shrink-0">1</span>
                <span>Safari tarayıcısının altındaki <strong className="text-sky-400 inline-flex items-center gap-1"><Share size={12} /> Paylaş</strong> butonuna dokunun.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-bold flex items-center justify-center shrink-0">2</span>
                <span>Aşağı kaydırıp <strong className="text-white">&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine dokunun.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-colors"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
};
