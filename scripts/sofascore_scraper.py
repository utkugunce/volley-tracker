#!/usr/bin/env python3
"""
Sofascore Voleybol Scraper
Kadınlar 2. Ligi ve diğer liglerin canlı skorlarını Sofascore'dan çeker
"""

import requests
import json
import time
from typing import Dict, List, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SofascoreScraper:
    def __init__(self):
        self.base_url = "https://www.sofascore.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def get_tournament_matches(self, tournament_id: str) -> List[Dict]:
        """
        Belirli bir turnuvadaki maçları getirir
        tournament_id: Örn: "30109" (Kadınlar 2. Ligi)
        """
        try:
            url = f"{self.base_url}/api/v1/tournament/{tournament_id}/matches/current"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            matches = []
            for match in data.get("events", []):
                match_data = {
                    "id": match.get("id"),
                    "home_team": match.get("homeTeam", {}).get("name"),
                    "away_team": match.get("awayTeam", {}).get("name"),
                    "home_score": match.get("homeScore", {}).get("current"),
                    "away_score": match.get("awayScore", {}).get("current"),
                    "status": self._convert_status(match.get("status", {}).get("type")),
                    "start_time": match.get("startTimestamp"),
                    "set_scores": self._extract_set_scores(match),
                    "tournament_id": tournament_id,
                }
                matches.append(match_data)
            
            logger.info(f"{len(matches)} maç bulundu")
            return matches
            
        except requests.RequestException as e:
            logger.error(f"Sofascore API hatası: {e}")
            return []

    def get_tournament_standings(self, tournament_id: str) -> Dict:
        """
        Belirli bir turnuvanın puan durumunu getirir
        """
        try:
            url = f"{self.base_url}/api/v1/tournament/{tournament_id}/standings"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            standings = []
            for row in data.get("standings", []):
                team_data = {
                    "rank": row.get("position"),
                    "team": row.get("team", {}).get("name"),
                    "played": row.get("matches"),
                    "won": row.get("wins"),
                    "lost": row.get("losses"),
                    "points": row.get("points"),
                    "group": row.get("group"),
                }
                standings.append(team_data)
            
            logger.info(f"{len(standings)} takım puan durumu bulundu")
            return {"standings": standings}
            
        except requests.RequestException as e:
            logger.error(f"Puan durumu hatası: {e}")
            return {"standings": []}

    def get_live_matches(self, sport: str = "volleyball") -> List[Dict]:
        """
        Canlı oynanan tüm maçları getirir
        """
        try:
            url = f"{self.base_url}/api/v1/sport/{sport}/matches/live"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            matches = []
            for match in data.get("events", []):
                match_data = {
                    "id": match.get("id"),
                    "home_team": match.get("homeTeam", {}).get("name"),
                    "away_team": match.get("awayTeam", {}).get("name"),
                    "home_score": match.get("homeScore", {}).get("current"),
                    "away_score": match.get("awayScore", {}).get("current"),
                    "status": self._convert_status(match.get("status", {}).get("type")),
                    "start_time": match.get("startTimestamp"),
                    "set_scores": self._extract_set_scores(match),
                    "tournament": match.get("tournament", {}).get("name"),
                }
                matches.append(match_data)
            
            logger.info(f"{len(matches)} canlı maç bulundu")
            return matches
            
        except requests.RequestException as e:
            logger.error(f"Canlı maçlar hatası: {e}")
            return []

    def _convert_status(self, sofascore_status: str) -> str:
        """Sofascore durumunu bizim formatımıza çevirir"""
        status_map = {
            "inprogress": "live",
            "finished": "finished",
            "notstarted": "upcoming",
            "postponed": "postponed",
            "cancelled": "postponed",
        }
        return status_map.get(sofascore_status, "upcoming")

    def _extract_set_scores(self, match: Dict) -> List[str]:
        """Set skorlarını çıkarır"""
        set_scores = []
        home_score = match.get("homeScore", {})
        away_score = match.get("awayScore", {})
        
        if home_score and away_score:
            period1_home = home_score.get("period1")
            period1_away = away_score.get("period1")
            if period1_home is not None and period1_away is not None:
                set_scores.append(f"{period1_home}-{period1_away}")
            
            period2_home = home_score.get("period2")
            period2_away = away_score.get("period2")
            if period2_home is not None and period2_away is not None:
                set_scores.append(f"{period2_home}-{period2_away}")
            
            period3_home = home_score.get("period3")
            period3_away = away_score.get("period3")
            if period3_home is not None and period3_away is not None:
                set_scores.append(f"{period3_home}-{period3_away}")
            
            period4_home = home_score.get("period4")
            period4_away = away_score.get("period4")
            if period4_home is not None and period4_away is not None:
                set_scores.append(f"{period4_home}-{period4_away}")
            
            period5_home = home_score.get("period5")
            period5_away = away_score.get("period5")
            if period5_home is not None and period5_away is not None:
                set_scores.append(f"{period5_home}-{period5_away}")
        
        return set_scores


def main():
    """Test fonksiyonu"""
    scraper = SofascoreScraper()
    
    # Kadınlar 2. Ligi (tournament_id: 30109)
    print("Kadınlar 2. Ligi maçları:")
    matches = scraper.get_tournament_matches("30109")
    for match in matches[:5]:  # İlk 5 maç
        print(f"{match['home_team']} vs {match['away_team']}: {match['home_score']}-{match['away_score']} ({match['status']})")
    
    print("\nCanlı voleybol maçları:")
    live_matches = scraper.get_live_matches()
    for match in live_matches[:5]:  # İlk 5 canlı maç
        print(f"{match['home_team']} vs {match['away_team']}: {match['home_score']}-{match['away_score']} ({match['status']})")


if __name__ == "__main__":
    main()
