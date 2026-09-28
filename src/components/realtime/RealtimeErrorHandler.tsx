import React, { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface RealtimeErrorHandlerProps {
  error: Error | null;
  isConnected: boolean;
  onRetry?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function RealtimeErrorHandler({
  error,
  isConnected,
  onRetry,
  autoHide = true,
  autoHideDelay = 5000,
}: RealtimeErrorHandlerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setVisible(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else if (isConnected) {
      setVisible(false);
    }
  }, [error, isConnected, autoHide, autoHideDelay]);

  if (!visible || !error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-red-950/90 border border-red-800 rounded-xl p-4 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white mb-1">
              Canlı Bağlantı Hatası
            </h4>
            <p className="text-xs text-red-300 mb-3">
              {error.message || "Canlı skor bağlantısı kurulamadı. Yeniden deneniyor..."}
            </p>
            
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-lg text-xs font-medium transition-colors"
              >
                <RefreshCw size={12} />
                Yeniden Dene
              </button>
            )}
          </div>
          
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 p-1 text-red-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
