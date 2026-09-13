"use client";

import React, { useState } from "react";
import rawVenues from "../data/venues.json";
import { VenueInfo } from "../types";
import { MapPin, Navigation, Bus, Users, Search, ExternalLink, Building2 } from "lucide-react";

interface VenueGuideProps {
  initialCity?: string;
}

export const VenueGuide: React.FC<VenueGuideProps> = ({ initialCity = "all" }) => {
  const venues = rawVenues as VenueInfo[];
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [search, setSearch] = useState<string>("");

  const filtered = venues.filter((v) => {
    if (selectedCity !== "all" && v.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.district.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 rounded-3xl p-5 sm:p-6 bg-court-panel/95 border border-court-border/80 backdrop-blur-md shadow-xl">
      
      {/* Üst Bar: Başlık ve Filtreler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-court-border/70">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent-emerald" />
            <span>Voleybol Salonları & Yol Tarifi Rehberi</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            İstanbul ve Ankara&apos;da maçların oynandığı tesisler, ulaşım bilgileri ve navigasyon
          </p>
        </div>

        {/* Şehir Seçici & Arama */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-xl bg-court-card border border-court-border">
            {["all", "İstanbul", "Ankara"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedCity === c
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {c === "all" ? "Tümü" : c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Salon veya ilçe ara..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-court-card border border-court-border text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Salon Kartları Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((venue) => {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.maps_query)}`;

          return (
            <div
              key={venue.id}
              className="rounded-2xl p-5 bg-court-card/70 border border-court-border hover:border-accent-emerald/40 hover:bg-court-hover transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                {/* Üst Kısım: İl & İlçe ve Kapasite */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-brand-500/15 text-brand-400 border border-brand-500/30">
                    {venue.city} • {venue.district}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Users className="w-3.5 h-3.5 text-accent-cyan" />
                    {venue.capacity}
                  </span>
                </div>

                {/* Salon Adı */}
                <h3 className="text-base font-black text-white group-hover:text-accent-emerald transition-colors">
                  {venue.name}
                </h3>

                {/* Adres */}
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{venue.address}</span>
                </div>

                {/* Toplu Taşıma / Ulaşım */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-court-border/60 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Bus className="w-3 h-3 text-accent-emerald" /> Ulaşım & Metro İpuçları
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {venue.transit_info}
                  </p>
                </div>
              </div>

              {/* Yol Tarifi Butonu */}
              <div className="mt-4 pt-3 border-t border-court-border/50">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-accent-emerald/20 to-teal-500/10 hover:from-accent-emerald/30 hover:to-teal-500/20 text-accent-emerald hover:text-white border border-accent-emerald/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Google Haritalarda Yol Tarifi Al</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
