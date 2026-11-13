import unittest
from unittest.mock import patch

from scripts.validate_data_files import main


class TestValidateDataFiles(unittest.TestCase):
    @patch("scripts.validate_data_files.validate_file")
    def test_main_exits_nonzero_when_any_validation_fails(self, mock_validate_file):
        mock_validate_file.side_effect = [
            {"valid": False, "errors": ["bad city data"], "summary": "City index validation failed"},
            {"valid": True, "errors": [], "summary": "Second-division data validated"},
            {"valid": True, "errors": [], "summary": "Sultanlar Ligi data validated"},
            {"valid": True, "errors": [], "summary": "Kadınlar 1. Lig data validated"},
        ]

        with self.assertRaises(SystemExit) as context:
            main([])

        self.assertNotEqual(context.exception.code, 0)

    @patch("scripts.validate_data_files.collect_freshness_issues", return_value=["Stale data file: data/cities.json"])
    @patch("scripts.validate_data_files.validate_volleybox_sync_integrity", return_value={"valid": True, "errors": [], "summary": "OK"})
    @patch("scripts.validate_data_files.validate_file", return_value={"valid": True, "errors": [], "summary": "OK"})
    def test_stale_data_warns_by_default_and_fails_with_require_fresh(
        self, _mock_validate_file, _mock_vb, _mock_freshness
    ):
        main([])
        with self.assertRaises(SystemExit) as context:
            main(["--require-fresh"])
        self.assertNotEqual(context.exception.code, 0)


if __name__ == "__main__":
    unittest.main()
