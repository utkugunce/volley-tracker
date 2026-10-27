"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, ArrowRight, Sparkles, Filter, ChevronRight } from "lucide-react";
import { GuideArticle } from "@/data/guides";

interface GuideSearchFilterProps {
  initialGuides: GuideArticle[];
}

export const GuideSearchFilter: React.FC<GuideSearchFilterProps> = ({ initialGuides }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(initialGuides.map((g) => g.category)));
    return ["Tümü", ...cats];
  }, [initialGuides]);

  const filteredGuides = useMemo(() => {
    return initialGuides.filter((guide) => {
      const matchesCategory =
        selectedCategory === "Tümü" || guide.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query) ||
        guide.keywords.some((kw) => kw.toLowerCase().includes(query)) ||
        guide.summary.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [initialGuides, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Arama ve Filtre Çubuğu */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface p-3 sm:p-4 rounded-2xl border border-line shadow-card">
        {/* Arama Kutusu */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rehberde ara (Örn: averaj, midi voleybol, lisans, istanbul)..."
            className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-3 hover:text-ink transition-colors"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Kategori Filtresi */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-muted text-ink-2 hover:text-ink hover:bg-canvas border border-line"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Makale Listesi */}
      {filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredGuides.map((guide) => (
            <article
              key={guide.slug}
              className="group bg-surface hover:bg-surface-elevated rounded-2xl border border-line hover:border-primary/50 transition-all duration-300 p-5 flex flex-col justify-between shadow-card hover:shadow-card-hover"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {guide.category}
                  </span>
                  <span className="text-[11px] text-ink-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>

                <h2 className="text-base font-black text-ink group-hover:text-primary transition-colors line-clamp-2">
                  <Link
                    href={`/rehber/${guide.slug}`}
                    prefetch={false}
                    className="focus:outline-none"
                  >
                    {guide.title}
                  </Link>
                </h2>

                <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">
                  {guide.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
                <span className="text-[11px] text-ink-3 font-mono">
                  {guide.sections.length} Bölüm · FAQ
                </span>
                <Link
                  href={`/rehber/${guide.slug}`}
                  prefetch={false}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Rehberi Oku</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface rounded-2xl border border-line space-y-3">
          <BookOpen className="w-10 h-10 text-ink-3 mx-auto" />
          <h3 className="text-base font-bold text-ink">Aradığınız kriterlere uygun rehber bulunamadı</h3>
          <p className="text-xs text-ink-2 max-w-sm mx-auto">
            Lütfen farklı bir anahtar kelime veya kategori seçerek tekrar deneyin.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Tümü");
            }}
            className="text-xs font-bold text-primary hover:underline"
          >
            Filtreleri Temizle
          </button>
        </div>
      )}
    </div>
  );
};
