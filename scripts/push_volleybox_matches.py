#!/usr/bin/env python3
"""
scripts/push_volleybox_matches.py
Sitemizde bulunan ancak Volleybox.net üzerinde henüz yer almayan (eksik) maçları
Playwright aracılığıyla otomatik olarak ilgili Volleybox turnuvasına ekleyen bot.

Görseldeki Volleybox maç ekleme formu alanlarını birebir doldurur:
  1. Ev sahibi takımı seçin (- Ev sahibi takımı seçin -)
  2. Set skorları (0 - 0 veya oynanmış maçlar için 3 - 0, 3 - 1, 2 - 3 vb.)
  3. Deplasman takımını seçin (- Deplasman takımını seçin -)
  4. Tarih (- Tarih -, YYYY-MM-DD)
  5. Saat (- Saat -, HH:MM yerel saat)
  6. Tur seçin (- Tur seçin -)
  7. Saha seçin (- Saha seçin -)
  8. Hükmen (Hükmen anahtarı / walkover)
  9. + Ekle (#submit_button_hall)

Kullanım Örnekleri:
    # Eksik maçları tarayıp önizlemek için (tarayıcı açmaz):
    python scripts/push_volleybox_matches.py --dry-run

    # Belirli bir ildeki eksik maçları önizlemek için:
    python scripts/push_volleybox_matches.py --city zonguldak --dry-run

    # Volleybox hesabına giriş yapıp oturumu kaydetmek için:
    python scripts/push_volleybox_matches.py --login

    # Belirli bir ilin eksik maçlarını formu doldurup gözle kontrol ederek test etmek için:
    python scripts/push_volleybox_matches.py --city zonguldak --inspect-form

    # Belirli bir ilin eksik maçlarını otomatik eklemek için:
    python scripts/push_volleybox_matches.py --city zonguldak
"""

import os
import sys
import re
import json
import time
import random
import shutil
import subprocess
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from scripts.sync_volleybox_matches import (
    DATA_DIR,
    MAPPINGS_FILE,
    FIXTURES_FILE,
    CITIES_DIR,
    K2_FILE,
    normalize_name,
    normalize_tourn_key,
    team_match_score,
    halls_match,
    fetch_volleybox_tournament_matches,
    match_tvf_with_vb,
    vb_round_to_tr_group_aliases,
)

AUTH_STATE_FILE = DATA_DIR / ".volleybox_auth.json"
BROWSER_PROFILE_DIR = DATA_DIR / ".volleybox_browser_profile"


