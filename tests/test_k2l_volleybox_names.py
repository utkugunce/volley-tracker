import copy
import json
import os
import tempfile
import unittest

from unittest.mock import patch

from scripts import merge_kadinlar_2_lig_mappings as merge_mod
from scripts.k2l_volleybox_names import _key, enrich_k2_data, load_k2_mappings


def _mapping_file(entries):
    fd, path = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump({"mappings": entries, "leagues": []}, f, ensure_ascii=False)
    return path


def _team(name, url=None, vb_name=None, logo="https://tvfportal.com/TakimLogo/takimlogoyok.png"):
    return {"takim_adi": name, "volleybox_url": url, "volleybox_name": vb_name, "logo": logo, "grup_no": 1}


class TestK2lVolleyboxNames(unittest.TestCase):
    def setUp(self):
        self.mapping_path = _mapping_file([
            {
                "internal_name": "PARS AKADEMİ",
                "internal_category": "Kadınlar 2. Ligi",
                "matched_as": "Sivas Pars Volley",
                "volleybox_url": "https://women.volleybox.net/tr/pars-akademi-spor-t36227",
                "aliases": ["Sivas Pars Volley", "BUFF GYM PARS AKADEMİ"],
            },
            {  # başka kategori: yok sayılmalı
                "internal_name": "ALTYAPI TAKIMI",
                "internal_category": "Genç Kızlar Süper Lig",
                "matched_as": "Altyapı U18",
                "volleybox_url": "https://women.volleybox.net/altyapi-u18-t1",
            },
        ])
        self.addCleanup(os.remove, self.mapping_path)
        self.mappings = load_k2_mappings(self.mapping_path)

    def test_loader_indexes_names_and_aliases_for_k2_only(self):
        self.assertIn(_key("BUFF GYM PARS AKADEMİ"), self.mappings)
        self.assertIn(_key("PARS AKADEMİ"), self.mappings)
        self.assertNotIn("altyapı takımı", self.mappings)

    def test_loader_missing_file_returns_empty(self):
        self.assertEqual(load_k2_mappings("/nonexistent/volleybox.json"), {})

    def test_enrich_fills_unmatched_team_and_propagates_to_matches(self):
        team = _team("BUFF GYM PARS AKADEMİ")
        data = {
            "metadata": {"volleybox_eslesme_sayisi": 0},
            "tum_takimlar": [team],
            "gruplar": [{"puan_durumu": [copy.deepcopy(team)], "fikstur": [{"takim_a": "BUFF GYM PARS AKADEMİ", "takim_b": "X"}]}],
            "tum_maclar": [{"takim_a": "X", "takim_b": "BUFF GYM PARS AKADEMİ"}],
        }
        report = enrich_k2_data(data, self.mappings, logos_dir="/nonexistent")
        self.assertEqual(report["unmatched"], [])
        self.assertEqual(report["newly_matched"], ["BUFF GYM PARS AKADEMİ"])
        self.assertEqual(data["tum_takimlar"][0]["volleybox_name"], "Sivas Pars Volley")
        self.assertEqual(data["gruplar"][0]["puan_durumu"][0]["volleybox_name"], "Sivas Pars Volley")
        self.assertEqual(data["tum_maclar"][0]["takim_b_volleybox_name"], "Sivas Pars Volley")
        self.assertEqual(data["gruplar"][0]["fikstur"][0]["takim_a_volleybox_url"], "https://women.volleybox.net/tr/pars-akademi-spor-t36227")
        self.assertEqual(data["metadata"]["volleybox_eslesme_sayisi"], 1)

    def test_unmatched_team_is_reported_and_left_untouched(self):
        data = {"tum_takimlar": [_team("BİLİNMEYEN TAKIM")], "gruplar": [], "tum_maclar": []}
        report = enrich_k2_data(data, self.mappings, logos_dir="/nonexistent")
        self.assertEqual(report["unmatched"], ["BİLİNMEYEN TAKIM"])
        self.assertEqual(report["matched"], 0)
        self.assertIsNone(data["tum_takimlar"][0]["volleybox_name"])

    def test_existing_values_are_never_overwritten(self):
        data = {
            "tum_takimlar": [_team("BUFF GYM PARS AKADEMİ", "https://example/old-t1", "Eski Ad")],
            "gruplar": [],
            "tum_maclar": [],
        }
        report = enrich_k2_data(data, self.mappings, logos_dir="/nonexistent")
        self.assertEqual(report["newly_matched"], [])
        self.assertEqual(data["tum_takimlar"][0]["volleybox_name"], "Eski Ad")

    def test_merge_does_not_duplicate_entry_when_tvf_name_is_existing_alias(self):
        k2 = {
            "tum_takimlar": [_team("BUFF GYM PARS AKADEMİ", "https://women.volleybox.net/tr/pars-akademi-spor-t36227", "Sivas Pars Volley")],
            "tum_maclar": [],
        }
        fd, k2_path = tempfile.mkstemp(suffix=".json")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(k2, f, ensure_ascii=False)
        self.addCleanup(os.remove, k2_path)
        with patch.object(merge_mod, "K2_FILE", k2_path), patch.object(merge_mod, "VBM_FILE", self.mapping_path):
            merge_mod.merge_kadinlar_2_lig_mappings(silent=True)
        with open(self.mapping_path, encoding="utf-8") as f:
            entries = [m for m in json.load(f)["mappings"] if m["internal_category"] == "Kadınlar 2. Ligi"]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["internal_name"], "PARS AKADEMİ")


if __name__ == "__main__":
    unittest.main()
