import unittest
from unittest.mock import patch

from scripts.validate_data_files import main


class TestValidateDataFiles(unittest.TestCase):
    @patch("scripts.validate_data_files.validate_file")
    def test_main_exits_nonzero_when_any_validation_fails(self, mock_validate_file):
        mock_validate_file.side_effect = [
            {"valid": False, "errors": ["bad city data"], "summary": "City index validation failed"},
            {"valid": True, "errors": [], "summary": "Second-division data validated"},
        ]

        with self.assertRaises(SystemExit) as context:
            main()

        self.assertNotEqual(context.exception.code, 0)


if __name__ == "__main__":
    unittest.main()
