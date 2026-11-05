import json
from scripts.source_snapshot import write_source_snapshot

def test_keeps_content_change_time_on_successful_unchanged_fetch(tmp_path):
    path = tmp_path / "city.json"
    payload = {"updated_at": "2026-11-04", "matches": [{"id": "1"}]}
    write_source_snapshot(path, payload)
    first = json.loads(path.read_text())
    write_source_snapshot(path, dict(payload, updated_at="2026-11-05"))
    second = json.loads(path.read_text())
    assert second["content_changed_at"] == first["content_changed_at"]
    assert second["last_success_at"] >= first["last_success_at"]
    write_source_snapshot(path, dict(payload, matches=[{"id": "2"}]))
    assert json.loads(path.read_text())["content_changed_at"] >= second["content_changed_at"]

def test_failed_attempt_keeps_previous_success(tmp_path):
    from scripts.source_snapshot import record_scan_status
    path = tmp_path / "scan.json"
    record_scan_status(path, "success")
    previous = json.loads(path.read_text())["last_success_at"]
    record_scan_status(path, "running")
    record_scan_status(path, "failure")
    status = json.loads(path.read_text())
    assert status["last_success_at"] == previous
    assert status["status"] == "failure"
    assert status["last_attempt_at"] >= previous
