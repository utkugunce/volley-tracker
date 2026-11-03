#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/check_bot_health.py

Volleybox Maç Ekleme Botu Sağlık & Eşleştirme Denetleyicisi:
Tarayıcıyı (Playwright) açmadan tüm kuyruktaki maçları sanal olarak simüle eder.
- Eksik takım eşleştirmelerini (takma ad / alias) tespit eder ve olası Volleybox adaylarını önerir.
- Eksik turnuva URL'lerini ve tur belirsizliklerini listeler.
- Karantinaya alınmış maçları ve gönderime %100 hazır maçları raporlar.
- Çıktıyı renkli konsol özeti olarak basar ve 'data/bot_health_report.json' dosyasına kaydeder.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
DATA_DIR = BASE_DIR / "data"
CITIES_DIR = DATA_DIR / "cities"
FIXTURES_FILE = DATA_DIR / "fixtures.json"
MAPPINGS_FILE = DATA_DIR / "volleybox-mappings.json"
REPORT_FILE = DATA_DIR / "bot_health_report.json"

# Ortak fonksiyonları push_volleybox_matches ve sync_volleybox_matches üzerinden al
from scripts.push_volleybox_matches import (
    QUARANTINE_FILE,
    load_quarantine,
    save_quarantine,
    add_to_quarantine,
    remove_from_quarantine,
    clear_quarantine,
    build_team_alias_map,
    build_tournament_lookup,
    collect_unsynced_matches,
    resolve_team_for_match,
    normalize_name,
)
from scripts.sync_volleybox_matches import team_match_score


_SUGGESTION_CACHE: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}


def is_city_compatible_str(c1: str, c2: str) -> bool:
    if not c1 or not c2:
        return True
    if c1 == c2 or c1 == "turkiye" or c2 == "turkiye":
        return True
    return c1.startswith(c2) or c2.startswith(c1)


def find_candidate_suggestions(
    tvf_name: str,
    city_slug: str,
    mappings: List[Dict[str, Any]],
    top_n: int = 3,
) -> List[Dict[str, Any]]:
    """Eşleşmeyen bir TVF takımı için mevcut mappings veritabanından en iyi önerileri puanlar."""
    clean_target = (tvf_name or "").strip()
    if not clean_target:
        return []

    c_norm = re.sub(r"[^a-z0-9]", "", (city_slug or "").lower())
    cache_key = (clean_target.lower(), c_norm)
    if cache_key in _SUGGESTION_CACHE:
        return _SUGGESTION_CACHE[cache_key]

    # Şehir bazlı havuz filtresi (Çapraz il yanlış önerilerini kesin olarak engeller)
    city_pool = []
    generic_pool = []
    for m in mappings:
        m_city = (m.get("city_slug") or m.get("city") or "").lower().strip()
        m_city_norm = re.sub(r"[^a-z0-9]", "", m_city)
        if m_city_norm:
            if is_city_compatible_str(c_norm, m_city_norm):
                city_pool.append(m)
        else:
            generic_pool.append(m)

    # Eğer il havuzunda takım varsa sadece ili kullan; yoksa ve il bilinmiyorsa generic havuzu kullan
    target_pool = city_pool if city_pool else (generic_pool if not c_norm else [])
    candidates = []
    seen_teams: Set[str] = set()

    for m in target_pool:
        tid = str(m.get("team_id") or "")
        url = m.get("volleybox_url") or ""
        if not tid and url:
            mat = re.search(r"[-/]t(\d+)", url)
            if mat:
                tid = mat.group(1)

        matched_as = (m.get("matched_as") or m.get("internal_name") or "").strip()
        if not matched_as or matched_as in seen_teams:
            continue
        seen_teams.add(matched_as)

        m_city = (m.get("city") or "").strip()
        synonyms = set(m.get("aliases") or [])
        score = team_match_score(clean_target, matched_as, synonyms)

        # Aynı şehir bonusu
        if city_pool:
            score += 15

        if score >= 40:
            candidates.append({
                "team_id": tid,
                "name": matched_as,
                "url": url,
                "city": m_city,
                "score": min(score, 99),
            })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    res = candidates[:top_n]
    _SUGGESTION_CACHE[cache_key] = res
    return res


