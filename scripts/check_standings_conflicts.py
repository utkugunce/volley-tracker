"""
scripts/check_standings_conflicts.py
Puan durumu tablolarında aynı grupta aynı takım isminin mükerrer geçip geçmediğini denetler.
GitHub Actions ortamında çalışırken ::warning:: anotasyonu ve Step Summary üretir;
gerekirse workflow'u fail etmeden GitHub Issue oluşturur.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from collections import Counter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CITIES_DIR = DATA_DIR / "cities"
FIXTURES_JSON = DATA_DIR / "fixtures.json"


def scan_for_standings_conflicts():
    """Tüm şehir dosyaları ve fixtures.json içindeki puan durumu tablolarını tarar."""
    files_to_check = []
    if FIXTURES_JSON.exists():
        files_to_check.append(FIXTURES_JSON)
    if CITIES_DIR.exists():
        files_to_check.extend(sorted(CITIES_DIR.glob("*.json")))

    conflicts = []

    for file_path in files_to_check:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"Hata: {file_path.name} okunamadı: {e}", file=sys.stderr)
            continue

        standings = data.get("standings", {})
        if not isinstance(standings, dict):
            continue

        for grp_name, table in standings.items():
            if not isinstance(table, list):
                continue

            team_counts = Counter()
            team_rows = {}
            for row in table:
                if isinstance(row, dict) and "team" in row:
                    t_name = str(row["team"]).strip()
                    team_counts[t_name] += 1
                    team_rows.setdefault(t_name, []).append(row)

            for t_name, count in team_counts.items():
                if count > 1:
                    conflicts.append({
                        "file": str(file_path.relative_to(BASE_DIR)),
                        "group": grp_name,
                        "team": t_name,
                        "count": count,
                        "ranks": [r.get("rank") for r in team_rows[t_name]],
                        "stats": [
                            f"Rank {r.get('rank')}: {r.get('points', 0)}P, {r.get('won', 0)}G-{r.get('lost', 0)}M, {r.get('sets_won', 0)}-{r.get('sets_lost', 0)}S"
                            for r in team_rows[t_name]
                        ]
                    })

    return conflicts


def report_conflicts(conflicts):
    if not conflicts:
        print("✅ Puan durumu tablolarında takım ismi çakışması bulunamadı.")
        return

    print(f"\n⚠️ Toplam {len(conflicts)} puan durumu takım ismi çakışması tespit edildi:\n")
    for c in conflicts:
        file_name = c["file"]
        grp = c["group"]
        team = c["team"]
        count = c["count"]
        ranks = c["ranks"]

        # GitHub Actions Warning Anotasyonu
        print(f"::warning file={file_name}::Puan tablosunda aynı grupta mükerrer takım ismi: '{team}' ({grp}, Sıralar: {ranks})")
        print(f"  - Dosya: {file_name}")
        print(f"    Grup: {grp}")
        print(f"    Takım: {team} ({count} kez)")
        for st in c["stats"]:
            print(f"      * {st}")

    # GitHub Step Summary yazımı (varsa)
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_file:
        try:
            with open(summary_file, "a", encoding="utf-8") as f:
                f.write("## ⚠️ Puan Durumu Takım İsmi Çakışmaları\n\n")
                f.write("| Dosya | Grup | Takım | Sayı | Sıralar |\n")
                f.write("| --- | --- | --- | --- | --- |\n")
                for c in conflicts:
                    ranks_str = ", ".join(str(r) for r in c["ranks"])
                    f.write(f"| `{c['file']}` | {c['group']} | **{c['team']}** | {c['count']} | {ranks_str} |\n")
                f.write("\n> Bu çakışmalar `scripts/scrape_all_provinces.py` içindeki `apply_volleybox_names` ile otomatik olarak ` - A`, ` - B` sonekleriyle ayrıştırılır.\n")
        except Exception as e:
            print(f"Step summary yazılamadı: {e}", file=sys.stderr)

    # GitHub Issue oluşturma (varsa GH_TOKEN ve gh CLI)
    gh_token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if gh_token:
        issue_title = "⚠️ Puan Durumu Takım İsmi Çakışması Raporu"
        try:
            # Mevcut açık issue'ları kontrol et
            check_cmd = ["gh", "issue", "list", "--state", "open", "--search", issue_title, "--json", "number"]
            res = subprocess.run(check_cmd, capture_output=True, text=True, env=dict(os.environ, GH_TOKEN=gh_token))
            existing = json.loads(res.stdout) if res.returncode == 0 and res.stdout.strip() else []
            if not existing:
                body_lines = [
                    "Aşağıdaki puan durumu gruplarında mükerrer takım isimleri tespit edilmiştir:\n",
                    "| Dosya | Grup | Takım | Sayı | Sıralar |",
                    "| --- | --- | --- | --- | --- |"
                ]
                for c in conflicts:
                    ranks_str = ", ".join(str(r) for r in c["ranks"])
                    body_lines.append(f"| `{c['file']}` | {c['group']} | **{c['team']}** | {c['count']} | {ranks_str} |")
                body_lines.append("\nLütfen `data/volleybox-mappings.json` eşleştirmelerini kontrol edip gerekirse takımları güncelleyiniz.")
                body_text = "\n".join(body_lines)

                create_cmd = ["gh", "issue", "create", "--title", issue_title, "--body", body_text]
                subprocess.run(create_cmd, check=True, env=dict(os.environ, GH_TOKEN=gh_token))
                print("📌 Yeni GitHub Issue oluşturuldu.")
            else:
                print("ℹ️ Çakışma ile ilgili zaten açık bir GitHub Issue mevcut.")
        except Exception as e:
            print(f"GitHub Issue işlemi atlandı: {e}")


def main():
    conflicts = scan_for_standings_conflicts()
    report_conflicts(conflicts)
    # Asla workflow'u fail etme
    sys.exit(0)


if __name__ == "__main__":
    main()
