import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, List, Optional

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def parse_timestamp(value: Any) -> Optional[datetime]:
    if value is None:
        return None

    text = str(value).strip()
    if not text or text.lower() in {"null", "none"}:
        return None

    if text.endswith("Z"):
        text = text[:-1] + "+00:00"

    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def find_last_updated(payload: Any) -> Optional[Any]:
    if not isinstance(payload, dict):
        return None

    candidates = [
        "updated_at",
        "updatedAt",
        "guncelleme_tarihi",
        "guncellenme_zamani",
        "last_updated",
        "lastUpdated",
        "volleybox_sync_updated_at",
    ]
    for key in candidates:
        value = payload.get(key)
        if value not in (None, "", "null", "None"):
            return value

    metadata = payload.get("metadata")
    if isinstance(metadata, dict):
        for key in candidates:
            value = metadata.get(key)
            if value not in (None, "", "null", "None"):
                return value

    return None


def is_data_fresh_enough(payload: Any, max_age_hours: int = 24) -> bool:
    last_updated = find_last_updated(payload)
    if last_updated is None:
        return False

    parsed = parse_timestamp(last_updated)
    if parsed is None:
        return False

    age_hours = (datetime.now(timezone.utc) - parsed).total_seconds() / 3600
    return age_hours <= max_age_hours


def collect_freshness_issues(paths: Iterable[str], max_age_hours: int = 24) -> List[str]:
    issues: List[str] = []
    for raw_path in paths:
        path = Path(raw_path)
        if not path.exists():
            issues.append(f"Missing data file: {raw_path}")
            continue

        try:
            with path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except Exception as exc:
            issues.append(f"Unreadable data file: {raw_path} ({exc})")
            continue

        if not is_data_fresh_enough(payload, max_age_hours=max_age_hours):
            issues.append(
                f"Stale data file: {raw_path} (missing or older than {max_age_hours} hours)"
            )

    return issues


def main() -> None:
    files = [
        "data/cities.json",
        "data/kadinlar_2_lig.json",
    ]
    issues = collect_freshness_issues(files, max_age_hours=24)
    if issues:
        for issue in issues:
            print(f"❌ {issue}")
        raise SystemExit(1)

    print("✅ Data freshness check passed for the latest snapshots.")


if __name__ == "__main__":
    main()
