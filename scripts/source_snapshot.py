"""Preserve content-change time independently from successful fetch time."""
import json
from datetime import datetime, timezone
from pathlib import Path
from scripts.atomic_write import atomic_write_json

VOLATILE = {"updated_at", "last_attempt_at", "last_success_at", "content_changed_at", "volleybox_sync_updated_at", "guncellenme_zamani"}

def content_only(value):
    if isinstance(value, dict):
        return {k: content_only(v) for k, v in value.items() if k not in VOLATILE}
    if isinstance(value, list):
        return [content_only(v) for v in value]
    return value

def write_source_snapshot(path, payload):
    target = Path(path)
    old = {}
    if target.exists():
        try:
            old = json.loads(target.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            pass
    now = datetime.now(timezone.utc).isoformat()
    changed = content_only(old) != content_only(payload)
    result = dict(payload, last_attempt_at=now, last_success_at=now)
    result["content_changed_at"] = now if changed else old.get("content_changed_at", old.get("updated_at", now))
    atomic_write_json(target, result, min_keys=["matches"])

def record_scan_status(path, status, cities=None):
    target = Path(path)
    old = {}
    if target.exists():
        try:
            old = json.loads(target.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            pass
    now = datetime.now(timezone.utc).isoformat()
    atomic_write_json(target, {
        "last_attempt_at": now if status == "running" else old.get("last_attempt_at", now),
        "last_success_at": now if status == "success" else old.get("last_success_at"),
        "status": status,
        "cities": cities if cities is not None else old.get("cities", []),
    })
