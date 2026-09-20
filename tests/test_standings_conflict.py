"""
tests/test_standings_conflict.py
Unit tests for standings team name conflict detection and automatic disambiguation.
"""

import unittest
from unittest.mock import patch, MagicMock
from scripts.scrape_all_provinces import apply_volleybox_names
from scripts.check_standings_conflicts import scan_for_standings_conflicts


class TestStandingsConflictResolution(unittest.TestCase):

    def test_duplicate_teams_with_different_stats_disambiguated(self):
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
