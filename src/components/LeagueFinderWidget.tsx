"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  MapPin,
  ArrowRight,
  Share2,
  Check,
  Shield,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { calculateVolleyCategory } from "@/utils/categoryCalculator";

export const ISTANBUL_DISTRICTS = [
  "Kadıköy",
  "Ataşehir",
  "Üsküdar",
  "Maltepe",
  "Kartal",
  "Pendik",
  "Ümraniye",
  "Çekmeköy",
  "Sancaktepe",
  "Beykoz",
  "Tuzla",
  "Şile",
  "Sultanbeyli",
  "Bakırköy",
  "Bahçelievler",
  "Beşiktaş",
  "Sarıyer",
  "Şişli",
  "Zeytinburnu",
  "Fatih",
  "Beyoğlu",
  "Güngören",
  "Bağcılar",
  "Esenler",
  "Bayrampaşa",
  "Eyüpsultan",
  "Gaziosmanpaşa",
  "Sultangazi",
  "Kâğıthane",
  "Küçükçekmece",
  "Büyükçekmece",
  "Beylikdüzü",
  "Avcılar",
  "Esenyurt",
  "Başakşehir",
  "Arnavutköy",
  "Silivri",
  "Çatalca",
  "Adalar",
];

const BIRTH_YEARS = [
  2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007,
];

interface LeagueFinderWidgetProps {
  compact?: boolean;
}

export const LeagueFinderWidget: React.FC<LeagueFinderWidgetProps> = ({
  compact = false,
}) => {
  const [gender, setGender] = useState<"Kız" | "Erkek">("Kız");
  const [birthYear, setBirthYear] = useState<number>(2014);
  const [district, setDistrict] = useState<string>("Kadıköy");
  const [city, setCity] = useState<string>("İstanbul");
  const [copied, setCopied] = useState<boolean>(false);

  const category = useMemo(() => {
    return calculateVolleyCategory(birthYear, gender);
  }, [birthYear, gender]);

  const districtSlug = district.toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a");

  const whatsappMessage = useMemo(() => {
    return `Merhaba, ${city} ${district} ilçesinde ${birthYear} doğumlu çocuğum için (${category.name} kategorisi) voleybol altyapı seçmeleri ve spor okulu antrenmanları hakkında bilgi almak istiyorum.`;
  }, [city, district, birthYear, category.name]);

  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-surface/90 backdrop-blur-md rounded-2xl border border-line shadow-card overflow-hidden">
      {/* Başlık Alanı */}
      <div className="p-5 sm:p-6 border-b border-line bg-gradient-to-r from-surface to-surface-muted">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>İnteraktif Yaş & Kategori Bulucu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              Çocuğum Hangi Voleybol Liginde Oynar?
            </h2>
            <p className="text-xs sm:text-sm text-ink-2 max-w-2xl">
              Doğum yılını ve ilçenizi seçin; 2026-2027 resmi TVF lig kategorisini, file yüksekliğini, top standardını ve çevrenizdeki altyapı kulüplerini anında görün.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 self-start sm:self-center px-3 py-1.5 rounded-xl bg-canvas border border-line text-xs font-semibold text-ink-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>2026-2027 Sezonu</span>
          </div>
        </div>
      </div>

      {/* Kontrol / Seçim Alanı */}
      <div className="p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Cinsiyet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-2 block">
              1. Sporcu Cinsiyeti
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender("Kız")}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  gender === "Kız"
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm"
                    : "bg-surface-muted border-line text-ink-2 hover:bg-surface-raised"
                }`}
              >
                👧 Kız Sporcu
              </button>
              <button
                type="button"
                onClick={() => setGender("Erkek")}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  gender === "Erkek"
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sm"
                    : "bg-surface-muted border-line text-ink-2 hover:bg-surface-raised"
                }`}
              >
                👦 Erkek Sporcu
              </button>
            </div>
          </div>

          {/* Doğum Yılı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-2 block">
              2. Doğum Yılı
            </label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full bg-surface-muted border border-line rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
            >
              {BIRTH_YEARS.map((y) => (
                <option key={y} value={y} className="bg-canvas text-ink">
                  {y} Doğumlu ({2026 - y} Yaş)
                </option>
              ))}
            </select>
          </div>

          {/* İlçe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-2 block">
              3. Bulunduğunuz İlçe ({city})
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-surface-muted border border-line rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
            >
              {ISTANBUL_DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-canvas text-ink">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sonuç Kartı */}
        <div className="bg-gradient-to-br from-surface to-canvas border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-ink-3 uppercase tracking-wider block">
                2026 - 2027 Sezonu Uygun Kategori
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-2xl sm:text-3xl font-black text-ink">
                  {category.name}
                </h3>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                  {category.ageRange}
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-surface-muted text-ink-2 border border-line">
                  {category.code}
                </span>
              </div>
            </div>
            <Link
              href="/puan-durumu"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto"
            >
              <span>Lig Puan Durumunu Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Önemli Teknik Kriter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-surface-muted p-3.5 rounded-xl border border-line">
              <span className="text-ink-3 block font-medium">Doğum Yılları</span>
              <span className="text-ink font-bold mt-1 block text-sm">
                {category.birthYears}
              </span>
            </div>
            <div className="bg-surface-muted p-3.5 rounded-xl border border-line">
              <span className="text-ink-3 block font-medium">Resmi File Boyu</span>
              <span className="text-primary font-black mt-1 block text-sm">
                {category.netHeight}
              </span>
            </div>
            <div className="bg-surface-muted p-3.5 rounded-xl border border-line">
              <span className="text-ink-3 block font-medium">Top Standardı</span>
              <span className="text-ink font-bold mt-1 block truncate text-xs" title={category.ballType}>
                {category.ballType}
              </span>
            </div>
            <div className="bg-surface-muted p-3.5 rounded-xl border border-line">
              <span className="text-ink-3 block font-medium">Libero / Format</span>
              <span className="text-ink font-bold mt-1 block truncate text-xs" title={category.liberoRule}>
                {category.liberoRule}
              </span>
            </div>
          </div>

          {/* Açıklama & Antrenör Tavsiyesi */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Lig Statüsü & Antrenör Tavsiyesi:</span>
            </div>
            <p className="leading-relaxed font-normal">
              {category.advice}
            </p>
          </div>

          {/* Aksiyon Butonları & İlçe Kulüpleri */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-ink-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>{city} / {district}</strong> ilçesindeki voleybol kulüplerini inceleyebilirsiniz.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-muted hover:bg-surface-raised border border-line text-xs font-bold text-ink transition-colors cursor-pointer active:scale-95"
                title="Kulübe sormak için hazır veli mesajını panoya kopyala"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Mesaj Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hazır Kulüp Mesajını Al</span>
                  </>
                )}
              </button>

              <Link
                href={`/kulupler/istanbul/${districtSlug}`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>{district} Kulüplerini Gör</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
