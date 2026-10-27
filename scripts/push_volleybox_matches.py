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
from datetime import datetime
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
LIVE_SCREENSHOT_FILE = DATA_DIR / ".volleybox_bot_live.png"
LIVE_STATUS_FILE = DATA_DIR / ".volleybox_bot_status.json"


def load_env_files():
    """Projeye ait .env.local ve .env dosyalarını okuyup os.environ'a yükler."""
    project_root = DATA_DIR.parent
    for name in [".env.local", ".env"]:
        p = project_root / name
        if p.exists():
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v
            except Exception:
                pass


load_env_files()


def log_step(msg: str):
    """Satırı anında stdout'a basar (panel canlı konsolu için flush=True)."""
    print(msg, flush=True)


def save_live_screenshot(page):
    """Tarayıcının o anki ekran görüntüsünü panelde canlı izleme için kaydeder."""
    try:
        tmp_path = LIVE_SCREENSHOT_FILE.with_suffix(".tmp.png")
        page.screenshot(path=str(tmp_path), full_page=False)
        tmp_path.replace(LIVE_SCREENSHOT_FILE)
    except Exception:
        pass



def ensure_playwright():
    """Playwright mevcut Python ortamında yoksa sistem Python yorumlayıcısını dener."""
    try:
        import playwright.sync_api  # noqa: F401
        return
    except ImportError:
        for py_candidate in ["python3", "python"]:
            sys_py = shutil.which(py_candidate)
            if sys_py and Path(sys_py).resolve() != Path(sys.executable).resolve():
                res = subprocess.run(
                    [sys_py, "-c", "import playwright"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                if res.returncode == 0:
                    sys.exit(subprocess.call([sys_py] + sys.argv))
        log_step(
            "❌ Hata: Python ortamında 'playwright' kütüphanesi bulunamadı.\n"
            "Sunucu ortamında çalıştırmak için:\n"
            "  pip install playwright\n"
            "  playwright install chromium\n"
            "komutlarını uygulayınız."
        )
        sys.exit(1)


def apply_saved_auth(context):
    """Kayıtlı auth dosyasından veya VOLLEYBOX_COOKIE ortam değişkeninden oturum çerezlerini yükler."""
    if AUTH_STATE_FILE.exists():
        try:
            with open(AUTH_STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
                cookies = state.get("cookies", [])
                if cookies:
                    context.add_cookies(cookies)
                    log_step(f"🔑 {len(cookies)} adet oturum çerezi {AUTH_STATE_FILE.name} dosyasından yüklendi.")
        except Exception as e:
            log_step(f"⚠️ Oturum dosyası okunurken hata: {e}")

    env_cookie = os.environ.get("VOLLEYBOX_COOKIE") or os.environ.get("VOLLEYBOX_COOKIES")
    if env_cookie:
        try:
            parsed_cookies = []
            for part in env_cookie.split(";"):
                part = part.strip()
                if not part or "=" not in part:
                    continue
                k, v = part.split("=", 1)
                parsed_cookies.append({
                    "name": k.strip(),
                    "value": v.strip(),
                    "domain": ".volleybox.net",
                    "path": "/",
                })
            if parsed_cookies:
                context.add_cookies(parsed_cookies)
                log_step(f"🔑 {len(parsed_cookies)} adet çerez VOLLEYBOX_COOKIE ortam değişkeninden yüklendi.")
        except Exception as e:
            log_step(f"⚠️ VOLLEYBOX_COOKIE ayrıştırılamadı: {e}")


def try_env_credentials_login(page, context) -> bool:
    """VOLLEYBOX_USERNAME ve VOLLEYBOX_PASSWORD tanımlıysa otomatik login dener."""
    username = (
        os.environ.get("VOLLEYBOX_USERNAME")
        or os.environ.get("VOLLEYBOX_EMAIL")
        or os.environ.get("VOLLEYBOX_USER")
    )
    password = os.environ.get("VOLLEYBOX_PASSWORD") or os.environ.get("VOLLEYBOX_PASS")
    if not username or not password:
        return False

    log_step("🔑 Ortam değişkenlerinden Volleybox hesap bilgileri tespit edildi, otomatik form dolduruluyor...")
    try:
        page.wait_for_selector("input[type='password']", timeout=8000)
        for sel in [
            "input[name='login']",
            "input[name='email']",
            "input[name='username']",
            "input[type='email']",
            "input[type='text']",
        ]:
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                loc.first.fill(username)
                break
        pwd_loc = page.locator("input[name='password'], input[type='password']")
        if pwd_loc.count() > 0:
            pwd_loc.first.fill(password)
        save_live_screenshot(page)
        time.sleep(0.5)

        # 1. Parola alanında Enter'a bas
        if pwd_loc.count() > 0:
            try:
                pwd_loc.first.press("Enter")
            except Exception:
                pass

        # 2. Parola kutusunun altındaki 'Giriş' butonuna tıkla (navbar linkini atlamak için Y pozisyonu kontrol edilir)
        page.evaluate("""() => {
            const pwd = document.querySelector('input[type="password"]');
            if (!pwd) return;
            const pwdRect = pwd.getBoundingClientRect();
            const parent = pwd.closest('form') || pwd.parentElement?.parentElement;

            const formBtn = parent ? parent.querySelector('button, input[type="submit"], [type="submit"], a.btn, .btn') : null;
            if (formBtn) {
                formBtn.click();
                return;
            }

            const belowBtn = Array.from(document.querySelectorAll('button, a, div[role="button"]')).find(el => {
                const rect = el.getBoundingClientRect();
                return rect.top > pwdRect.top && (el.textContent || '').toLowerCase().includes('giriş');
            });
            if (belowBtn) {
                belowBtn.click();
            }
        }""")

        log_step("🚀 Giriş formu gönderildi, yanıt kontrol ediliyor...")
        time.sleep(4.0)
        save_live_screenshot(page)

        for _ in range(10):
            try:
                uid = page.evaluate("""() => {
                    if (typeof window.userId !== 'undefined' && Number(window.userId) > 0) return Number(window.userId);
                    const logout = document.querySelector('a[href*="logout"], a[href*="/logout"]');
                    if (logout) return 1;
                    if (!window.location.pathname.includes('/login') && !document.querySelector('input[type="password"]')) return 1;
                    return 0;
                }""")
                if uid and uid > 0:
                    context.storage_state(path=str(AUTH_STATE_FILE))
                    log_step(f"🎉 Giriş başarılı! (Volleybox userId: {uid}) Oturum kaydedildi.")
                    return True
            except Exception:
                pass
            time.sleep(1.0)
    except Exception as e:
        log_step(f"⚠️ Otomatik giriş adımı notu: {e}")
    return False


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


def is_past_unscored_match(m_date: str, h_sets: int, a_sets: int, forfeit: bool) -> bool:
    """
    Volleybox geçmiş maçların skorsuz eklenmesine izin vermez.
    Maç tarihi geçmişte ve herhangi bir skor/hükmen bilgisi yoksa True döner.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    return m_date < today_str and h_sets == 0 and a_sets == 0 and not forfeit


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
            is_forfeit = is_forfeit_match(m)
            if is_past_unscored_match(m_date, h_sets, a_sets, is_forfeit):
                # Volleybox geçmişte oynanan maçların skorsuz girilmesine izin vermez
                continue

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
                "forfeit": is_forfeit,
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
            is_forfeit = is_forfeit_match(m)
            if is_past_unscored_match(d_str, h_sets, a_sets, is_forfeit):
                # Volleybox geçmişte oynanan maçların skorsuz girilmesine izin vermez
                continue

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
                "forfeit": is_forfeit,
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


def resolve_team_for_match(
    tvf_team: str,
    team_alias_map: Dict[str, set],
    mappings_data: Optional[Dict[str, Any]] = None,
    select_options: Optional[List[Dict[str, str]]] = None,
    page_teams: Optional[Dict[str, str]] = None,
    age_group: str = "",
) -> Optional[Dict[str, str]]:
    """
    TVF takımını Volleybox takım ID'si ve adına dönüştürür.
    Sırasıyla:
      1. Sayfadaki <select> seçenekleri (varsa)
      2. Sayfadaki maç kartlarında bulunan takımlar (varsa)
      3. mappings_data['mappings'] listesindeki eşleştirmeler
    Dönüş formatı: {'id': '<id>', 'label': '<name>'}
    """
    clean_tvf = (tvf_team or "").strip()
    if not clean_tvf:
        return None
    synonyms = team_alias_map.get(clean_tvf.lower(), set())

    # 1. <select> seçenekleri
    if select_options:
        opt = match_option_for_team(clean_tvf, select_options, team_alias_map)
        if opt:
            return {"id": str(opt["value"]), "label": str(opt["label"])}

    # 2. Sayfadaki maç kartlarından çıkarılan takımlar
    if page_teams:
        best_tid = None
        best_tname = None
        best_sc = 0
        for tid, tname in page_teams.items():
            sc = team_match_score(clean_tvf, tname, synonyms)
            if sc >= 70 and sc > best_sc:
                best_sc = sc
                best_tid = tid
                best_tname = tname
        if best_tid and best_tname:
            return {"id": str(best_tid), "label": str(best_tname)}

    # 3. mappings_data['mappings'] listesi
    if mappings_data:
        is_u18 = "genç" in age_group.lower() or "u18" in age_group.lower()
        is_u16 = "yıldız" in age_group.lower() or "u16" in age_group.lower()
        best_opt = None
        best_score = 0

        for m in mappings_data.get("mappings", []):
            matched_as = (m.get("matched_as") or "").strip()
            aliases = m.get("aliases") or []
            url = m.get("volleybox_url") or ""
            mat = re.search(r"[-/]t(\d+)", url)
            if not mat:
                continue
            tid = mat.group(1)

            # Doğrudan takma ad / isim eşleşmesi
            if clean_tvf.lower() == matched_as.lower() or any(clean_tvf.lower() == a.lower().strip() for a in aliases):
                sc = 100
                if is_u18 and "u18" in matched_as.lower():
                    sc += 10
                elif is_u16 and "u16" in matched_as.lower():
                    sc += 10
            else:
                sc = team_match_score(clean_tvf, matched_as, synonyms)
                for a in aliases:
                    a_sc = team_match_score(clean_tvf, a, synonyms)
                    if a_sc > sc:
                        sc = a_sc
                if is_u18 and "u18" in matched_as.lower() and sc >= 70:
                    sc += 5
                elif is_u16 and "u16" in matched_as.lower() and sc >= 70:
                    sc += 5

            if sc >= 70 and sc > best_score:
                best_score = sc
                best_opt = {"id": tid, "label": matched_as, "score": sc}

        if best_opt:
            return {"id": best_opt["id"], "label": best_opt["label"]}

    return None


def match_option_for_round(group_name: str, options: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """
    '- Tur seçin -' menüsündeki seçeneklerden maça uygun turu/grubu seçer.
    Öncelikli olarak sade 'Group A', 'Group 1' gibi temiz eşleşmeleri seçer;
    asla 'CEV - Group ...' seçeneklerine sapmaz.
    """
    valid_opts = [
        o for o in options
        if str(o.get("value") or "").strip() not in ("", "0") and not str(o.get("label") or "").strip().startswith("-")
    ]
    if not valid_opts:
        return None
    if len(valid_opts) == 1:
        return valid_opts[0]

    # Yerel ve altyapı liglerinde CEV seçeneklerini tamamen hariç tut
    non_cev_opts = [o for o in valid_opts if not re.search(r"\bcev\b", str(o.get("label") or ""), re.I)]
    opts = non_cev_opts if non_cev_opts else valid_opts

    g_clean = (group_name or "").lower().strip()
    if not g_clean:
        for opt in opts:
            lbl_l = str(opt.get("label") or "").lower().strip()
            if lbl_l in ("regular season", "normal sezon", "main tournament"):
                return opt
        return opts[0]

    is_semi = bool(re.search(r"\b(?:yar[ıi]\s*final|semi[\s\-]final)\b", g_clean, re.I))
    is_final = bool(re.search(r"\bfinal\b", g_clean, re.I)) and not is_semi

    m_num = re.search(r"\b(\d+)\s*\.?\s*grup\b|\bgrup\s+(\d+)\b|^(?:grup\s*)?(\d+)$", g_clean, re.I)
    num_token = (m_num.group(1) or m_num.group(2) or m_num.group(3)).strip() if m_num else None

    m_letter = re.search(r"\b([a-z])\s*(?:grubu|grb\.?|grup)\b|\bgrup\s+([a-z])\b|^(?:grup\s*)?([a-z])$", g_clean, re.I)
    letter_token = (m_letter.group(1) or m_letter.group(2) or m_letter.group(3)).strip().upper() if m_letter else None

    # 1. Yarı Final durumları
    if is_semi:
        target = letter_token or num_token
        if target:
            for opt in opts:
                lbl = str(opt.get("label") or "").strip().lower()
                if lbl in (f"semi final - group {target}".lower(), f"semi-final - group {target}".lower(), f"semi final group {target}".lower()):
                    return opt
            for opt in opts:
                lbl = str(opt.get("label") or "").strip().lower()
                if "semi" in lbl and f"group {target}".lower() in lbl:
                    return opt
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if lbl in ("semi final", "semi finals", "semi-final"):
                return opt
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if "semi" in lbl:
                return opt

    # 2. Final durumları
    if is_final:
        target = letter_token or num_token
        if target:
            for opt in opts:
                lbl = str(opt.get("label") or "").strip().lower()
                if lbl in (f"final - group {target}".lower(), f"final group {target}".lower()):
                    return opt
            for opt in opts:
                lbl = str(opt.get("label") or "").strip().lower()
                if "final" in lbl and f"group {target}".lower() in lbl:
                    return opt
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if lbl in ("final round", "final", "finals"):
                return opt
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if "final" in lbl and "group" not in lbl:
                return opt
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if "final" in lbl:
                return opt

    # 3. Harf Grubu (örn: 'A Grubu', 'B Grb.', 'C Grubu') -> Kesin 'Group A', 'Group B'
    if letter_token:
        expected_vb = f"group {letter_token}".lower()
        expected_tr = f"{letter_token} grubu".lower()
        # a) Birebir eşleşme ('Group A' veya 'A Grubu')
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if lbl in (expected_vb, expected_tr):
                return opt
        # b) Başında 'Group <letter>' geçen
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if re.match(rf"^group\s*{re.escape(letter_token)}\b", lbl, re.I):
                return opt
        # c) Kelime olarak 'Group <letter>' geçen
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if re.search(rf"\bgroup\s*{re.escape(letter_token)}\b", lbl, re.I):
                return opt

    # 4. Sayı Grubu (örn: '1. Grup', '2.Grup', '10. Grup') -> Kesin 'Group 1', 'Group 2'
    if num_token:
        expected_vb = f"group {num_token}".lower()
        expected_tr = f"{num_token}. grup".lower()
        # a) Birebir eşleşme ('Group 1' veya '1. Grup')
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if lbl in (expected_vb, expected_tr):
                return opt
        # b) Başında 'Group <num>' geçen
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if re.match(rf"^group\s*{re.escape(num_token)}\b", lbl, re.I):
                return opt
        # c) Kelime olarak 'Group <num>' geçen
        for opt in opts:
            lbl = str(opt.get("label") or "").strip().lower()
            if re.search(rf"\bgroup\s*{re.escape(num_token)}\b", lbl, re.I):
                return opt

    # 5. Regular Season / Normal Sezon veya Tek Grup
    for opt in opts:
        lbl = str(opt.get("label") or "").strip().lower()
        if lbl in ("regular season", "normal sezon", "main tournament"):
            return opt
    for opt in opts:
        lbl = str(opt.get("label") or "").strip().lower()
        if "regular season" in lbl or "normal sezon" in lbl:
            return opt

    return opts[0]


def match_option_for_arena(tvf_hall: str, options: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
    """
    '- Saha seçin -' menüsündeki seçeneklerden salonu eşleştirir.
    Volleybox formunda arena_id zorunlu olduğundan, salon birebir bulunamazsa
    turnuva/şehir/takım sahalarından ilk geçerli olanı seçer.
    """
    valid_opts = [
        o for o in options
        if str(o.get("value") or "").strip() not in ("", "0") and not str(o.get("label") or "").strip().startswith("-")
    ]
    if not valid_opts:
        return None

    if tvf_hall:
        for opt in valid_opts:
            if halls_match(tvf_hall, opt["label"]):
                return opt

    return valid_opts[0]


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

    log_step("\n🔐 Volleybox oturum açma işlemi başlatılıyor...")

    is_headless = False
    if sys.platform != "win32" and not os.environ.get("DISPLAY"):
        is_headless = True
        log_step("ℹ️ Sunucu ortamında tarayıcı arka planda (headless) başlatıldı.")
    else:
        log_step("👉 Açılan tarayıcıda Volleybox hesabınıza giriş yapın. Giriş algılandığında oturum otomatik kaydedilecektir.\n")

    chromium_args = [
        "--disable-blink-features=AutomationControlled",
    ]
    if sys.platform != "win32":
        chromium_args.extend([
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ])

    BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(BROWSER_PROFILE_DIR),
            headless=is_headless,
            viewport={"width": 1280, "height": 860},
            locale="tr-TR",
            timezone_id="Europe/Istanbul",
            args=chromium_args,
        )
        apply_saved_auth(context)
        page = context.pages[0] if context.pages else context.new_page()
        page.goto("https://women.volleybox.net/tr/login", wait_until="domcontentloaded")
        time.sleep(2.0)
        save_live_screenshot(page)

        # Önce ortam değişkenlerinden otomatik giriş dene
        logged_in = try_env_credentials_login(page, context)

        if not logged_in:
            for i in range(180):  # 3 dakika bekle
                try:
                    if i % 3 == 0:
                        save_live_screenshot(page)
                    uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
                    if uid and uid > 0:
                        logged_in = True
                        save_live_screenshot(page)
                        log_step(f"✅ Giriş başarılı! (Volleybox userId: {uid})")
                        break
                except Exception:
                    pass
                time.sleep(1.0)

        if logged_in:
            context.storage_state(path=str(AUTH_STATE_FILE))
            log_step(f"💾 Oturum kaydedildi: {AUTH_STATE_FILE}")
        else:
            log_step("⚠️ Giriş zaman aşımına uğradı veya tamamlanmadı.")

        context.close()



def fill_and_submit_match_on_page(
    page,
    match_item: Dict[str, Any],
    team_alias_map: Dict[str, set],
    mappings_data: Optional[Dict[str, Any]] = None,
    inspect_only: bool = False,
) -> Tuple[bool, str]:
    """
    Açık olan Volleybox turnuva /matches sayfasında '+ Ekle' formunu açar,
    görseldeki alanları (autocompleter veya select) doldurur ve '+ Ekle' (#submit_button_hall) butonuna basar.
    """
    if is_past_unscored_match(
        match_item["date"],
        match_item.get("home_sets", 0),
        match_item.get("away_sets", 0),
        match_item.get("forfeit", False),
    ):
        return False, f"Volleybox geçmiş maçların skorsuz eklenmesine izin vermez ({match_item['date']})"

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

    # 2. Form içindeki alanları, <select> menülerini ve sayfadaki mevcut maç kartlarını tara
    form_data = page.evaluate(
        """() => {
            const root = document.querySelector('#add_match_container, #add_match_form') || document;
            const selects = Array.from(root.querySelectorAll('select')).filter(s => s.offsetParent !== null);
            const selectMeta = selects.map((s, idx) => ({
                idx,
                name: s.getAttribute('name') || '',
                id: s.getAttribute('id') || '',
                firstLabel: s.options.length > 0 ? s.options[0].text.trim() : '',
                options: Array.from(s.options).map(o => ({ value: o.value, label: o.text.trim() }))
            }));

            const pageTeams = {};
            const pageRounds = {};
            const pageArenas = {};
            document.querySelectorAll('[data-hid_host_id]').forEach(el => {
                const hid = el.getAttribute('data-hid_host_id');
                const hname = el.getAttribute('data-hid_host_name');
                const gid = el.getAttribute('data-hid_guest_id');
                const gname = el.getAttribute('data-hid_guest_name');
                const rid = el.getAttribute('data-hid_round_id');
                const rname = el.getAttribute('data-hid_round_name');
                const aid = el.getAttribute('data-hid_arena_id');
                const aname = el.getAttribute('data-hid_arena_name');

                if (hid && hname) pageTeams[hid] = hname;
                if (gid && gname) pageTeams[gid] = gname;
                if (rid && rname) pageRounds[rid] = rname;
                if (aid && aname) pageArenas[aid] = aname;
            });

            const tournId = document.querySelector('input[name="tournament_id"]')?.value || '';

            return {
                selectMeta,
                pageTeams,
                pageRounds,
                pageArenas,
                tournId,
            };
        }"""
    )

    # 3. Tur ve saha listesini AJAX ile sorgula (sayfada hiç maç yoksa bile turları getirir)
    ajax_rounds = []
    ajax_arenas = []
    if form_data.get("tournId"):
        try:
            ajax_rounds = page.evaluate(
                """async (tid) => {
                    if (!window.jQuery || !tid) return [];
                    try {
                        const res = await window.jQuery.ajax({
                            type: 'POST',
                            url: (window.basedir || '/') + 'ajax/get_match_rounds_ajax',
                            data: { tournament_id: tid, term: '' },
                            dataType: 'json'
                        });
                        return Array.isArray(res) ? res : [];
                    } catch (e) {
                        return [];
                    }
                }""",
                form_data["tournId"],
            )
        except Exception:
            pass

    # 4. Formdaki <select> menülerini sınıflandır
    host_select = None
    guest_select = None
    host_sets_select = None
    guest_sets_select = None
    round_select = None
    arena_select = None
    set_select_candidates = []

    for s in form_data.get("selectMeta", []):
        fl = s["firstLabel"].lower()
        nm = s["name"].lower()
        sid = s["id"].lower()
        if "host_sets" in nm or "matchhostsetautocompleter" in sid:
            host_sets_select = s
        elif "guest_sets" in nm or "matchguestsetautocompleter" in sid:
            guest_sets_select = s
        elif "ev sahibi" in fl or "host" in fl or "host_id" in nm or "host_team" in nm or "team1" in nm:
            host_select = s
        elif "deplasman" in fl or "guest" in fl or "away" in fl or "guest_id" in nm or "guest_team" in nm or "team2" in nm:
            guest_select = s
        elif "tur seç" in fl or "round" in fl or "round" in nm or "stage" in nm:
            round_select = s
        elif "saha seç" in fl or "arena" in fl or "hall" in fl or "arena" in nm or "hall" in nm:
            arena_select = s
        elif any(o["label"] in ("0", "1", "2", "3") for o in s["options"]) and len(s["options"]) <= 7:
            set_select_candidates.append(s)

    if not host_sets_select and len(set_select_candidates) >= 1:
        host_sets_select = set_select_candidates[0]
    if not guest_sets_select and len(set_select_candidates) >= 2:
        guest_sets_select = set_select_candidates[1]

    # 5. Ev sahibi ve deplasman takımlarını eşleştir (select, DOM veya mappings_data)
    age_cat = match_item.get("category", "") or match_item.get("age_group", "")
    host_opt = resolve_team_for_match(
        match_item["home_team"],
        team_alias_map,
        mappings_data=mappings_data,
        select_options=host_select["options"] if host_select else None,
        page_teams=form_data.get("pageTeams"),
        age_group=age_cat,
    )
    if not host_opt:
        return (
            False,
            f"Ev sahibi takım Volleybox eşleştirmelerinde bulunamadı: '{match_item['home_team']}'",
        )

    guest_opt = resolve_team_for_match(
        match_item["away_team"],
        team_alias_map,
        mappings_data=mappings_data,
        select_options=guest_select["options"] if guest_select else None,
        page_teams=form_data.get("pageTeams"),
        age_group=age_cat,
    )
    if not guest_opt:
        return (
            False,
            f"Deplasman takımı Volleybox eşleştirmelerinde bulunamadı: '{match_item['away_team']}'",
        )

    # 6. Tur ve Saha eşleştirmesi
    raw_round_options = []
    if round_select and round_select.get("options"):
        raw_round_options.extend(round_select["options"])
    for rid, rname in form_data.get("pageRounds", {}).items():
        raw_round_options.append({"value": str(rid), "label": str(rname)})
    for r in ajax_rounds:
        r_id = str(r.get("id") or r.get("value") or "")
        r_lbl = str(r.get("label") or r.get("name") or r.get("value") or "")
        if r_id and r_lbl:
            raw_round_options.append({"value": r_id, "label": r_lbl})

    seen_round_vals = set()
    round_options = []
    for ro in raw_round_options:
        rv = str(ro.get("value") or "").strip()
        if rv and rv not in seen_round_vals:
            seen_round_vals.add(rv)
            round_options.append(ro)

    round_opt = match_option_for_round(match_item.get("group", ""), round_options)

    # Saha sorgulamasını çalıştır (salon adı, ilk kelimeler, şehir ve ev sahibi takıma göre)
    ajax_arenas = []
    try:
        ajax_arenas = page.evaluate(
            """async (p) => {
                const candidates = [];
                if (!window.jQuery) return candidates;

                // 1. Ev sahibi takımın bu sezondaki kayıtlı salonu
                if (p.hostId) {
                    try {
                        const resp = await window.jQuery.ajax({
                            type: 'POST',
                            url: (window.basedir || '/') + 'ajax/get_arena_team_in_season',
                            data: { team_id: p.hostId, season_id: '127' },
                            dataType: 'xml'
                        });
                        const code = window.jQuery('response code', resp).text();
                        if (code === '1') {
                            const aid = window.jQuery('response arena_id', resp).text();
                            const aname = window.jQuery('response arena_name', resp).text();
                            if (aid && aname) {
                                candidates.push({ id: aid, label: aname, value: aid, source: 'host_team' });
                            }
                        }
                    } catch(e) {}
                }

                // 2. get_tags_ajax üzerinden salon ve şehir terimlerini ara
                const terms = [];
                if (p.hall) {
                    terms.push(p.hall);
                    const cleanHall = p.hall.replace(/^Kdz\\.?\\s*/i, '').replace(/\\bSs\\b/i, '').trim();
                    if (cleanHall && !terms.includes(cleanHall)) terms.push(cleanHall);
                    const words = p.hall.split(/[\\s\\.]+/).filter(w => w.length >= 3);
                    for (const w of words) {
                        if (!terms.includes(w)) terms.push(w);
                    }
                }
                if (p.city && !terms.includes(p.city)) {
                    terms.push(p.city);
                }

                for (const t of terms) {
                    try {
                        let res = await window.jQuery.ajax({
                            type: 'POST',
                            url: (window.basedir || '/') + 'ajax/get_tags_ajax',
                            data: { searchedItems: 'arenas', limitSubitems: 6, continent: 0, ground: 'I', query: t },
                            dataType: 'json'
                        });
                        if (Array.isArray(res)) {
                            for (const item of res) {
                                const id = String(item.id || item.value || '');
                                const label = String(item.search || item.label || item.name || '');
                                if (id && id !== '-2' && label) {
                                    candidates.push({ id, label, value: id, source: 'tags_ajax' });
                                }
                            }
                        }
                    } catch(e) {}
                }

                if (candidates.length === 0) {
                    try {
                        let res = await window.jQuery.ajax({
                            type: 'POST',
                            url: (window.basedir || '/') + 'ajax/get_tags_ajax',
                            data: { searchedItems: 'arenas', limitSubitems: 6, continent: 0, ground: 'I', query: 'Spor Salonu' },
                            dataType: 'json'
                        });
                        if (Array.isArray(res)) {
                            for (const item of res) {
                                const id = String(item.id || item.value || '');
                                const label = String(item.search || item.label || item.name || '');
                                if (id && id !== '-2' && label) {
                                    candidates.push({ id, label, value: id, source: 'fallback_ajax' });
                                }
                            }
                        }
                    } catch(e) {}
                }

                return candidates;
            }""",
            {
                "hall": match_item.get("hall", ""),
                "city": match_item.get("city", ""),
                "hostId": host_opt.get("id"),
            },
        )
    except Exception as e:
        log_step(f"   ⚠️ Saha sorgulama notu: {e}")

    arena_options = []
    if arena_select and arena_select.get("options"):
        arena_options.extend(arena_select["options"])
    for aid, aname in form_data.get("pageArenas", {}).items():
        arena_options.append({"value": str(aid), "label": str(aname)})
    for a in ajax_arenas:
        a_id = str(a.get("id") or a.get("value") or "")
        a_lbl = str(a.get("label") or a.get("name") or a.get("value") or "")
        if a_id and a_lbl:
            arena_options.append({"value": a_id, "label": a_lbl})

    arena_opt = match_option_for_arena(match_item.get("hall", ""), arena_options)

    # 6. Form alanlarını tarayıcıda doldur
    payload = {
        "hostId": host_opt["id"],
        "hostName": host_opt["label"],
        "guestId": guest_opt["id"],
        "guestName": guest_opt["label"],
        "hostSelectIdx": host_select["idx"] if host_select else None,
        "guestSelectIdx": guest_select["idx"] if guest_select else None,
        "hostSetsIdx": host_sets_select["idx"] if host_sets_select else None,
        "hostSets": str(match_item["home_sets"]),
        "guestSetsIdx": guest_sets_select["idx"] if guest_sets_select else None,
        "guestSets": str(match_item["away_sets"]),
        "roundId": round_opt["value"] if round_opt else None,
        "roundName": round_opt["label"] if round_opt else None,
        "roundSelectIdx": round_select["idx"] if (round_select and round_opt) else None,
        "arenaId": arena_opt["value"] if arena_opt else None,
        "arenaName": arena_opt["label"] if arena_opt else None,
        "arenaSelectIdx": arena_select["idx"] if (arena_select and arena_opt) else None,
        "date": match_item["date"],
        "time": match_item["time"] or "",
        "forfeit": bool(match_item["forfeit"]),
        "setScores": match_item.get("set_scores") or [],
    }

    page.evaluate(
        """(p) => {
            const root = document.querySelector('#add_match_container, #add_match_form') || document;

            function setVal(el, val) {
                if (!el || val === undefined || val === null) return;
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                if (window.jQuery) {
                    window.jQuery(el).val(val).trigger('input').trigger('change');
                }
            }

            // 1. Host & Guest Autocompleter inputs (Volleybox standardı)
            const hostIdInp = root.querySelector('input[name="host_id"]');
            const hostNameInp = root.querySelector('#matchHostAutocompleter');
            if (hostIdInp) setVal(hostIdInp, p.hostId);
            if (hostNameInp) setVal(hostNameInp, p.hostName);

            const guestIdInp = root.querySelector('input[name="guest_id"]');
            const guestNameInp = root.querySelector('#matchGuestAutocompleter');
            if (guestIdInp) setVal(guestIdInp, p.guestId);
            if (guestNameInp) setVal(guestNameInp, p.guestName);

            // 2. Selects (Menü modu veya set sayıları)
            const selects = Array.from(root.querySelectorAll('select')).filter(s => s.offsetParent !== null);
            if (p.hostSelectIdx !== null && selects[p.hostSelectIdx]) setVal(selects[p.hostSelectIdx], p.hostId);
            if (p.guestSelectIdx !== null && selects[p.guestSelectIdx]) setVal(selects[p.guestSelectIdx], p.guestId);

            const hostSetsEl = root.querySelector('select[name="host_sets"], #matchHostSetAutocompleter')
                || (p.hostSetsIdx !== null && selects[p.hostSetsIdx] ? selects[p.hostSetsIdx] : null);
            if (hostSetsEl) setVal(hostSetsEl, p.hostSets);

            const guestSetsEl = root.querySelector('select[name="guest_sets"], #matchGuestSetAutocompleter')
                || (p.guestSetsIdx !== null && selects[p.guestSetsIdx] ? selects[p.guestSetsIdx] : null);
            if (guestSetsEl) setVal(guestSetsEl, p.guestSets);

            // 3. Date & Time
            const dateInp = root.querySelector('input#date, input[name="date"]');
            if (dateInp) setVal(dateInp, p.date);

            const timeInp = root.querySelector('input#match_hour, input[name="hour_time"], input[name="time"]');
            if (timeInp && p.time) setVal(timeInp, p.time);

            // 4. Round
            const roundIdInp = root.querySelector('input[name="round_id"]');
            const roundNameInp = root.querySelector('#matchRoundAutocompleter');
            if (roundIdInp && p.roundId) setVal(roundIdInp, p.roundId);
            if (roundNameInp && p.roundName) setVal(roundNameInp, p.roundName);
            if (p.roundSelectIdx !== null && selects[p.roundSelectIdx] && p.roundId) setVal(selects[p.roundSelectIdx], p.roundId);

            // 5. Arena
            const arenaIdInp = root.querySelector('input[name="arena_id"]');
            const arenaNameInp = root.querySelector('#matchArenaAutocompleter');
            if (arenaIdInp && p.arenaId) setVal(arenaIdInp, p.arenaId);
            if (arenaNameInp && p.arenaName) setVal(arenaNameInp, p.arenaName);
            if (p.arenaSelectIdx !== null && selects[p.arenaSelectIdx] && p.arenaId) setVal(selects[p.arenaSelectIdx], p.arenaId);

            // 6. Walkover / Hükmen
            const walkover = root.querySelector('input#walkover, input[name="walkover"]');
            if (walkover && walkover.checked !== p.forfeit) {
                walkover.click();
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
                        hInp.dispatchEvent(new Event('input', { bubbles: true }));
                        hInp.dispatchEvent(new Event('change', { bubbles: true }));
                        gInp.dispatchEvent(new Event('input', { bubbles: true }));
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

    log_step(f"   📝 Form dolduruldu -> {summary}")
    save_live_screenshot(page)

    if inspect_only:
        log_step(f"   👀 [İNCELEME MODU] Form dolduruldu: {summary}")
        input("   👉 Tarayıcıda formu kontrol edin. Devam etmek için Enter'a basın...")
        return True, summary

    # 7. '+ Ekle' (#submit_button_hall) butonuna tıkla
    last_response_data = {}
    def on_response(response):
        if "add_match" in response.url:
            try:
                last_response_data["url"] = response.url
                last_response_data["status"] = response.status
                last_response_data["text"] = response.text()
            except Exception:
                pass

    page.on("response", on_response)

    last_request_data = {}
    def on_request(request):
        if "add_match" in request.url:
            try:
                last_request_data["url"] = request.url
                last_request_data["post_data"] = request.post_data
            except Exception:
                pass

    page.on("request", on_request)

    submitted = False
    try:
        btn_loc = page.locator("#submit_button_hall, button[type='submit']")
        if btn_loc.count() > 0 and btn_loc.first.is_visible():
            btn_loc.first.click()
            submitted = True
    except Exception:
        pass

    if not submitted:
        submitted = page.evaluate(
            """() => {
                const root = document.querySelector('#add_match_container, #add_match_form') || document;
                const btn = root.querySelector('#submit_button_hall, button[type="submit"], input[type="submit"]')
                    || Array.from(root.querySelectorAll('button, a')).find(el => {
                        const t = (el.textContent || '').trim();
                        return t === 'Ekle' || t === '+ Ekle' || t.includes('Ekle') || t.includes('Add');
                    });
                if (btn) {
                    btn.click();
                    return true;
                }
                const form = document.querySelector('#add_match_form');
                if (form) {
                    if (window.jQuery) window.jQuery(form).submit();
                    else form.submit();
                    return true;
                }
                return false;
            }"""
        )

    if not submitted:
        return False, "Form içindeki '+ Ekle' (#submit_button_hall) gönderme butonu bulunamadı"

    time.sleep(2.5)
    save_live_screenshot(page)

    if last_request_data:
        log_step(f"   📤 Sunucuya gönderilen POST: {last_request_data.get('post_data')}")
    if last_response_data:
        log_step(f"   📥 Sunucu yanıtı ({last_response_data.get('status')}): {last_response_data.get('text')}")

    # Hata mesajı var mı detaylı kontrol et
    errors_detail = page.evaluate(
        """() => {
            const list = [];
            const form = document.querySelector('#add_match_form');
            if (form && window.jQuery) {
                const v = window.jQuery(form).data('validator');
                if (v && v.errorList) {
                    v.errorList.forEach(e => {
                        list.push({
                            text: e.message,
                            forAttr: e.element ? (e.element.name || e.element.id) : '',
                            id: 'validator_errorList',
                            prev: '',
                            parent: ''
                        });
                    });
                }
            }
            document.querySelectorAll('.error, label.error, span.error, p.errors, .formError, .error-message, .ui-dialog-content').forEach(el => {
                if (el.offsetParent !== null && (el.textContent || '').trim().length > 0) {
                    list.push({
                        text: el.textContent.trim(),
                        forAttr: el.getAttribute('for') || '',
                        id: el.id || '',
                        prev: el.previousElementSibling ? (el.previousElementSibling.name || el.previousElementSibling.id) : '',
                        parent: el.parentElement ? (el.parentElement.className || el.parentElement.id) : ''
                    });
                }
            });
            return list;
        }"""
    )
    if errors_detail:
        log_step(f"   ⚠️ Hata detayları: {errors_detail}")
        err_msg = ", ".join([f"{e.get('forAttr') or e.get('prev') or e.get('parent')}: {e['text']}" for e in errors_detail])
        return False, f"Volleybox form uyarısı: {err_msg}"

    if last_response_data and "<match_id>" in last_response_data.get("text", ""):
        m_id = re.search(r"<match_id>(\d+)</match_id>", last_response_data["text"])
        if m_id:
            summary += f" [VB ID: {m_id.group(1)}]"

    return True, summary


def main():
    parser = argparse.ArgumentParser(description="Sitedeki eksik maçları Volleybox'a otomatik ekleyen Playwright botu")
    parser.add_argument("--city", default=None, help="Sadece belirli bir ili/ligi işle (örn: zonguldak, afyon, kocaeli, istanbul)")
    parser.add_argument("--dry-run", action="store_true", help="Tarayıcı açmadan eklenecek eksik maçları listele")
    parser.add_argument("--json-preview", action="store_true", help="Eksik maçları JSON olarak çıktı ver")
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
        log_step(f"❌ Hata: {MAPPINGS_FILE} bulunamadı!")
        sys.exit(1)

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)

    team_alias_map = build_team_alias_map(mappings_data)
    tourn_lookup = build_tournament_lookup(mappings_data)
    by_tournament = collect_unsynced_matches(tourn_lookup, city_filter=args.city, include_pro=args.include_pro)

    total_candidates = sum(len(v) for v in by_tournament.values())

    if args.json_preview:
        tournaments_out = []
        for t_url, m_list in by_tournament.items():
            slug = t_url.rstrip("/").split("/")[-1]
            tournaments_out.append({
                "tournament_url": t_url,
                "tournament_slug": slug,
                "city": m_list[0]["city"],
                "city_slug": m_list[0]["city_slug"],
                "category": m_list[0]["category"],
                "missing_count": len(m_list),
                "matches": [
                    {
                        "id": m["id"],
                        "date": m["date"],
                        "time": m["time"] or "--:--",
                        "home_team": m["home_team"],
                        "away_team": m["away_team"],
                        "score": f"{m['home_sets']}-{m['away_sets']}",
                        "group": m["group"] or "-",
                        "hall": m["hall"] or "-",
                        "forfeit": bool(m["forfeit"]),
                    }
                    for m in m_list
                ],
            })
        print(
            json.dumps(
                {
                    "total_tournaments": len(tournaments_out),
                    "total_missing": total_candidates,
                    "has_saved_auth": AUTH_STATE_FILE.exists(),
                    "tournaments": tournaments_out,
                },
                ensure_ascii=False,
            ),
            flush=True,
        )
        return

    log_step("\n" + "=" * 78)
    log_step("🤖 VOLLEYBOX OTOMATİK MAÇ EKLEME BOTU (push_volleybox_matches.py)")
    log_step("=" * 78)

    if total_candidates == 0:
        log_step("✅ Harika! Seçilen kapsamda Volleybox'ta eksik olan hiçbir maç bulunmuyor.")
        return

    log_step(f"📋 Toplam {len(by_tournament)} turnuvada {total_candidates} adet Volleybox'ta olmayan maç tespit edildi.\n")

    for t_url, m_list in by_tournament.items():
        slug = t_url.rstrip("/").split("/")[-1]
        city_label = m_list[0]["city"]
        cat_label = m_list[0]["category"]
        log_step(f"🏆 {city_label} — {cat_label} ({slug}) [{len(m_list)} eksik maç]:")
        for idx, m in enumerate(m_list[:10], 1):
            sc = f"{m['home_sets']}-{m['away_sets']}" if (m["home_sets"] or m["away_sets"]) else "0-0"
            hukmen = " [HÜKMEN]" if m["forfeit"] else ""
            log_step(
                f"   {idx:>2}. {m['date']} {m['time'] or '--:--'} | "
                f"{m['home_team']} ({sc}) {m['away_team']} | "
                f"Tur: {m['group'] or '-'} | Saha: {m['hall'] or '-'}{hukmen}"
            )
        if len(m_list) > 10:
            log_step(f"   ... ve {len(m_list) - 10} maç daha.")
        log_step("")

    if args.dry_run:
        log_step("ℹ️ '--dry-run' (önizleme) modu aktif olduğu için Volleybox'a gönderim yapılmadı.")
        log_step("👉 Gönderimi başlatmak için '--dry-run' parametresi olmadan çalıştırabilirsiniz.")
        return

    ensure_playwright()
    from playwright.sync_api import sync_playwright

    chromium_args = [
        "--disable-blink-features=AutomationControlled",
    ]
    if sys.platform != "win32":
        chromium_args.extend([
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ])

    is_headless = args.headless
    if sys.platform != "win32" and not os.environ.get("DISPLAY"):
        is_headless = True

    BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    added_total = 0
    touched_cities = set()

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(BROWSER_PROFILE_DIR),
            headless=is_headless and not args.inspect_form,
            viewport={"width": 1366, "height": 900},
            locale="tr-TR",
            timezone_id="Europe/Istanbul",
            args=chromium_args,
        )
        apply_saved_auth(context)
        page = context.pages[0] if context.pages else context.new_page()

        for t_url, m_list in by_tournament.items():
            if added_total >= args.limit:
                break

            # Mükerrer eklemeyi önlemek için turnuvadaki canlı maçları son kez kontrol et
            live_vb_matches = fetch_volleybox_tournament_matches(t_url)
            used_vb_ids: set = set()

            matches_url = to_tr_matches_url(t_url)
            log_step(f"\n🌐 Turnuva sayfası açılıyor: {matches_url}")
            page.goto(matches_url, wait_until="domcontentloaded")
            time.sleep(2.0)
            save_live_screenshot(page)

            # Giriş kontrolü
            uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
            if not uid or uid <= 0:
                log_step("🔐 Volleybox oturumu açık değil. Giriş sayfasına yönlendiriliyor...")
                page.goto("https://women.volleybox.net/tr/login", wait_until="domcontentloaded")
                time.sleep(2.0)
                save_live_screenshot(page)

                logged_in = try_env_credentials_login(page, context)
                if not logged_in:
                    for i in range(120):
                        try:
                            if i % 3 == 0:
                                save_live_screenshot(page)
                            uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
                            if uid and uid > 0:
                                context.storage_state(path=str(AUTH_STATE_FILE))
                                log_step(f"✅ Giriş algılandı (userId={uid}), turnuva sayfasına dönülüyor...")
                                break
                        except Exception:
                            pass
                        time.sleep(1.0)
                if not uid or uid <= 0:
                    uid = page.evaluate("() => (typeof window.userId !== 'undefined' ? Number(window.userId) : 0)")
                if not uid or uid <= 0:
                    log_step("❌ Volleybox girişi yapılmadığı için işlem durduruldu. Render Dashboard üzerinden VOLLEYBOX_USERNAME ve VOLLEYBOX_PASSWORD veya VOLLEYBOX_COOKIE tanımlayabilirsiniz.")
                    context.close()
                    return
                page.goto(matches_url, wait_until="domcontentloaded")
                time.sleep(2.0)
                save_live_screenshot(page)

            for m_item in m_list:
                if added_total >= args.limit:
                    log_step(f"⏹️ Maksimum maç ekleme sınırına ({args.limit}) ulaşıldı.")
                    break

                log_step(f"🔎 Kontrol ediliyor: {m_item['home_team']} vs {m_item['away_team']} ({m_item['date']} {m_item['time'] or '--:--'})")

                # Canlı listede zaten varsa atla
                already_on_vb = match_tvf_with_vb(m_item["raw_match"], live_vb_matches, team_alias_map, used_vb_ids)
                if already_on_vb:
                    log_step(f"   ⏭️ Zaten Volleybox'ta mevcut, atlanıyor: {m_item['home_team']} vs {m_item['away_team']} ({already_on_vb['url']})")
                    touched_cities.add(m_item["city_slug"])
                    continue

                ok, msg = fill_and_submit_match_on_page(
                    page,
                    m_item,
                    team_alias_map,
                    mappings_data=mappings_data,
                    inspect_only=args.inspect_form,
                )
                if ok:
                    added_total += 1
                    touched_cities.add(m_item["city_slug"])
                    log_step(f"   ✅ [{added_total}/{args.limit}] Eklendi: {msg}")
                    wait_sec = args.delay + random.uniform(0.5, 3.0)
                    log_step(f"   ⏳ Hız sınırı koruması: {wait_sec:.1f} sn bekleniyor...")
                    time.sleep(wait_sec)
                else:
                    log_step(f"   ⚠️ Atlandı ({m_item['home_team']} vs {m_item['away_team']}): {msg}")

        context.close()

    # Eklenen maçların Volleybox linklerini JSON dosyalarına kaydetmek için senkronizasyonu çalıştır
    if touched_cities and not args.inspect_form:
        log_step("\n🔄 Yeni eklenen maçların Volleybox bağlantıları sitemizle senkronize ediliyor...")
        for c_slug in sorted(touched_cities):
            subprocess.call([sys.executable, str(BASE_DIR / "scripts" / "sync_volleybox_matches.py"), "--city", c_slug])

    log_step(f"\n🎉 İşlem tamamlandı! Toplam {added_total} yeni maç Volleybox'a eklendi.")



if __name__ == "__main__":
    main()
