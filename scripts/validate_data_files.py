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


def main():
    results = [
        ("81 il", validate_file("data/cities.json", "cities")),
        ("Kadınlar 2. Lig", validate_file("data/kadinlar_2_lig.json", "kadinlar_2_lig")),
    ]
    for label, result in results:
        print_validation_summary(label, result)

    freshness_issues = collect_freshness_issues(["data/cities.json", "data/kadinlar_2_lig.json"], max_age_hours=24)
    if freshness_issues:
        print("\n📊 Data freshness validation: FAILED")
        for issue in freshness_issues:
            print(f"   - {issue}")

    if any(not result.get("valid", False) for _, result in results) or freshness_issues:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
