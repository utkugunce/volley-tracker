import json
import tempfile
import unittest
from pathlib import Path

from scripts.data_freshness import is_data_fresh_enough


class TestDataFreshness(unittest.TestCase):
    def test_recent_data_is_fresh(self):
        payload = {"updated_at": "2099-01-01T00:00:00Z"}
        self.assertTrue(is_data_fresh_enough(payload, max_age_hours=24))

    def test_old_data_is_not_fresh(self):
        payload = {"updated_at": "2020-01-01T00:00:00Z"}
        self.assertFalse(is_data_fresh_enough(payload, max_age_hours=24))

    def test_missing_update_time_is_not_fresh(self):
        payload = {"metadata": {}}
        self.assertFalse(is_data_fresh_enough(payload, max_age_hours=24))


if __name__ == "__main__":
    unittest.main()
