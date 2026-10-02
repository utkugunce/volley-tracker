import os
import unittest

try:
    from scripts.update_volleybox_team_names import (
        CURRENT_SEASON_START,
        extract_team_info,
        period_covers_current_season,
    )
    HAVE_BS4 = True
except ImportError:  # bs4 kurulu değilse atla
    HAVE_BS4 = False

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def _read(name):
    with open(os.path.join(FIXTURES, name), "r", encoding="utf-8") as f:
        return f.read()


@unittest.skipUnless(HAVE_BS4, "beautifulsoup4 kurulu değil")
class TestUpdateVolleyboxTeamNames(unittest.TestCase):
    def test_current_season_constant(self):
        self.assertEqual(CURRENT_SEASON_START, 2026)

    def test_period_covers_current_season(self):
        self.assertTrue(period_covers_current_season("2025/26 - günümüz"))
        self.assertTrue(period_covers_current_season("2024/25 - present"))
        self.assertTrue(period_covers_current_season("2025/26 - 2026/27"))
        self.assertFalse(period_covers_current_season("2022/23 - 2022/23"))
        self.assertFalse(period_covers_current_season("2023/24 - 2025/26"))
        self.assertFalse(period_covers_current_season(""))
        self.assertFalse(period_covers_current_season("bilinmiyor"))

    def test_dinamo_spor_picks_current_sponsor_name(self):
        info = extract_team_info(_read("volleybox_dinamo_spor_t32154_excerpt.html"))
        self.assertEqual(info["base_name"], "Dinamo Spor")
        self.assertEqual(info["active_sponsored_name"], "Toyzz Shop Dinamo Spor")
        self.assertEqual(info["chosen_name"], "Toyzz Shop Dinamo Spor")
        self.assertIn("Toyzz Shop Dinamo Spor", info["historical_names"])

    def test_nicer_hotel_ignores_old_season_name(self):
        info = extract_team_info(_read("volleybox_nicer_hotel_t20783_excerpt.html"))
        self.assertIsNone(info["active_sponsored_name"])
        self.assertEqual(info["chosen_name"], "Nicer Hotel Voleybol Kulübü")
        self.assertIn("Galip Demirel Ortaokulu Spor Kulübü", info["historical_names"])
        self.assertNotEqual(info["chosen_name"], "Galip Demirel Ortaokulu Spor Kulübü")


if __name__ == "__main__":
    unittest.main()
