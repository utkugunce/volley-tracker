import json
import subprocess
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from scripts import merge_kadinlar_2_lig_mappings as merge_mod
from scripts.skip_timestamp_only_changes import (
    newest_timestamp,
    process,
    should_restore,
    strip_volatile,
)

NOW = datetime(2026, 10, 3, 12, 0, tzinfo=timezone.utc)


def iso(hours_ago):
    return (NOW - timedelta(hours=hours_ago)).replace(tzinfo=None).isoformat()


class TestStripVolatile(unittest.TestCase):
    def test_removes_volatile_keys_at_any_depth(self):
        payload = {
            "updated_at": "x",
            "metadata": {"guncellenme_zamani": "y", "volleybox_sync_updated_at": "z", "keep": 1},
            "matches": [{"id": 1, "updated_at": "q"}],
        }
        self.assertEqual(
            strip_volatile(payload),
            {"metadata": {"keep": 1}, "matches": [{"id": 1}]},
        )


class TestShouldRestore(unittest.TestCase):
    def test_timestamp_only_and_fresh_is_restored(self):
        old = {"updated_at": iso(1), "matches": [1, 2]}
        new = {"updated_at": iso(0), "matches": [1, 2]}
        self.assertTrue(should_restore(old, new, 6, now=NOW))

    def test_content_change_is_kept(self):
        old = {"updated_at": iso(1), "matches": [1, 2]}
        new = {"updated_at": iso(0), "matches": [1, 3]}
        self.assertFalse(should_restore(old, new, 6, now=NOW))

    def test_stale_head_timestamp_is_refreshed_heartbeat(self):
        old = {"updated_at": iso(7), "matches": [1]}
        new = {"updated_at": iso(0), "matches": [1]}
        self.assertFalse(should_restore(old, new, 6, now=NOW))

    def test_non_heartbeat_file_is_restored_even_if_head_is_old(self):
        old = {"updated_at": iso(40), "matches": [1]}
        new = {"updated_at": iso(0), "matches": [1]}
        self.assertTrue(should_restore(old, new, 12, now=NOW, needs_heartbeat=False))

    def test_missing_timestamp_is_kept(self):
        self.assertFalse(should_restore({"a": 1}, {"a": 1}, 6, now=NOW))

    def test_list_order_difference_is_a_real_change(self):
        old = {"updated_at": iso(1), "aliases": ["a", "b"]}
        new = {"updated_at": iso(0), "aliases": ["b", "a"]}
        self.assertFalse(should_restore(old, new, 6, now=NOW))

    def test_newest_timestamp_reads_metadata(self):
        payload = {"metadata": {"guncellenme_zamani": iso(2), "volleybox_sync_updated_at": iso(5)}}
        self.assertEqual(newest_timestamp(payload), NOW - timedelta(hours=2))


class TestProcessInGitRepo(unittest.TestCase):
    def _git(self, repo, *args):
        subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)

    def test_restores_only_timestamp_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "data").mkdir()
            fresh = datetime.now(timezone.utc).replace(tzinfo=None)
            same = {"updated_at": fresh.isoformat(), "matches": [1]}
            changed = {"updated_at": fresh.isoformat(), "matches": [1]}
            for name, payload in (("same.json", same), ("changed.json", changed), ("cities.json", same)):
                (repo / "data" / name).write_text(json.dumps(payload, indent=2), encoding="utf-8")
            self._git(repo, "init", "-q")
            self._git(repo, "-c", "user.name=t", "-c", "user.email=t@t", "add", ".")
            self._git(repo, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init")

            later = (fresh + timedelta(minutes=30)).isoformat()
            (repo / "data" / "same.json").write_text(
                json.dumps({"updated_at": later, "matches": [1]}, indent=2), encoding="utf-8")
            (repo / "data" / "changed.json").write_text(
                json.dumps({"updated_at": later, "matches": [1, 2]}, indent=2), encoding="utf-8")

            (repo / "data" / "cities.json").write_text(
                json.dumps({"updated_at": later, "matches": [1]}, indent=2), encoding="utf-8")

            result = process(repo, 12)
            self.assertEqual(sorted(result["restored"]), ["data/cities.json", "data/same.json"])
            self.assertEqual(result["kept_changed"], ["data/changed.json"])
            self.assertEqual(json.loads((repo / "data" / "same.json").read_text())["updated_at"], fresh.isoformat())
            self.assertEqual(json.loads((repo / "data" / "changed.json").read_text())["updated_at"], later)


class TestMergeAliasOrderIsDeterministic(unittest.TestCase):
    def test_ordered_union_keeps_existing_order_and_dedupes(self):
        self.assertEqual(
            merge_mod._ordered_union(["b", "a"], ["c", "a", "d", "c"]),
            ["b", "a", "c", "d"],
        )
        self.assertEqual(merge_mod._ordered_union(None, ["x", "x"]), ["x"])


if __name__ == "__main__":
    unittest.main()