def evaluate_bot_health(
    city_filter: Optional[str] = None,
    include_pro: bool = True,
) -> Dict[str, Any]:
    """Tüm kuyruğu tarayarak bot sağlığını ve eksiklikleri değerlendirir."""
    if not MAPPINGS_FILE.exists():
        raise FileNotFoundError(f"{MAPPINGS_FILE} bulunamadı!")

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)

    mappings_list = mappings_data.get("mappings", [])
    team_alias_map = build_team_alias_map(mappings_data)
    tourn_lookup = build_tournament_lookup(mappings_data)

    quarantine_data = load_quarantine()

    by_tournament = collect_unsynced_matches(
        tourn_lookup,
        city_filter=city_filter,
        include_pro=include_pro,
    )

    total_candidates = sum(len(v) for v in by_tournament.values())

    ready_matches: List[Dict[str, Any]] = []
    missing_team_occurrences: Dict[str, Dict[str, Any]] = {}
    quarantined_matches: List[Dict[str, Any]] = []
    tournaments_summary: List[Dict[str, Any]] = []

    for t_url, m_list in by_tournament.items():
        t_ready = 0
        t_blocked = 0

        for item in m_list:
            m_id = str(item.get("id") or "")
            is_quarantined = m_id in quarantine_data

            if is_quarantined:
                q_info = quarantine_data[m_id]
                quarantined_matches.append({
                    "id": m_id,
                    "city": item.get("city"),
                    "city_slug": item.get("city_slug"),
                    "category": item.get("category"),
                    "home_team": item.get("home_team"),
                    "away_team": item.get("away_team"),
                    "date": item.get("date"),
                    "time": item.get("time"),
                    "tournament_url": t_url,
                    "reason": q_info.get("reason"),
                    "failed_at": q_info.get("failed_at"),
                    "attempts": q_info.get("attempts", 1),
                })
                t_blocked += 1
                continue

            age_cat = item.get("category", "") or item.get("age_group", "")
            c_slug = item.get("city_slug", "")

            # Ev sahibi ve deplasman çözümleme
            host_opt = resolve_team_for_match(
                item["home_team"],
                team_alias_map,
                mappings_data=mappings_data,
                age_group=age_cat,
                city_slug=c_slug,
                direct_vb_id=item.get("home_team_vb_id"),
                direct_vb_name=item.get("home_team_vb_name"),
            )
            guest_opt = resolve_team_for_match(
                item["away_team"],
                team_alias_map,
                mappings_data=mappings_data,
                age_group=age_cat,
                city_slug=c_slug,
                direct_vb_id=item.get("away_team_vb_id"),
                direct_vb_name=item.get("away_team_vb_name"),
            )

            has_issue = False

            if not host_opt:
                has_issue = True
                h_name = item["home_team"]
                if h_name not in missing_team_occurrences:
                    missing_team_occurrences[h_name] = {
                        "team_name": h_name,
                        "city": item.get("city"),
                        "city_slug": c_slug,
                        "category": age_cat,
                        "match_count": 0,
                        "blocked_matches": [],
                        "suggestions": find_candidate_suggestions(h_name, c_slug, mappings_list),
                    }
                missing_team_occurrences[h_name]["match_count"] += 1
                missing_team_occurrences[h_name]["blocked_matches"].append(m_id)

            if not guest_opt:
                has_issue = True
                g_name = item["away_team"]
                if g_name not in missing_team_occurrences:
                    missing_team_occurrences[g_name] = {
                        "team_name": g_name,
                        "city": item.get("city"),
                        "city_slug": c_slug,
                        "category": age_cat,
                        "match_count": 0,
                        "blocked_matches": [],
                        "suggestions": find_candidate_suggestions(g_name, c_slug, mappings_list),
                    }
                missing_team_occurrences[g_name]["match_count"] += 1
                missing_team_occurrences[g_name]["blocked_matches"].append(m_id)

            if has_issue:
                t_blocked += 1
            else:
                t_ready += 1
                ready_matches.append({
                    "id": m_id,
                    "city": item.get("city"),
                    "city_slug": c_slug,
                    "category": age_cat,
                    "home_team": item.get("home_team"),
                    "away_team": item.get("away_team"),
                    "date": item.get("date"),
                    "time": item.get("time"),
                    "resolved_home": host_opt.get("label") if host_opt else None,
                    "resolved_guest": guest_opt.get("label") if guest_opt else None,
                    "tournament_url": t_url,
                })

        tournaments_summary.append({
            "tournament_url": t_url,
            "tournament_slug": t_url.rstrip("/").split("/")[-1],
            "city": m_list[0].get("city") if m_list else "",
            "category": m_list[0].get("category") if m_list else "",
            "total_matches": len(m_list),
            "ready_matches": t_ready,
            "blocked_matches": t_blocked,
        })

    missing_teams_list = sorted(
        missing_team_occurrences.values(),
        key=lambda x: x["match_count"],
        reverse=True,
    )

    ready_count = len(ready_matches)
    quarantined_count = len(quarantined_matches)
    blocked_by_missing_teams = sum(t["match_count"] for t in missing_teams_list)

    report = {
        "generated_at": datetime.now().isoformat(),
        "city_filter": city_filter or "all",
        "total_candidates": total_candidates,
        "ready_count": ready_count,
        "quarantined_count": quarantined_count,
        "missing_teams_count": len(missing_teams_list),
        "blocked_by_missing_teams": blocked_by_missing_teams,
        "health_score_pct": round((ready_count / total_candidates * 100), 1) if total_candidates > 0 else 100.0,
        "missing_teams": missing_teams_list,
        "quarantined_matches": quarantined_matches,
        "tournaments": tournaments_summary,
        "ready_matches": ready_matches[:100],  # İlk 100 maçlık önizleme
    }

    # Rapor dosyasını kaydet
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report


