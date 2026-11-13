import glob
import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from scripts.data_freshness import collect_freshness_issues
from scripts.data_quality import validate_file, print_validation_summary
from scripts.sync_volleybox_matches import team_match_score


def validate_volleybox_sync_integrity() -> dict:
    """Tüm şehir bültenlerindeki Volleybox eşleşmelerinin takım isimleriyle uyumlu olduğunu doğrular."""
    mappings_file = BASE_DIR / "data" / "volleybox-mappings.json"
    if not mappings_file.exists():
        return {"valid": True, "errors": [], "summary": "Mappings file not found, skipping VB sync integrity check."}

    with open(mappings_file, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)

    team_alias_map = {}
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

    errors = []
    total_checked = 0
    files_to_check = sorted(glob.glob(str(BASE_DIR / "data" / "cities" / "*.json")) + [str(BASE_DIR / "data" / "fixtures.json")])

    for p in files_to_check:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        for m in data.get("matches", []):
            v = m.get("volleybox", {})
            if not v.get("synced"):
                continue
            total_checked += 1
            tvf_h = str(m.get("home_team") or "").strip()
            tvf_a = str(m.get("away_team") or "").strip()
            vb_h = str(v.get("host_name") or "").strip()
            vb_a = str(v.get("guest_name") or "").strip()
            syn_h = team_alias_map.get(tvf_h.lower(), set())
            syn_a = team_alias_map.get(tvf_a.lower(), set())

            s_dir = (team_match_score(tvf_h, vb_h, syn_h) >= 50 and team_match_score(tvf_a, vb_a, syn_a) >= 50)
            s_rev = (team_match_score(tvf_h, vb_a, syn_h) >= 50 and team_match_score(tvf_a, vb_h, syn_a) >= 50)

            if not (s_dir or s_rev):
                p_rel = Path(p).name
                errors.append(f"{p_rel} [{m.get('id')}]: TVF ({tvf_h} vs {tvf_a}) != VB ({vb_h} vs {vb_a}) [VB ID: {v.get('match_id')}]")

    valid = len(errors) == 0
    return {
        "valid": valid,
        "errors": errors,
        "summary": (
            f"Volleybox eşleşme bütünlüğü doğrulandı: {total_checked} senkronize maç 0 takım uyumsuzluğu ile onaylandı."
            if valid
            else f"Volleybox eşleşme bütünlüğü BAŞARISIZ: {len(errors)} hatalı eşleşme tespit edildi."
        ),
    }


def main(argv=None):
    args = sys.argv[1:] if argv is None else list(argv)
    require_fresh = "--require-fresh" in args

    vb_integrity = validate_volleybox_sync_integrity()
    results = [
        ("81 il", validate_file("data/cities.json", "cities")),
        ("Volleybox Maç Eşleşme Bütünlüğü", vb_integrity),
    ]
    for label, result in results:
        print_validation_summary(label, result)

    freshness_files = [
        "data/cities.json",
    ]
    freshness_issues = collect_freshness_issues(freshness_files, max_age_hours=24)
    if freshness_issues:
        status_label = "FAILED" if require_fresh else "WARNING"
        print(f"\n📊 Data freshness validation: {status_label}")
        for issue in freshness_issues:
            print(f"   - {issue}")

    if any(not result.get("valid", False) for _, result in results) or (require_fresh and freshness_issues):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
