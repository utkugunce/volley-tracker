#!/usr/bin/env python3
"""
Kadınlar 2. Ligi takım adlarını Altyapı ile aynı kaynaktan (data/volleybox-mappings.json,
kategori "Kadınlar 2. Ligi") Volleybox resmi adlarına eşleyen, AĞ KULLANMAYAN yardımcılar.

- `load_k2_mappings`  : eşleme dosyasından (internal_name + aliases) arama sözlüğü kurar.
                        scripts/scrape_kadinlar_2_lig.py de aynı fonksiyonu kullanır.
- `enrich_k2_data`    : data/kadinlar_2_lig.json içinde Volleybox eşleşmesi olmayan takımları
                        eşleme dosyasından tamamlar (mevcut değerler ASLA ezilmez); eşleşmeyenleri raporlar.

Kullanım (varsayılan: kuru çalıştırma, yalnızca rapor):
    python scripts/k2l_volleybox_names.py
    python scripts/k2l_volleybox_names.py --write
"""

import argparse
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
K2_FILE = os.path.join(DATA_DIR, "kadinlar_2_lig.json")
VBM_FILE = os.path.join(DATA_DIR, "volleybox-mappings.json")
LOGOS_DIR = os.path.join(BASE_DIR, "public", "logos")

K2_CATEGORY = "Kadınlar 2. Ligi"
PLACEHOLDER_LOGO = "takimlogoyok"


def _key(name: Optional[str]) -> str:
    return (name or "").strip().lower()


def load_k2_mappings(vbm_path: str = VBM_FILE) -> Dict[str, Dict[str, Any]]:
    """`internal_name` ve `aliases` (küçük harf) → eşleme kaydı. Dosya yoksa/bozuksa boş sözlük."""
    k2_mappings: Dict[str, Dict[str, Any]] = {}
    if not os.path.exists(vbm_path):
        return k2_mappings
    with open(vbm_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for item in data.get("mappings", []):
        if item.get("internal_category") != K2_CATEGORY:
            continue
        k2_mappings[_key(item.get("internal_name"))] = item
        for alias in item.get("aliases") or []:
            k2_mappings[_key(alias)] = item
    return k2_mappings


def _logo_for(url: Optional[str], logos_dir: str) -> Optional[str]:
    """Diskte logo varsa `/logos/<slug>.png` döndürür (scraper ile aynı kural)."""
    if not url:
        return None
    m = re.search(r"([^/]+)$", url.rstrip("/"))
    if not m:
        return None
    slug = re.sub(r"[^a-zA-Z0-9_\-]", "", m.group(1))
    path = os.path.join(logos_dir, f"{slug}.png")
    if os.path.exists(path) and os.path.getsize(path) > 100:
        return f"/logos/{slug}.png"
    return None


def _has_real_logo(logo: Optional[str]) -> bool:
    return bool(logo) and PLACEHOLDER_LOGO not in logo


def enrich_k2_data(
    data: Dict[str, Any],
    k2_mappings: Dict[str, Dict[str, Any]],
    logos_dir: str = LOGOS_DIR,
) -> Dict[str, Any]:
    """
    Volleybox adı/bağlantısı eksik takımları eşleme dosyasından tamamlar ve maçlara yayar.
    Dönüş: {"total", "matched", "newly_matched": [...], "unmatched": [...]} (takım adları).
    """
    teams: List[Dict[str, Any]] = list(data.get("tum_takimlar") or [])
    for g in data.get("gruplar") or []:
        teams.extend(g.get("puan_durumu") or [])

    resolved: Dict[str, Dict[str, Any]] = {}
    newly: List[str] = []
    for t in teams:
        name = t.get("takim_adi", "")
        if t.get("volleybox_url") and t.get("volleybox_name"):
            resolved.setdefault(name, t)
            continue
        item = k2_mappings.get(_key(name))
        if not item or not item.get("volleybox_url"):
            continue
        t["volleybox_url"] = item["volleybox_url"]
        t["volleybox_name"] = item.get("matched_as") or name
        logo = _logo_for(item["volleybox_url"], logos_dir)
        if logo and not _has_real_logo(t.get("logo")):
            t["logo"] = logo
        resolved[name] = t
        if name not in newly:
            newly.append(name)

    matches: List[Dict[str, Any]] = list(data.get("tum_maclar") or [])
    for g in data.get("gruplar") or []:
        matches.extend(g.get("fikstur") or [])
    for m in matches:
        for side in ("a", "b"):
            t = resolved.get(m.get(f"takim_{side}", ""))
            if not t:
                continue
            if not m.get(f"takim_{side}_volleybox_url") and t.get("volleybox_url"):
                m[f"takim_{side}_volleybox_url"] = t["volleybox_url"]
            if not m.get(f"takim_{side}_volleybox_name") and t.get("volleybox_name"):
                m[f"takim_{side}_volleybox_name"] = t["volleybox_name"]
            if _has_real_logo(t.get("logo")) and not _has_real_logo(m.get(f"takim_{side}_logo")):
                m[f"takim_{side}_logo"] = t["logo"]

    unique = {t.get("takim_adi", "") for t in data.get("tum_takimlar") or []}
    unmatched = sorted(n for n in unique if n not in resolved)
    matched = len(unique) - len(unmatched)
    if newly and isinstance(data.get("metadata"), dict):
        data["metadata"]["volleybox_eslesme_sayisi"] = matched
    return {"total": len(unique), "matched": matched, "newly_matched": newly, "unmatched": unmatched}


def main(argv: Optional[List[str]] = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Kadınlar 2. Ligi Volleybox takım adı eşleme raporu")
    parser.add_argument("--write", action="store_true", help="Değişiklikleri data/kadinlar_2_lig.json'a yaz")
    args = parser.parse_args(argv)

    with open(K2_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    report = enrich_k2_data(data, load_k2_mappings())

    print(f"Toplam takım: {report['total']} | Volleybox adı eşleşen: {report['matched']} | Eşleşmeyen: {len(report['unmatched'])}")
    for n in report["newly_matched"]:
        print(f"  + eşleme dosyasından tamamlandı: {n}")
    for n in report["unmatched"]:
        print(f"  ! eşleşmedi (TVF adı kalır): {n}")

    if args.write and report["newly_matched"]:
        with open(K2_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Yazıldı: {K2_FILE}")
    elif report["newly_matched"]:
        print("(kuru çalıştırma: yazmak için --write)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
