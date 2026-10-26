"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  MapPin,
  ArrowRight,
  Check,
  Shield,
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

export const LeagueFinderWidget: React.FC<LeagueFinderWidgetProps> = () => {
  const [gender, setGender] = useState<"Kız" | "Erkek">("Kız");
  const [birthYear, setBirthYear] = useState<number>(2014);
  const [district, setDistrict] = useState<string>("Kadıköy");
  const [city] = useState<string>("İstanbul");
  const [copied, setCopied] = useState<boolean>(false);

  const category = useMemo(() => {
    return calculateVolleyCategory(birthYear, gender);
  }, [birthYear, gender]);

  const districtSlug = district
    .toLowerCase()
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
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      {/* Başlık Alanı */}
      <div className="p-4 sm:p-5 border-b border-line bg-surface-muted">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface text-ink-2 text-[11px] font-bold border border-line">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>İnteraktif Yaş & Kategori Bulucu</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-ink tracking-tight">
              Çocuğum Hangi Voleybol Liginde Oynar?
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-md bg-surface border border-line text-xs font-semibold text-ink-2">
            <span className="w-1.5 h-1.5 rounded-full bg-done" />
            <span>2026-2027 Sezonu</span>
          </div>
        </div>
      </div>

      {/* Kontrol / Seçim Alanı */}
      <div className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Cinsiyet */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-2 block">
              Sporcu Cinsiyeti
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender("Kız")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  gender === "Kız"
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-surface-muted border-line text-ink-2 hover:bg-surface-raised"
                }`}
              >
                Kız Sporcu
              </button>
              <button
                type="button"
                onClick={() => setGender("Erkek")}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  gender === "Erkek"
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-surface-muted border-line text-ink-2 hover:bg-surface-raised"
                }`}
              >
                Erkek Sporcu
              </button>
            </div>
          </div>

          {/* Doğum Yılı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-2 block">
              Doğum Yılı
            </label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full bg-surface-muted border border-line rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-primary"
            >
              {BIRTH_YEARS.map((y) => (
                <option key={y} value={y} className="bg-surface text-ink">
                  {y} Doğumlu ({2026 - y} Yaş)
                </option>
              ))}
            </select>
          </div>

          {/* İlçe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink-2 block">
              Bulunduğunuz İlçe ({city})
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-surface-muted border border-line rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-primary"
            >
              {ISTANBUL_DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-surface text-ink">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sonuç Kartı */}
        <div className="bg-surface-muted border border-line rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3.5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider block">
                2026 - 2027 Sezonu Uygun Kategori
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="text-xl sm:text-2xl font-black text-ink">
                  {category.name}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">
                  {category.ageRange}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-surface text-ink-2 border border-line">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-surface p-3 rounded-lg border border-line">
              <span className="text-ink-3 block font-medium">Doğum Yılları</span>
              <span className="text-ink font-bold mt-1 block text-sm font-mono">
                {category.birthYears}
              </span>
            </div>
            <div className="bg-surface p-3 rounded-lg border border-line">
              <span className="text-ink-3 block font-medium">Resmi File Boyu</span>
              <span className="text-primary font-bold mt-1 block text-sm font-mono">
                {category.netHeight}
              </span>
            </div>
            <div className="bg-surface p-3 rounded-lg border border-line">
              <span className="text-ink-3 block font-medium">Top Standardı</span>
              <span className="text-ink font-bold mt-1 block truncate text-xs" title={category.ballType}>
                {category.ballType}
              </span>
            </div>
            <div className="bg-surface p-3 rounded-lg border border-line">
              <span className="text-ink-3 block font-medium">Libero / Format</span>
              <span className="text-ink font-bold mt-1 block truncate text-xs" title={category.liberoRule}>
                {category.liberoRule}
              </span>
            </div>
          </div>

          {/* Açıklama & Antrenör Tavsiyesi */}
          <div className="bg-surface border border-line rounded-lg p-3.5 space-y-1 text-xs text-ink-2">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Shield className="w-4 h-4 text-primary" />
              <span>Lig Statüsü & Antrenör Tavsiyesi:</span>
            </div>
            <p className="leading-relaxed font-normal">
              {category.advice}
            </p>
          </div>

          {/* Aksiyon Butonları & İlçe Kulüpleri */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-ink-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong className="text-ink">{city} / {district}</strong> ilçesindeki voleybol kulüplerini inceleyebilirsiniz.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-raised border border-line text-xs font-bold text-ink transition-colors cursor-pointer"
                title="Kulübe sormak için hazır veli mesajını panoya kopyala"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-done" />
                    <span className="text-done">Mesaj Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3.5 h-3.5 text-done" />
                    <span>Hazır Kulüp Mesajını Al</span>
                  </>
                )}
              </button>

              <Link
                href={`/kulupler/istanbul/${districtSlug}`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg text-xs font-bold transition-colors"
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
