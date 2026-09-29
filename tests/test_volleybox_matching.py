import unittest

from scripts.sync_volleybox_matches import match_tvf_with_vb


class TestVolleyboxMatchMatching(unittest.TestCase):
    def test_rejects_fixture_with_only_shared_team_words(self):
        tvf_match = {
            "id": "izmir-20261009-056",
            "home_team": "KZY Spor Kulübü U16",
            "away_team": "Alfa Karşıyaka Voleybol Spor Kulübü U16",
            "date": "2026-10-09",
        }
        volleybox_matches = [
            {
                "match_id": "401131",
                "host_name": "Alfa Gaziemir Voleybol Spor Kulübü U16",
                "guest_name": "KZY Bornova Spor Kulübü U16",
                "date": "2026-10-03",
            }
        ]

        matched = match_tvf_with_vb(tvf_match, volleybox_matches, {})

        self.assertIsNone(matched)

    def test_keeps_exact_team_match(self):
        tvf_match = {
            "home_team": "KZY Spor Kulübü U16",
            "away_team": "Alfa Karşıyaka Voleybol Spor Kulübü U16",
            "date": "2026-10-09",
        }
        volleybox_match = {
            "match_id": "401132",
            "host_name": "KZY Spor Kulübü U16",
            "guest_name": "Alfa Karşıyaka Voleybol Spor Kulübü U16",
            "date": "2026-10-09",
        }

        matched = match_tvf_with_vb(tvf_match, [volleybox_match], {})

        self.assertIs(matched, volleybox_match)


if __name__ == "__main__":
    unittest.main()
