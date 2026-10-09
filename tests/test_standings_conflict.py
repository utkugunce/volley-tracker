"""
tests/test_standings_conflict.py
Unit tests for standings team name conflict detection and automatic disambiguation.
"""

import unittest
from unittest.mock import patch, MagicMock
from scripts.scrape_all_provinces import apply_volleybox_names
from scripts.check_standings_conflicts import scan_for_standings_conflicts


class TestStandingsConflictResolution(unittest.TestCase):

    @patch("scripts.scrape_all_provinces.RESOLVE_TEAM_NAME", return_value="Bizimkent Spor Kulübü U16")
    def test_duplicate_teams_with_different_stats_disambiguated(self, mock_resolve):
        """Aynı grupta aynı çözümlenmiş isme sahip ancak farklı istatistikleri olan
        iki takım otomatik olarak ' - A' ve ' - B' sonekleriyle ayrıştırılmalı."""
        standings = {
            "Yıldız Kızlar Süper Lig - B Grubu": [
                {
                    "rank": 6,
                    "team": "Bizimkent Voleybol",
                    "played": 1,
                    "won": 0,
                    "lost": 1,
                    "points": 1,
                    "sets_won": 2,
                    "sets_lost": 3,
                    "points_won": 110,
                    "points_lost": 103,
                },
                {
                    "rank": 7,
                    "team": "Bizimkent Sk",
                    "played": 1,
                    "won": 0,
                    "lost": 1,
                    "points": 0,
                    "sets_won": 0,
                    "sets_lost": 3,
                    "points_won": 59,
                    "points_lost": 77,
                },
            ]
        }
        matches = [
            {
                "category": "Yıldız Kızlar Süper Lig",
                "group": "B Grubu",
                "home_team": "Yeşilyurt",
                "away_team": "Bizimkent Voleybol",
            },
            {
                "category": "Yıldız Kızlar Süper Lig",
                "group": "B Grubu",
                "home_team": "Sarıyer Bld",
                "away_team": "Bizimkent Sk",
            },
        ]

        apply_volleybox_names(matches, standings, "İstanbul")

        table = standings["Yıldız Kızlar Süper Lig - B Grubu"]
        team_names = [row["team"] for row in table]

        # İki takımın isimleri farklı olmalı ve - A / - B içermeli
        self.assertEqual(len(set(team_names)), 2, "Takım isimleri çakışmamalı")
        self.assertTrue(any(" - A" in t for t in team_names))
        self.assertTrue(any(" - B" in t for t in team_names))

        # Maçlardaki deplasman takımları da puan durumundakiyle birebir örtüşmeli
        away_teams = [m["away_team"] for m in matches]
        self.assertEqual(len(set(away_teams)), 2, "Maçlardaki takımlar da ayrışmalı")
        for at in away_teams:
            self.assertIn(at, team_names, f"Maç takımı '{at}' puan durumunda bulunmalı")

    def test_single_team_not_modified_with_suffix(self):
        """Grupta çakışma olmayan tekil takımlara gereksiz '- A' / '- B' eklenmemeli."""
        standings = {
            "Genç Kızlar Süper Lig - A Grubu": [
                {
                    "rank": 1,
                    "team": "Fenerbahçe",
                    "played": 1,
                    "won": 1,
                    "lost": 0,
                    "points": 3,
                    "sets_won": 3,
                    "sets_lost": 0,
                },
                {
                    "rank": 2,
                    "team": "Galatasaray",
                    "played": 1,
                    "won": 1,
                    "lost": 0,
                    "points": 3,
                    "sets_won": 3,
                    "sets_lost": 1,
                },
            ]
        }
        matches = [
            {
                "category": "Genç Kızlar Süper Lig",
                "group": "A Grubu",
                "home_team": "Fenerbahçe",
                "away_team": "Galatasaray",
            }
        ]

        apply_volleybox_names(matches, standings, "İstanbul")
        table = standings["Genç Kızlar Süper Lig - A Grubu"]
        team_names = [row["team"] for row in table]

        self.assertFalse(any(" - A" in t for t in team_names))
        self.assertFalse(any(" - B" in t for t in team_names))

    def test_ankara_group_overrides(self):
        """Ankara Yıldız Kızlar Süper Lig'de:
        - 3. Gruptaki TED Ankara Kolejliler A takımı ('TED Ankara Kolejliler U16')
        - 5. Gruptaki TED Ankara Kolejliler B takımı ('TED Ankara Kolejliler - B U16')
        olarak çözümlenmeli."""
        standings = {
            "Yıldız Kızlar Süper Lig - 3. Grup": [
                {"rank": 5, "team": "TED Ankara Kolejliler", "played": 0, "points": 0}
            ],
            "Yıldız Kızlar Süper Lig - 5. Grup": [
                {"rank": 3, "team": "TED Ankara Kolejliler", "played": 1, "points": 0}
            ],
        }
        matches = [
            {
                "category": "Yıldız Kızlar Süper Lig",
                "group": "3. Grup",
                "home_team": "TED Ankara Kolejliler",
                "away_team": "Yedidağ Spor Kulübü",
            },
            {
                "category": "Yıldız Kızlar Süper Lig",
                "group": "5. Grup",
                "home_team": "TED Ankara Kolejliler",
                "away_team": "TEİAŞ Spor Kulübü",
            },
        ]

        apply_volleybox_names(matches, standings, "Ankara")

        # 3. Grup A takımı
        self.assertEqual(standings["Yıldız Kızlar Süper Lig - 3. Grup"][0]["team"], "TED Ankara Kolejliler U16")
        self.assertEqual(matches[0]["home_team"], "TED Ankara Kolejliler U16")

        # 5. Grup B takımı
        self.assertEqual(standings["Yıldız Kızlar Süper Lig - 5. Grup"][0]["team"], "TED Ankara Kolejliler - B U16")
        self.assertEqual(matches[1]["home_team"], "TED Ankara Kolejliler - B U16")

    def test_bursa_group_overrides(self):
        """Bursa Yıldız Kızlar Süper Lig'de C grubundaki Nilüfer Belediyespor -> Nilüfer Belediyespor - B U16,
        B grubundaki Bursa 1973 Fethiye Spor -> Bursa Fethiye 1973 Spor Kulübü - B U16 olarak çözülmeli."""
        standings = {
            "Yıldız Kızlar Süper Lig - - B": [
                {"rank": 1, "team": "Bursa 1973 Fethiye Spor", "played": 1, "won": 0, "lost": 1, "points": 0}
            ],
            "Yıldız Kızlar Süper Lig - - C": [
                {"rank": 1, "team": "Nilüfer Belediyespor", "played": 1, "won": 1, "lost": 0, "points": 3}
            ],
        }
        matches = [
            {
                "category": "Yıldız Kızlar Süper Lig",
                "group": "B Grubu",
                "home_team": "Bursa 1973 Fethiye Spor",
                "away_team": "Doruk Voleybol Spor Kulübü U16",
            },
            {
                "category": "Yıldız Kızlar Süper Lig",
                "group": "C Grubu",
                "home_team": "Nilüfer Belediyespor",
                "away_team": "Mesut Kökel Spor Kulübü U16",
            },
        ]
        apply_volleybox_names(matches, standings, "Bursa")

        self.assertEqual(standings["Yıldız Kızlar Süper Lig - - B"][0]["team"], "Bursa Fethiye 1973 Spor Kulübü - B U16")
        self.assertEqual(matches[0]["home_team"], "Bursa Fethiye 1973 Spor Kulübü - B U16")

        self.assertEqual(standings["Yıldız Kızlar Süper Lig - - C"][0]["team"], "Nilüfer Belediyespor - B U16")
        self.assertEqual(matches[1]["home_team"], "Nilüfer Belediyespor - B U16")

    def test_live_data_has_zero_standings_conflicts(self):
        """Mevcut data/ dizinindeki tüm şehir dosyalarında 0 takım ismi çakışması olmalı."""
        conflicts = scan_for_standings_conflicts()
        self.assertEqual(
            len(conflicts),
            0,
            f"Beklenmeyen puan durumu çakışmaları bulundu: {conflicts}",
        )


if __name__ == "__main__":
    unittest.main()