def ensure_playwright():
    """Playwright mevcut Python ortamında yoksa sistem Python yorumlayıcısını dener."""
    try:
        import playwright.sync_api  # noqa: F401
        return
    except ImportError:
        sys_py = shutil.which("python") or shutil.which("python3")
        if sys_py and Path(sys_py).resolve() != Path(sys.executable).resolve():
            res = subprocess.run(
                [sys_py, "-c", "import playwright"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            if res.returncode == 0:
                sys.exit(subprocess.call([sys_py] + sys.argv))
        print(
            "❌ Hata: 'playwright' kütüphanesi bulunamadı.\n"
            "Kurmak için:\n"
            "  pip install playwright\n"
            "  playwright install chromium"
        )
        sys.exit(1)


def is_forfeit_match(m: Dict[str, Any]) -> bool:
    """Maçın hükmen (walkover) olup olmadığını tespit eder."""
    if m.get("forfeit") or m.get("is_forfeit") or m.get("walkover"):
        return True

    for field in ("home_team", "away_team", "score", "status", "note"):
        val = str(m.get(field) or "")
        if re.search(r"[\(\[]\s*h\s*[\)\]]|hükmen|hukmen", val, flags=re.IGNORECASE):
            return True

    set_scores = m.get("set_scores") or []
    if len(set_scores) == 3:
        cleaned = [str(s).replace(" ", "") for s in set_scores]
        if cleaned == ["25-0", "25-0", "25-0"] or cleaned == ["0-25", "0-25", "0-25"]:
            return True

    return False


def parse_match_sets(m: Dict[str, Any]) -> Tuple[int, int]:
    """Maçın ev sahibi ve deplasman set skorlarını döndürür (oynanmamışsa 0, 0)."""
    h = m.get("home_score")
    a = m.get("away_score")
    if h is not None and a is not None:
        try:
            hi, ai = int(h), int(a)
            if 0 <= hi <= 3 and 0 <= ai <= 3 and (hi > 0 or ai > 0):
                return hi, ai
        except (ValueError, TypeError):
            pass

    score_str = str(m.get("score") or m.get("skor") or "").strip()
    m_sc = re.match(r"^(\d)\s*[-:]\s*(\d)$", score_str)
    if m_sc:
        hi, ai = int(m_sc.group(1)), int(m_sc.group(2))
        if 0 <= hi <= 3 and 0 <= ai <= 3 and (hi > 0 or ai > 0):
            return hi, ai

    return 0, 0


def build_team_alias_map(mappings_data: Dict[str, Any]) -> Dict[str, set]:
    team_alias_map: Dict[str, set] = {}
    for item in mappings_data.get("mappings", []):
        in_name = item.get("internal_name", "").strip()
        matched = item.get("matched_as", "").strip()
        aliases = item.get("aliases", []) or []
        synonyms = item.get("synonyms", []) or []
        all_names = [in_name, matched] + aliases + synonyms
        for n in all_names:
            if n:
                k = n.strip().lower()
                for target in all_names:
                    if target:
                        team_alias_map.setdefault(k, set()).add(target.strip())
    return team_alias_map


def build_tournament_lookup(mappings_data: Dict[str, Any]) -> Dict[str, str]:
    """2026/27 sezonu için (kategori, il) -> volleybox_url haritasını oluşturur."""
    lookup: Dict[str, str] = {}
    for l in mappings_data.get("leagues", []):
        season = (l.get("season") or "").strip()
        url = (l.get("volleybox_url") or "").strip()
        if not url or (season and season != "2026/27"):
            continue
        if any(old in url for old in ("-2025-26-", "-2024-25-", "-2023-24-")):
            continue

        internal_name = (l.get("internal_name") or "").strip()
        city = (l.get("city") or "").strip()
        age_cat = (l.get("age_category") or "").strip().lower()

        if city and internal_name:
            lookup[normalize_tourn_key(internal_name, city)] = url
            lookup[f"{internal_name}::{city}".lower()] = url

            if normalize_name(city) == "aydin" and age_cat == "u18":
                lookup[normalize_tourn_key("Genç Kızlar 1. Ligi", city)] = url
                lookup[normalize_tourn_key("Genç Kızlar Süper Lig", city)] = url

            if age_cat:
                lookup.setdefault(f"{city}::{age_cat}".lower(), url)
                lookup.setdefault(f"{normalize_name(city)}::{age_cat}".lower(), url)

    return lookup


def resolve_match_tournament_url(m: Dict[str, Any], city: str, tourn_lookup: Dict[str, str]) -> Optional[str]:
    cat = m.get("category", "")
    grp = m.get("group", "")
    age_group = m.get("age_group", "")
    age_code = (
        "u18"
        if ("genç" in age_group.lower() or "genc" in age_group.lower() or "u18" in cat.lower() or "genç" in cat.lower())
        else (
            "u16"
            if ("yıldız" in age_group.lower() or "yildiz" in age_group.lower() or "u16" in cat.lower() or "yıldız" in cat.lower())
            else ""
        )
    )

    if grp:
        u = tourn_lookup.get(normalize_tourn_key(grp, city)) or tourn_lookup.get(f"{grp}::{city}".lower())
        if u:
            return u

    if cat:
        u = tourn_lookup.get(normalize_tourn_key(cat, city)) or tourn_lookup.get(f"{cat}::{city}".lower())
        if u:
            return u

    if age_code:
        u = (
            tourn_lookup.get(f"{normalize_name(city)}::{age_code}".lower())
            or tourn_lookup.get(f"{city}::{age_code}".lower())
        )
        if u:
            return u

    return None


def collect_unsynced_matches(
    tourn_lookup: Dict[str, str],
    city_filter: Optional[str] = None,
    include_pro: bool = False,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Sitemizdeki JSON dosyalarından henüz Volleybox'ta olmayan (synced == False)
    ve geçerli bir tarihi + Volleybox turnuva URL'si olan maçları turnuva bazında toplar.
    """
    by_tournament: Dict[str, List[Dict[str, Any]]] = {}

    def process_city_file(path: Path, default_city: str):
        if not path.exists():
            return
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        city_name = data.get("city") or default_city
        city_slug = data.get("slug") or path.stem.lower()

        if city_filter:
            cf = normalize_name(city_filter)
            if cf not in (normalize_name(city_name), normalize_name(city_slug), city_slug.lower()):
                return

        for m in data.get("matches", []):
            vb = m.get("volleybox") or {}
            if vb.get("synced"):
                continue
            m_date = str(m.get("date") or "").strip()
            if not m_date or m_date.upper() == "TBD" or not re.match(r"^\d{4}-\d{2}-\d{2}$", m_date):
                continue

            t_url = resolve_match_tournament_url(m, city_name, tourn_lookup)
            if not t_url:
                continue

            h_sets, a_sets = parse_match_sets(m)
            item = {
                "id": m.get("id"),
                "city": city_name,
                "city_slug": city_slug,
                "category": m.get("category", ""),
                "group": m.get("group", ""),
                "home_team": m.get("home_team", ""),
                "away_team": m.get("away_team", ""),
                "home_sets": h_sets,
                "away_sets": a_sets,
                "set_scores": m.get("set_scores") or [],
                "date": m_date,
                "time": m.get("time") if m.get("time") and m.get("time") != "--:--" else "",
                "hall": m.get("hall") if m.get("hall") and m.get("hall") not in ("TBD", "-") else "",
                "forfeit": is_forfeit_match(m),
                "raw_match": m,
            }
            by_tournament.setdefault(t_url, []).append(item)

    process_city_file(FIXTURES_FILE, "İstanbul")
    if CITIES_DIR.exists():
        for cj in sorted(CITIES_DIR.glob("*.json")):
            process_city_file(cj, cj.stem.capitalize())

    pro_configs = [
        (K2_FILE, "Kadınlar 2. Ligi", "kadinlar-2-ligi", "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047"),
        (DATA_DIR / "kadinlar_1_lig.json", "KFC Kadınlar 1. Ligi", "kadinlar-1-ligi", "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-1-ligi-2026-27-o45210"),
        (DATA_DIR / "sultanlar_ligi.json", "Vodafone Sultanlar Ligi", "sultanlar-ligi", "https://women.volleybox.net/tr/women-vodafone-sultanlar-ligi-2026-27-o45086"),
    ]
    for p_file, p_name, p_slug, p_url in pro_configs:
        should_run = include_pro or (city_filter and city_filter.lower() in (p_slug, normalize_name(p_name)))
        if not should_run or not p_file.exists():
            continue
        with open(p_file, "r", encoding="utf-8") as f:
            pdata = json.load(f)
        for m in pdata.get("tum_maclar", []):
            vb = m.get("volleybox") or {}
            if vb.get("synced"):
                continue
            tarih = str(m.get("tarih") or "").strip()
            d_str = ""
            if "." in tarih:
                parts = tarih.split(".")
                if len(parts) == 3:
                    d_str = f"{parts[2]}-{parts[1]}-{parts[0]}"
            elif "-" in tarih:
                d_str = tarih
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", d_str):
                continue
            h_sets, a_sets = parse_match_sets(m)
            item = {
                "id": m.get("id"),
                "city": "Türkiye",
                "city_slug": p_slug,
                "category": p_name,
                "group": m.get("grup", ""),
                "home_team": m.get("takim_a", ""),
                "away_team": m.get("takim_b", ""),
                "home_sets": h_sets,
                "away_sets": a_sets,
                "set_scores": m.get("setler") or [],
                "date": d_str,
                "time": m.get("saat") if m.get("saat") and m.get("saat") != "--:--" else "",
                "hall": m.get("salon") if m.get("salon") and m.get("salon") not in ("TBD", "-") else "",
                "forfeit": is_forfeit_match(m),
                "raw_match": {
                    "id": m.get("id"),
                    "home_team": m.get("takim_a", ""),
                    "away_team": m.get("takim_b", ""),
                    "date": d_str,
                    "time": m.get("saat", ""),
                    "hall": m.get("salon", ""),
                },
            }
            by_tournament.setdefault(p_url, []).append(item)

    return by_tournament


def match_option_for_team(
    tvf_team: str,
    options: List[Dict[str, str]],
    team_alias_map: Dict[str, set],
) -> Optional[Dict[str, str]]:
    """
    Volleybox'taki '- Ev sahibi takımı seçin -' veya '- Deplasman takımını seçin -'
    seçenekleri arasından TVF takımına karşılık gelen seçeneği bulur.
    """
    synonyms = team_alias_map.get(tvf_team.lower().strip(), set())
    best_opt = None
    best_score = 0

    for opt in options:
        val = str(opt.get("value") or "").strip()
        label = str(opt.get("label") or "").strip()
        if not val or val == "0" or label.startswith("-"):
            continue
        sc = team_match_score(tvf_team, label, synonyms)
        if sc >= 70 and sc > best_score:
            best_score = sc
            best_opt = opt

    return best_opt


def match_option_for_round(group_name: str, options: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """
    '- Tur seçin -' menüsündeki seçeneklerden maça uygun turu/grubu seçer.
    Eğer turnuvada tek bir tur varsa (örn. Regular Season / Normal Sezon) doğrudan onu seçer.
    """
    valid_opts = [
        o for o in options
        if str(o.get("value") or "").strip() not in ("", "0") and not str(o.get("label") or "").strip().startswith("-")
    ]
    if not valid_opts:
        return None
    if len(valid_opts) == 1:
        return valid_opts[0]

    g_clean = (group_name or "").lower().strip()
    if g_clean:
        # Örn: "A Grubu" -> "Group A", "1. Grup" -> "Group 1"
        m_letter = re.search(r"\b([a-z0-9])\s*grubu\b|\bgrup\s*([a-z0-9])\b|\b(\d+)\.\s*grup\b", g_clean, re.I)
        target_token = (m_letter.group(1) or m_letter.group(2) or m_letter.group(3)).lower() if m_letter else None

        for opt in valid_opts:
            lbl = opt["label"].lower().strip()
            aliases = vb_round_to_tr_group_aliases(lbl)
            if g_clean in aliases or g_clean == lbl:
                return opt
            if target_token:
                if re.search(rf"\b(group|grup)\s*{re.escape(target_token)}\b|\b{re.escape(target_token)}\s*grubu\b", lbl, re.I):
                    return opt

    # Grup belirtilmemişse ilk turu (genellikle Regular Season / 1. Etap) seç
    return valid_opts[0]


def match_option_for_arena(tvf_hall: str, options: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """'- Saha seçin -' menüsündeki seçeneklerden salonu eşleştirir."""
    if not tvf_hall:
        return None
    for opt in options:
        val = str(opt.get("value") or "").strip()
        label = str(opt.get("label") or "").strip()
        if not val or val == "0" or label.startswith("-"):
            continue
        if halls_match(tvf_hall, label):
            return opt
    return None


def to_tr_matches_url(url: str) -> str:
    """Turnuva URL'sinin Türkçe (/tr/) ve /matches uzantılı olduğundan emin olur."""
    u = url.rstrip("/")
    if "/tr/" not in u:
        u = u.replace("https://women.volleybox.net/", "https://women.volleybox.net/tr/")
    if not u.endswith("/matches"):
        u = u + "/matches"
    return u


def run_login_flow():
    ensure_playwright()
    from playwright.sync_api import sync_playwright

    print("\n🔐 Volleybox oturum açma penceresi başlatılıyor...")
    print("👉 Açılan tarayıcıda Volleybox hesabınıza giriş yapın. Giriş algılandığında oturum otomatik kaydedilecektir.\n")

    BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(BROWSER_PROFILE_DIR),
            headless=False,
            viewport={"width": 1280, "height": 860},
            locale="tr-TR",
            timezone_id="Europe/Istanbul",
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto("https://women.volleybox.net/tr/login", wait_until="domcontentloaded")

        logged_in = False
        for _ in range(300):  # 5 dakika bekle
            try:
                uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
                if uid and uid > 0:
                    logged_in = True
                    print(f"✅ Giriş başarılı! (Volleybox userId: {uid})")
                    break
            except Exception:
                pass
            time.sleep(1.0)

        if logged_in:
            context.storage_state(path=str(AUTH_STATE_FILE))
            print(f"💾 Oturum kaydedildi: {AUTH_STATE_FILE}")
        else:
            print("⚠️ Giriş zaman aşımına uğradı veya tamamlanmadı.")

        context.close()


def fill_and_submit_match_on_page(
    page,
    match_item: Dict[str, Any],
    team_alias_map: Dict[str, set],
    inspect_only: bool = False,
) -> Tuple[bool, str]:
    """
    Açık olan Volleybox turnuva /matches sayfasında '+ Ekle' formunu açar,
    görseldeki alanları doldurur ve gönderir.
    """
    # 1. Form görünür değilse '+ Ekle' (#add-match-trigger) butonuna tıkla
    form_visible = page.evaluate(
        """() => {
            const c = document.querySelector('#add_match_container, #add_match_form');
            return !!(c && c.offsetParent !== null);
        }"""
    )
    if not form_visible:
        clicked = page.evaluate(
            """() => {
                const trigger = document.querySelector('#add-match-trigger')
                    || Array.from(document.querySelectorAll('a, button')).find(el => {
                        const t = (el.textContent || '').trim();
                        return t === 'Ekle' || t === '+ Ekle' || t === 'Add' || t === '+ Add';
                    });
                if (trigger) {
                    trigger.click();
                    return true;
                }
                return false;
            }"""
        )
        if not clicked:
            return False, "Sayfada 'Ekle' (#add-match-trigger) butonu bulunamadı"
        time.sleep(1.0)

    # 2. Form içindeki tüm <select> menülerinin seçeneklerini oku
    form_meta = page.evaluate(
        """() => {
            const root = document.querySelector('#add_match_container, #add_match_form') || document;
            const selects = Array.from(root.querySelectorAll('select')).filter(s => s.offsetParent !== null);
            return selects.map((s, idx) => ({
                idx,
                name: s.getAttribute('name') || '',
                id: s.getAttribute('id') || '',
                firstLabel: s.options.length > 0 ? s.options[0].text.trim() : '',
                options: Array.from(s.options).map(o => ({ value: o.value, label: o.text.trim() }))
            }));
        }"""
    )

    if not form_meta:
        return False, "Maç ekleme formundaki seçim menüleri (<select>) yüklenemedi"

    # Menüleri ilk seçeneğin metnine veya name özelliğine göre sınıflandır
    host_select = None
    guest_select = None
    host_sets_select = None
    guest_sets_select = None
    round_select = None
    arena_select = None

    set_Select_candidates = []
    for s in form_meta:
        fl = s["firstLabel"].lower()
        nm = s["name"].lower()
        if "ev sahibi" in fl or "host" in fl or "host_id" in nm or "host_team" in nm or "team1" in nm:
            host_select = s
        elif "deplasman" in fl or "guest" in fl or "away" in fl or "guest_id" in nm or "guest_team" in nm or "team2" in nm:
            guest_select = s
        elif "tur seç" in fl or "round" in fl or "round" in nm or "stage" in nm:
            round_select = s
        elif "saha seç" in fl or "arena" in fl or "hall" in fl or "arena" in nm or "hall" in nm:
            arena_select = s
        elif any(o["label"] in ("0", "1", "2", "3") for o in s["options"]) and len(s["options"]) <= 7:
            set_Select_candidates.append(s)

    if len(set_Select_candidates) >= 2:
        host_sets_select = set_Select_candidates[0]
        guest_sets_select = set_Select_candidates[1]

    if not host_select or not guest_select:
        return False, f"Ev sahibi veya deplasman menüsü tespit edilemedi (bulunan menüler: {[s['firstLabel'] for s in form_meta]})"

    # 3. Ev sahibi ve deplasman takımlarını eşleştir
    host_opt = match_option_for_team(match_item["home_team"], host_select["options"], team_alias_map)
    if not host_opt:
        return (
            False,
            f"Ev sahibi takım turnuva kadrosunda bulunamadı: '{match_item['home_team']}' "
            f"(Mevcut: {[o['label'] for o in host_select['options'] if not o['label'].startswith('-')]})",
        )

    guest_opt = match_option_for_team(match_item["away_team"], guest_select["options"], team_alias_map)
    if not guest_opt:
        return (
            False,
            f"Deplasman takımı turnuva kadrosunda bulunamadı: '{match_item['away_team']}' "
            f"(Mevcut: {[o['label'] for o in guest_select['options'] if not o['label'].startswith('-')]})",
        )

    # 4. Tur ve Saha eşleştirmesi
    round_opt = match_option_for_round(match_item.get("group", ""), round_select["options"]) if round_select else None
    arena_opt = match_option_for_arena(match_item.get("hall", ""), arena_select["options"]) if arena_select else None

    # 5. Form alanlarını tarayıcıda doldur
    payload = {
        "hostIdx": host_select["idx"],
        "hostVal": host_opt["value"],
        "guestIdx": guest_select["idx"],
        "guestVal": guest_opt["value"],
        "hostSetsIdx": host_sets_select["idx"] if host_sets_select else None,
        "hostSetsVal": str(match_item["home_sets"]),
        "guestSetsIdx": guest_sets_select["idx"] if guest_sets_select else None,
        "guestSetsVal": str(match_item["away_sets"]),
        "roundIdx": round_select["idx"] if (round_select and round_opt) else None,
        "roundVal": round_opt["value"] if round_opt else None,
        "arenaIdx": arena_select["idx"] if (arena_select and arena_opt) else None,
        "arenaVal": arena_opt["value"] if arena_opt else None,
        "date": match_item["date"],
        "time": match_item["time"] or "",
        "forfeit": bool(match_item["forfeit"]),
        "setScores": match_item.get("set_scores") or [],
    }

    page.evaluate(
        """(p) => {
            const root = document.querySelector('#add_match_container, #add_match_form') || document;
            const selects = Array.from(root.querySelectorAll('select')).filter(s => s.offsetParent !== null);

            function setSelect(idx, val) {
                if (idx === null || idx === undefined || !selects[idx] || !val) return;
                const el = selects[idx];
                el.value = val;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                if (window.jQuery) {
                    window.jQuery(el).val(val).trigger('change');
                }
            }

            setSelect(p.hostIdx, p.hostVal);
            setSelect(p.guestIdx, p.guestVal);
            setSelect(p.hostSetsIdx, p.hostSetsVal);
            setSelect(p.guestSetsIdx, p.guestSetsVal);
            setSelect(p.roundIdx, p.roundVal);
            setSelect(p.arenaIdx, p.arenaVal);

            const inputs = Array.from(root.querySelectorAll('input')).filter(i => i.offsetParent !== null);
            for (const inp of inputs) {
                const ph = (inp.getAttribute('placeholder') || '').toLowerCase();
                const nm = (inp.getAttribute('name') || '').toLowerCase();
                const tp = (inp.getAttribute('type') || '').toLowerCase();
                if (ph.includes('tarih') || ph.includes('date') || nm.includes('date') || tp === 'date') {
                    inp.value = p.date;
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    if (window.jQuery) window.jQuery(inp).val(p.date).trigger('change');
                } else if (ph.includes('saat') || ph.includes('time') || ph.includes('hour') || nm.includes('time') || nm.includes('hour') || tp === 'time') {
                    if (p.time) {
                        inp.value = p.time;
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                        inp.dispatchEvent(new Event('change', { bubbles: true }));
                        if (window.jQuery) window.jQuery(inp).val(p.time).trigger('change');
                    }
                }
            }

            // Hükmen (walkover) anahtarı
            const checkboxes = Array.from(root.querySelectorAll('input[type="checkbox"]'));
            for (const cb of checkboxes) {
                const nm = (cb.getAttribute('name') || '').toLowerCase();
                const parentText = (cb.closest('label, div')?.textContent || '').toLowerCase();
                if (nm.includes('walkover') || parentText.includes('hükmen') || parentText.includes('walkover')) {
                    if (cb.checked !== p.forfeit) {
                        cb.click();
                    }
                    break;
                }
            }
        }""",
        payload,
    )

    # Eğer set skoru seçildikten sonra küçük set sayı kutuları açıldıysa ve set_scores varsa doldur
    if (match_item["home_sets"] > 0 or match_item["away_sets"] > 0) and match_item.get("set_scores"):
        time.sleep(0.4)
        page.evaluate(
            """(setScores) => {
                const root = document.querySelector('#add_match_container, #add_match_form') || document;
                for (let idx = 0; idx < setScores.length; idx++) {
                    const parts = String(setScores[idx]).split(/[-:]/).map(s => s.trim());
                    if (parts.length !== 2) continue;
                    const sNo = idx + 1;
                    const hInp = root.querySelector(`input[name*="set_${sNo}_host"], input[name*="set${sNo}_host"], input[name*="host_set_${sNo}"], input[name*="small_points_host_${sNo}"]`);
                    const gInp = root.querySelector(`input[name*="set_${sNo}_guest"], input[name*="set${sNo}_guest"], input[name*="guest_set_${sNo}"], input[name*="small_points_guest_${sNo}"]`);
                    if (hInp && gInp) {
                        hInp.value = parts[0];
                        gInp.value = parts[1];
                        hInp.dispatchEvent(new Event('change', { bubbles: true }));
                        gInp.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }""",
            match_item["set_scores"],
        )

    summary = (
        f"{host_opt['label']} ({match_item['home_sets']}-{match_item['away_sets']}) {guest_opt['label']} | "
        f"Tarih: {match_item['date']} {match_item['time'] or '--:--'} | "
        f"Tur: {round_opt['label'] if round_opt else 'Varsayılan'} | "
        f"Saha: {arena_opt['label'] if arena_opt else 'Seçilmedi'}"
        + (" | HÜKMEN" if match_item["forfeit"] else "")
    )

    if inspect_only:
        print(f"   👀 [İNCELEME MODU] Form dolduruldu: {summary}")
        input("   👉 Tarayıcıda formu kontrol edin. Devam etmek için Enter'a basın...")
        return True, summary

    # 6. '+ Ekle' (#submit_button_hall) butonuna tıkla
    submitted = page.evaluate(
        """() => {
            const root = document.querySelector('#add_match_container, #add_match_form') || document;
            const btn = root.querySelector('#submit_button_hall, button[type="submit"], input[type="submit"]')
                || Array.from(root.querySelectorAll('button, a')).find(el => {
                    const t = (el.textContent || '').trim();
                    return t.includes('Ekle') || t.includes('Add');
                });
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }"""
    )
    if not submitted:
        return False, "Form içindeki '+ Ekle' (#submit_button_hall) gönderme butonu bulunamadı"

    time.sleep(2.5)
    # Hata mesajı var mı kontrol et
    err_text = page.evaluate(
        """() => {
            const err = document.querySelector('#add_match_form p.errors, #add_match_container .formError, .ui-dialog-content');
            return err && err.offsetParent !== null ? err.textContent.trim() : '';
        }"""
    )
    if err_text:
        return False, f"Volleybox form uyarısı: {err_text}"

    return True, summary


def main():
    parser = argparse.ArgumentParser(description="Sitedeki eksik maçları Volleybox'a otomatik ekleyen Playwright botu")
    parser.add_argument("--city", default=None, help="Sadece belirli bir ili/ligi işle (örn: zonguldak, afyon, kocaeli, istanbul)")
    parser.add_argument("--dry-run", action="store_true", help="Tarayıcı açmadan eklenecek eksik maçları listele")
    parser.add_argument("--login", action="store_true", help="Volleybox hesabına giriş yapıp oturumu kaydet")
    parser.add_argument("--inspect-form", action="store_true", help="Formu doldurup '+ Ekle'ye basmadan önce onay bekle")
    parser.add_argument("--include-pro", action="store_true", help="Profesyonel ligleri (Sultanlar, 1. Lig, 2. Lig) dahil et")
    parser.add_argument("--limit", type=int, default=25, help="Tek çalıştırmada eklenecek maksimum maç sayısı (varsayılan: 25)")
    parser.add_argument("--delay", type=float, default=8.0, help="Maç eklemeleri arasındaki bekleme süresi (saniye, varsayılan: 8.0)")
    parser.add_argument("--headless", action="store_true", help="Tarayıcıyı arka planda (görünmez) çalıştır")
    args = parser.parse_args()

    if args.login:
        run_login_flow()
        return

    if not MAPPINGS_FILE.exists():
        print(f"❌ Hata: {MAPPINGS_FILE} bulunamadı!")
        sys.exit(1)

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)

    team_alias_map = build_team_alias_map(mappings_data)
    tourn_lookup = build_tournament_lookup(mappings_data)
    by_tournament = collect_unsynced_matches(tourn_lookup, city_filter=args.city, include_pro=args.include_pro)

    total_candidates = sum(len(v) for v in by_tournament.values())
    print("\n" + "=" * 78)
    print("🤖 VOLLEYBOX OTOMATİK MAÇ EKLEME BOTU (push_volleybox_matches.py)")
    print("=" * 78)

    if total_candidates == 0:
        print("✅ Harika! Seçilen kapsamda Volleybox'ta eksik olan hiçbir maç bulunmuyor.")
        return

    print(f"📋 Toplam {len(by_tournament)} turnuvada {total_candidates} adet Volleybox'ta olmayan maç tespit edildi.\n")

    for t_url, m_list in by_tournament.items():
        slug = t_url.rstrip("/").split("/")[-1]
        city_label = m_list[0]["city"]
        cat_label = m_list[0]["category"]
        print(f"🏆 {city_label} — {cat_label} ({slug}) [{len(m_list)} eksik maç]:")
        for idx, m in enumerate(m_list[:10], 1):
            sc = f"{m['home_sets']}-{m['away_sets']}" if (m["home_sets"] or m["away_sets"]) else "0-0"
            hukmen = " [HÜKMEN]" if m["forfeit"] else ""
            print(
                f"   {idx:>2}. {m['date']} {m['time'] or '--:--'} | "
                f"{m['home_team']} ({sc}) {m['away_team']} | "
                f"Tur: {m['group'] or '-'} | Saha: {m['hall'] or '-'}{hukmen}"
            )
        if len(m_list) > 10:
            print(f"   ... ve {len(m_list) - 10} maç daha.")
        print()

    if args.dry_run:
        print("ℹ️ '--dry-run' (önizleme) modu aktif olduğu için Volleybox'a gönderim yapılmadı.")
        print("👉 Gönderimi başlatmak için '--dry-run' parametresi olmadan çalıştırabilirsiniz.")
        return

    ensure_playwright()
    from playwright.sync_api import sync_playwright

    BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    added_total = 0
    touched_cities = set()

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(BROWSER_PROFILE_DIR),
            headless=args.headless and not args.inspect_form,
            viewport={"width": 1366, "height": 900},
            locale="tr-TR",
            timezone_id="Europe/Istanbul",
        )
        page = context.pages[0] if context.pages else context.new_page()

        for t_url, m_list in by_tournament.items():
            if added_total >= args.limit:
                break

            # Mükerrer eklemeyi önlemek için turnuvadaki canlı maçları son kez kontrol et
            live_vb_matches = fetch_volleybox_tournament_matches(t_url)
            used_vb_ids: set = set()

            matches_url = to_tr_matches_url(t_url)
            print(f"\n🌐 Turnuva sayfası açılıyor: {matches_url}")
            page.goto(matches_url, wait_until="domcontentloaded")
            time.sleep(2.0)

            # Giriş kontrolü
            uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
            if not uid or uid <= 0:
                print("🔐 Volleybox oturumu açık değil. Lütfen açılan tarayıcıda giriş yapın...")
                page.goto("https://women.volleybox.net/tr/login", wait_until="domcontentloaded")
                for _ in range(180):
                    try:
                        uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
                        if uid and uid > 0:
                            context.storage_state(path=str(AUTH_STATE_FILE))
                            print(f"✅ Giriş algılandı (userId={uid}), turnuva sayfasına dönülüyor...")
                            break
                    except Exception:
                        pass
                    time.sleep(1.0)
                if not uid or uid <= 0:
                    print("❌ Volleybox girişi yapılmadığı için işlem durduruldu.")
                    context.close()
                    return
                page.goto(matches_url, wait_until="domcontentloaded")
                time.sleep(2.0)

            for m_item in m_list:
                if added_total >= args.limit:
                    print(f"⏹️ Maksimum maç ekleme sınırına ({args.limit}) ulaşıldı.")
                    break

                # Canlı listede zaten varsa atla
                already_on_vb = match_tvf_with_vb(m_item["raw_match"], live_vb_matches, team_alias_map, used_vb_ids)
                if already_on_vb:
                    print(f"   ⏭️ Zaten Volleybox'ta mevcut, atlanıyor: {m_item['home_team']} vs {m_item['away_team']} ({already_on_vb['url']})")
                    touched_cities.add(m_item["city_slug"])
                    continue

                ok, msg = fill_and_submit_match_on_page(
                    page,
                    m_item,
                    team_alias_map,
                    inspect_only=args.inspect_form,
                )
                if ok:
                    added_total += 1
                    touched_cities.add(m_item["city_slug"])
                    print(f"   ✅ [{added_total}/{args.limit}] Eklendi: {msg}")
                    wait_sec = args.delay + random.uniform(0.5, 3.0)
                    time.sleep(wait_sec)
                else:
                    print(f"   ⚠️ Atlandı ({m_item['home_team']} vs {m_item['away_team']}): {msg}")

        context.close()

    # Eklenen maçların Volleybox linklerini JSON dosyalarına kaydetmek için senkronizasyonu çalıştır
    if touched_cities and not args.inspect_form:
        print("\n🔄 Yeni eklenen maçların Volleybox bağlantıları sitemizle senkronize ediliyor...")
        for c_slug in sorted(touched_cities):
            subprocess.call([sys.executable, str(BASE_DIR / "scripts" / "sync_volleybox_matches.py"), "--city", c_slug])

    print(f"\n🎉 İşlem tamamlandı! Toplam {added_total} yeni maç Volleybox'a eklendi.")


if __name__ == "__main__":
    main()
