"use client";

import React, { useState } from "react";
import { X, Upload, Link2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { FixturesData } from "@/types/fixture";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: FixturesData) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (activeTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (activeTab === "url" && urlInput.trim()) {
        formData.append("url", urlInput.trim());
      } else {
        throw new Error("Lütfen bir dosya seçin veya geçerli bir link girin.");
      }

      const res = await fetch("/api/fixtures/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Bülten yüklenirken hata oluştu.");
      }

      const updatedData: FixturesData = await res.json();
      onSuccess(updatedData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800">
        {/* Modal Başlık */}
        <div className="bg-[#0b1325] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            <h3 className="text-sm font-bold tracking-tight">
              Resmi Bülten İçe Aktar (PDF / TXT / URL)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            TVF İstanbul İl Temsilciliği tarafından yayınlanan haftalık resmi maç bülteni PDF veya metin dosyasını yükleyin ya da doğrudan web bağlantısını yapıştırın:
          </p>

          {/* Sekmeler */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "file"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileText size={14} />
              <span>PDF / Metin Dosyası Yükle</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "url"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Link2 size={14} />
              <span>Web Bağlantısı (URL)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "file" ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-slate-50">
                <input
                  type="file"
                  accept=".pdf,.txt,.html"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="bulletin-upload-input"
                />
                <label
                  htmlFor="bulletin-upload-input"
                  className="cursor-pointer block space-y-2"
                >
                  <Upload size={28} className="mx-auto text-slate-400" />
                  <div className="text-xs font-semibold text-slate-700">
                    {selectedFile ? (
                      <span className="text-primary font-bold">
                        Seçilen: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      "Bülten dosyasını seçmek için tıklayın veya sürükleyin"
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Desteklenen formatlar: PDF (Resmi Bülten), TXT, HTML
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Bülten İnternet Bağlantısı (URL)
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ornek.gov.tr/haftalik_bulten.pdf"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-900 font-mono"
                />
              </div>
            )}

            {/* Hata Mesajı */}
            {error && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Ayrıştırılıyor...</span>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Bülteni Yükle ve Ayrıştır</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
