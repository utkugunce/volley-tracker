#!/usr/bin/env python3
"""
scripts/sync_kadinlar_2_lig_team_logos.py
Kadinlar 2. Ligi takimlarinin Volleybox sayfasindan:
  - og:image logo ceker, public/logos/<slug>.png olarak kaydeder
  - og:title -> kanonical takim adini gunceller
  - data/kadinlar_2_lig.json icindeki logo ve volleybox_name gunceller
"""

import sys, os, re, json, time, io, urllib.request, urllib.error
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
LOGOS_DIR = BASE_DIR / "public" / "logos"
K2_FILE = DATA_DIR / "kadinlar_2_lig.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

NO_LOGO_PATTERNS = ["logo_women.png", "/default", "default_logo", "placeholder", "no-logo", "nologo"]


def get_slug_from_url(url):
    parts = url.rstrip("/").split("/")
    last = parts[-1]
    return re.sub(r"[^a-zA-Z0-9_\-]", "", last) or "k2_team"


def fetch_page(url, timeout=15):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  [HATA] {url}: {e}")
    return None


def extract_og_image(html):
    for pattern in [
        r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
        r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:image["\']',
    ]:
        m = re.search(pattern, html, re.I)
        if m:
            img_url = m.group(1).strip()
            if not any(p in img_url.lower() for p in NO_LOGO_PATTERNS):
                return img_url
    return None


def extract_team_name(html):
    # Volleybox TR og:title: "Takım Adı - takım kadrosu ve oyuncular | Volleybox"
    # veya: "Takım Adı | Volleybox"
    STRIP_SUFFIXES = [
        r"\s*[-–|]\s*takım kadrosu ve oyuncular.*$",
        r"\s*[-–|]\s*team roster and players.*$",
        r"\s*[-–|]\s*Volleybox.*$",
    ]

    def clean_name(raw):
        name = raw.strip()
        for suffix_pat in STRIP_SUFFIXES:
            name = re.sub(suffix_pat, "", name, flags=re.I).strip()
        return name if len(name) > 2 else None

    for pattern in [
        r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
        r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:title["\']',
    ]:
        m = re.search(pattern, html, re.I)
        if m:
            name = clean_name(m.group(1))
            if name:
                return name
    m = re.search(r"<title>([^<]+)</title>", html, re.I)
    if m:
        name = clean_name(m.group(1))
        if name:
            return name
    return None


def trim_image(im):
    try:
        if im.mode not in ("RGBA", "LA"):
            im = im.convert("RGBA")
        alpha = im.split()[-1]
        bin_alpha = alpha.point(lambda p: 255 if p > 10 else 0)
        bbox = bin_alpha.getbbox()
        if not bbox:
            return im
        w, h = im.size
        bw, bh = bbox[2]-bbox[0], bbox[3]-bbox[1]
        px, py = max(1,int(bw*0.02)), max(1,int(bh*0.02))
        cropped = im.crop((max(0,bbox[0]-px), max(0,bbox[1]-py), min(w,bbox[2]+px), min(h,bbox[3]+py)))
        max_dim = max(cropped.size)
        if max_dim > 160:
            scale = 160.0/max_dim
            cropped = cropped.resize((max(1,int(cropped.size[0]*scale)), max(1,int(cropped.size[1]*scale))), 3)
        return cropped
    except Exception:
        return im


def download_image(img_url, dest_path, timeout=15):
    req = urllib.request.Request(img_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                raw = resp.read()
                try:
                    from PIL import Image
                    with Image.open(io.BytesIO(raw)) as im:
                        trim_image(im).save(dest_path, format="PNG", optimize=True)
                except Exception:
                    open(dest_path, "wb").write(raw)
                return True
    except Exception as e:
        print(f"  [HATA] {img_url}: {e}")
    return False


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("\n" + "="*70)
    print("KADINLAR 2. LIG VOLLEYBOX TAKIM LOGO & ISIM SENKRONIZASYONU")
    print("="*70)

    with open(K2_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_teams = data.get("tum_takimlar", [])
    print(f"Toplam takim: {len(all_teams)}")

    VBM_FILE = DATA_DIR / "volleybox-mappings.json"
    if VBM_FILE.exists():
        try:
            with open(VBM_FILE, "r", encoding="utf-8") as vf:
                vbm = json.load(vf)
                k2_maps = {m["internal_name"].strip().lower(): m for m in vbm.get("mappings", []) if m.get("internal_category") == "Kadınlar 2. Ligi"}
                for m in vbm.get("mappings", []):
                    if m.get("internal_category") == "Kadınlar 2. Ligi":
                        for alias in m.get("aliases", []):
                            k2_maps[alias.strip().lower()] = m
                for t in all_teams:
                    if not t.get("volleybox_url"):
                        m = k2_maps.get(t.get("takim_adi", "").strip().lower())
                        if m:
                            t["volleybox_url"] = m.get("volleybox_url")
                            t["volleybox_name"] = m.get("matched_as")
        except Exception as mex:
            print(f"  Mappings okuma hatasi: {mex}")

    url_to_teams = {}
    for t in all_teams:
        url = t.get("volleybox_url")
        if url:
            url_to_teams.setdefault(url, []).append(t)

    no_url = [t for t in all_teams if not t.get("volleybox_url")]
    print(f"Volleybox URL olan: {len(url_to_teams)} benzersiz URL")
    print(f"Volleybox URL olmayan: {len(no_url)} takim")

    updated_logos = updated_names = skipped = errors = 0

    LOGOS_DIR.mkdir(parents=True, exist_ok=True)

    # --- Ön geçiş: disk'teki mevcut logo dosyalarını doğrudan eşle ---
    pre_updated = 0
    for t in all_teams:
        url = t.get("volleybox_url")
        if not url:
            continue
        slug = get_slug_from_url(url)
        dest_path = LOGOS_DIR / f"{slug}.png"
        local_logo = f"/logos/{slug}.png"
        if dest_path.exists() and dest_path.stat().st_size > 100:
            if t.get("logo") != local_logo:
                t["logo"] = local_logo
                pre_updated += 1
    if pre_updated:
        print(f"[Ön geçiş] {pre_updated} takımın logosu disk'ten güncellendi.")

    for idx, (vb_url, teams) in enumerate(url_to_teams.items(), 1):
        slug = get_slug_from_url(vb_url)
        dest_path = LOGOS_DIR / f"{slug}.png"
        local_logo = f"/logos/{slug}.png"
        name_sample = teams[0].get("takim_adi", "?")

        print(f"\n[{idx}/{len(url_to_teams)}] {name_sample}")
        logo_exists = dest_path.exists() and dest_path.stat().st_size > 100
        need_fetch = args.force or not logo_exists or not teams[0].get("volleybox_name")

        html = fetch_page(vb_url) if need_fetch else None
        if need_fetch and not html:
            print(f"  HATA: Sayfa yuklenemedi.")
            errors += 1
            time.sleep(1)
            continue

        if html:
            # Logo
            img_url = extract_og_image(html)
            if img_url and (args.force or not logo_exists):
                print(f"  Logo: {img_url[:80]}")
                if download_image(img_url, dest_path):
                    print(f"  OK: {dest_path.name} ({dest_path.stat().st_size} byte)")
                    for t in teams:
                        t["logo"] = local_logo
                    updated_logos += len(teams)
                else:
                    errors += 1
            elif logo_exists:
                print(f"  Mevcut logo kullanilacak: {local_logo}")
                for t in teams:
                    t["logo"] = local_logo  # her zaman guncelle
                    updated_logos += 1
                skipped += 1

            # Kanonical isim
            canon_name = extract_team_name(html)
            if canon_name:
                for t in teams:
                    old = t.get("volleybox_name", "")
                    if old != canon_name:
                        print(f"  Ad: '{old}' -> '{canon_name}'")
                        t["volleybox_name"] = canon_name
                        updated_names += 1
        elif logo_exists:
            print(f"  Mevcut logo: {local_logo}")
            for t in teams:
                t["logo"] = local_logo  # her zaman guncelle
                updated_logos += 1
            skipped += 1

        time.sleep(0.4)

    # Grup puan_durumu guncelle
    takim_id_map = {t["takim_id"]: t for t in all_teams}
    takim_adi_logo = {t["takim_adi"]: t["logo"] for t in all_teams if t.get("logo") and "takimlogoyok" not in t.get("logo","")}

    for grup in data.get("gruplar", []):
        for pt in grup.get("puan_durumu", []):
            src = takim_id_map.get(pt.get("takim_id"))
            if src:
                pt["logo"] = src.get("logo", pt.get("logo"))
                if src.get("volleybox_name"): pt["volleybox_name"] = src["volleybox_name"]
                if src.get("volleybox_url"): pt["volleybox_url"] = src["volleybox_url"]
        for mac in grup.get("fikstur", []):
            if mac.get("takim_a") in takim_adi_logo: mac["takim_a_logo"] = takim_adi_logo[mac["takim_a"]]
            if mac.get("takim_b") in takim_adi_logo: mac["takim_b_logo"] = takim_adi_logo[mac["takim_b"]]

    for mac in data.get("tum_maclar", []):
        if mac.get("takim_a") in takim_adi_logo: mac["takim_a_logo"] = takim_adi_logo[mac["takim_a"]]
        if mac.get("takim_b") in takim_adi_logo: mac["takim_b_logo"] = takim_adi_logo[mac["takim_b"]]

    print("\n" + "="*70)
    print(f"OZET: Logo guncellenen={updated_logos}, Ad guncellenen={updated_names}, Atlanan={skipped}, Hata={errors}")

    if not args.dry_run:
        with open(K2_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"OK: {K2_FILE.name} guncellendi.")
    else:
        print("DRY-RUN: dosyaya yazilmadi.")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