def print_cli_report(report: Dict[str, Any]) -> None:
    """Terminal için renkli ve okunabilir özet tablo basar."""
    total = report.get("total_candidates", 0)
    ready = report.get("ready_count", 0)
    quarantined = report.get("quarantined_count", 0)
    missing_teams = report.get("missing_teams", [])
    health_pct = report.get("health_score_pct", 100.0)

    print("\n" + "=" * 80)
    print("🤖 VOLLEYBOX OTOMATİK BOT SAĞLIK & EŞLEŞTİRME DENETLEYİCİSİ")
    print("=" * 80)
    print(f"📅 Rapor Zamanı       : {report.get('generated_at', '')[:19].replace('T', ' ')}")
    print(f"🎯 Taranan Kapsam     : {report.get('city_filter', 'Tüm İller').upper()}")
    print("-" * 80)
    print(f"📊 Toplam Bekleyen Maç : {total} adet")
    print(f"✅ Gönderime Hazır      : {ready} adet (%{health_pct})")
    print(f"⚠️  Eksik Takım Eşleşmesi: {len(missing_teams)} farklı takım ({report.get('blocked_by_missing_teams', 0)} maçı engelliyor)")
    print(f"🛑 Karantinadaki Maçlar : {quarantined} adet")
    print("=" * 80)

    if missing_teams:
        print("\n🔍 EŞLEŞTİRİLMESİ GEREKEN TAKIMLAR VE TAVSİYE EDİLEN VOLLEYBOX PROFİLLERİ:")
        print("-" * 80)
        for idx, t in enumerate(missing_teams[:15], 1):
            t_name = t["team_name"]
            city = t.get("city", "")
            cat = t.get("category", "")
            cnt = t.get("match_count", 0)
            suggestions = t.get("suggestions", [])

            print(f"  [{idx:2d}] 🚩 '{t_name}' ({city} - {cat}) [{cnt} maç bekliyor]")
            if suggestions:
                for s in suggestions:
                    s_id = s.get("team_id") or "---"
                    s_name = s.get("name")
                    s_score = s.get("score", 0)
                    print(f"        👉 Tavsiye: {s_name} (ID: {s_id} | Güven Skoru: %{s_score})")
            else:
                print("        ℹ️  Henüz benzer bir Volleybox takımı tespit edilemedi.")
        if len(missing_teams) > 15:
            print(f"  ... ve {len(missing_teams) - 15} eksik takım daha (Tam liste: {REPORT_FILE.name})")

    if quarantined:
        print("\n🛑 KARANTİNAYA ALINAN MAÇLAR (Hata Almış ve Atlananlar):")
        print("-" * 80)
        for q in report.get("quarantined_matches", [])[:10]:
            print(f"  * [{q.get('city')}] {q.get('home_team')} vs {q.get('away_team')} ({q.get('date')})")
            print(f"    Sebep: {q.get('reason')} (Deneme: {q.get('attempts')})")
        if quarantined > 10:
            print(f"  ... ve {quarantined - 10} karantina maçı daha.")

    print("\n💡 İPUCU:")
    if missing_teams:
        print("  - Takımları eşleştirmek için Admin Paneli ('/admin' -> Volleybox sekmesi)")
        print("    veya 'data/volleybox-mappings.json' dosyasına alias ekleyebilirsiniz.")
    if ready > 0:
        print(f"  - Hazır olan {ready} maçı doğrudan Volleybox'a eklemek için:")
        print("    npm run push:volleybox")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Volleybox Bot Sağlık & Eşleştirme Denetleyicisi")
    parser.add_argument("--city", "-c", type=str, default=None, help="Yalnızca belirtilen şehri/ligi denetle")
    parser.add_argument("--league", choices=["sultanlar", "kadinlar-1", "kadinlar-2", "pro"], default=None, help="Profesyonel lig seçimi")
    parser.add_argument("--sultanlar", action="store_true", help="Sadece Vodafone Sultanlar Ligi'ni denetle")
    parser.add_argument("--kadinlar-1", "--1-lig", dest="kadinlar_1", action="store_true", help="Sadece KFC Kadınlar 1. Ligi'ni denetle")
    parser.add_argument("--kadinlar-2", "--2-lig", dest="kadinlar_2", action="store_true", help="Sadece Kadınlar 2. Ligi'ni denetle")
    parser.add_argument("--pro", action="store_true", help="Tüm profesyonel ligleri denetle")
    parser.add_argument("--json", action="store_true", help="JSON formatında çıktı bas")
    parser.add_argument("--quarantine-add", type=str, default=None, help="Belirtilen maç ID'sini karantinaya ekle")
    parser.add_argument("--reason", type=str, default="Manuel karantina", help="Karantinaya ekleme gerekçesi")
    parser.add_argument("--quarantine-remove", type=str, default=None, help="Belirtilen maç ID'sini karantinadan çıkar")
    parser.add_argument("--clear-quarantine", action="store_true", help="Tüm karantina listesini temizle")
    args = parser.parse_args()

    # Profesyonel lig kısayol bayraklarını city filtresine dönüştür
    if args.sultanlar or args.league == "sultanlar":
        args.city = "sultanlar-ligi"
    elif args.kadinlar_1 or args.league == "kadinlar-1":
        args.city = "kadinlar-1-ligi"
    elif args.kadinlar_2 or args.league == "kadinlar-2":
        args.city = "kadinlar-2-ligi"
    elif args.pro or args.league == "pro":
        args.city = "pro"

    if args.clear_quarantine:
        cleared = clear_quarantine()
        print(f"✅ {cleared} maç karantina listesinden temizlendi.")
        return

    if args.quarantine_remove:
        removed = remove_from_quarantine(args.quarantine_remove)
        if removed:
            print(f"✅ Maç ({args.quarantine_remove}) karantinadan çıkarıldı.")
        else:
            print(f"⚠️ Maç ({args.quarantine_remove}) karantinada bulunamadı.")
        return

    if args.quarantine_add:
        add_to_quarantine(args.quarantine_add, args.reason)
        print(f"🛑 Maç ({args.quarantine_add}) karantinaya alındı. Sebep: {args.reason}")
        return

    report = evaluate_bot_health(city_filter=args.city, include_pro=True)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_cli_report(report)


if __name__ == "__main__":
    main()
