import json
import os
from typing import Any, Dict, List


SCRAPE_CONFIG = {
    "cities": {
        "name": "81 il",
        "path": "data/cities.json",
    },
    "kadinlar_2_lig": {
        "name": "Kadınlar 2. Lig",
        "path": "data/kadinlar_2_lig.json",
    },
}


def normalize_name(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip().lower()
    replacements = {
        "ç": "c",
        "ğ": "g",
        "ı": "i",
        "ö": "o",
        "ş": "s",
        "ü": "u",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return " ".join(text.split())


def request_with_retry(request_fn, max_attempts: int = 3, initial_delay: float = 1.0):
    last_error = None
    delay = initial_delay
    for attempt in range(1, max_attempts + 1):
        try:
            return request_fn()
        except Exception as exc:  # pragma: no cover - exercised at runtime
            last_error = exc
            if attempt == max_attempts:
                break
            import time
            time.sleep(delay)
            delay *= 2
    raise last_error


def fetch_with_retry(method_name: str, request_fn, max_attempts: int = 3, initial_delay: float = 1.0):
    try:
        return request_with_retry(request_fn, max_attempts=max_attempts, initial_delay=initial_delay)
    except Exception as exc:
        raise RuntimeError(f"{method_name} failed after {max_attempts} attempts: {exc}") from exc


def validate_city_index(payload: Dict[str, Any]) -> Dict[str, Any]:
    errors: List[str] = []
    if not isinstance(payload, dict):
        return {"valid": False, "errors": ["City index payload is missing or invalid."], "summary": "City index validation failed: payload not found."}

    cities = payload.get("cities") if isinstance(payload.get("cities"), list) else []
    if not cities:
        errors.append("cities array is empty.")

    if payload.get("total_cities") is not None and int(payload.get("total_cities", 0)) != len(cities):
        errors.append(f"total_cities mismatch: expected {len(cities)}, got {payload.get('total_cities')}." )

    active_cities = sum(1 for city in cities if int(city.get("matches_count", 0) or 0) > 0 or int(city.get("standings_count", 0) or 0) > 0)
    if payload.get("active_cities") is not None and int(payload.get("active_cities", 0)) != active_cities:
        errors.append(f"active_cities mismatch: expected {active_cities}, got {payload.get('active_cities')}." )

    total_matches = sum(int(city.get("matches_count", 0) or 0) for city in cities)
    if payload.get("total_matches") is not None and int(payload.get("total_matches", 0)) != total_matches:
        errors.append(f"total_matches mismatch: expected {total_matches}, got {payload.get('total_matches')}." )

    valid = not errors
    return {
        "valid": valid,
        "errors": errors,
        "summary": (
            f"City index validated: {len(cities)} cities, {active_cities} active, {total_matches} matches."
            if valid else f"City index validation failed: {' '.join(errors)}"
        ),
    }


def validate_kadinlar_2_lig_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    errors: List[str] = []
    if not isinstance(payload, dict):
        return {"valid": False, "errors": ["2. Lig payload is missing or invalid."], "summary": "Second-division validation failed: payload not found."}

    metadata = payload.get("metadata")
    if not isinstance(metadata, dict):
        errors.append("metadata is missing or incomplete.")

    groups = payload.get("gruplar") if isinstance(payload.get("gruplar"), list) else []
    if not groups:
        errors.append("gruplar array is empty.")

    expected_group_count = metadata.get("toplam_grup_sayisi") if isinstance(metadata, dict) else None
    if expected_group_count is not None and int(expected_group_count) != len(groups):
        errors.append(f"toplam_grup_sayisi mismatch: expected {len(groups)}, got {expected_group_count}.")

    total_teams = sum(len(group.get("puan_durumu", [])) for group in groups if isinstance(group, dict))
    expected_teams = metadata.get("toplam_takim_sayisi") if isinstance(metadata, dict) else None
    if expected_teams is not None and int(expected_teams) != total_teams:
        errors.append(f"toplam_takim_sayisi mismatch: expected {total_teams}, got {expected_teams}.")

    all_matches = payload.get("tum_maclar") if isinstance(payload.get("tum_maclar"), list) else []
    fixture_matches = sum(len(group.get("fikstur", [])) for group in groups if isinstance(group, dict))
    match_count = len(all_matches) if all_matches else fixture_matches
    expected_matches = metadata.get("toplam_mac_sayisi") if isinstance(metadata, dict) else None
    if expected_matches is not None and int(expected_matches) != match_count:
        errors.append(f"toplam_mac_sayisi mismatch: expected {match_count}, got {expected_matches}.")

    valid = not errors
    return {
        "valid": valid,
        "errors": errors,
        "summary": (
            f"Second-division data validated: {len(groups)} groups, {total_teams} teams, {match_count} matches."
            if valid else f"Second-division validation failed: {' '.join(errors)}"
        ),
    }


def validate_file(path: str, kind: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        return {"valid": False, "errors": [f"{kind} data file is missing: {path}"], "summary": f"{kind} validation failed: file missing."}

    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception as exc:
        return {"valid": False, "errors": [str(exc)], "summary": f"{kind} validation failed: {exc}"}

    if kind == "cities":
        return validate_city_index(data)
    if kind == "kadinlar_2_lig":
        return validate_kadinlar_2_lig_data(data)
    return {"valid": False, "errors": [f"Unsupported validation kind: {kind}"], "summary": f"Unsupported validation kind: {kind}"}


def print_validation_summary(label: str, result: Dict[str, Any]) -> None:
    print(f"\n📊 {label} validation: {'OK' if result.get('valid') else 'FAILED'}")
    print(f"   {result.get('summary', '')}")
    if result.get("errors"):
        for error in result["errors"]:
            print(f"   - {error}")


if __name__ == "__main__":
    for key, folder in SCRAPE_CONFIG.items():
        result = validate_file(folder["path"], key)
        print_validation_summary(folder["name"], result)
