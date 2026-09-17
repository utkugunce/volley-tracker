import json
from pathlib import Path
from collections import defaultdict

cities_dir = Path("data/cities")
mappings_file = Path("data/volleybox-mappings.json")

with open(mappings_file, "r", encoding="utf-8") as f:
    mappings_data = json.load(f)

mappings = mappings_data.get("mappings", [])

mapped_names = set()
for m in mappings:
    n = (m.get("internal_name") or "").strip().lower()
    cat = (m.get("internal_category") or "").strip().lower()
    city = (m.get("city_slug") or m.get("city") or "").strip().lower()
    mapped_names.add(n)
    if city:
        mapped_names.add((n, city))
    for alias in m.get("aliases", []):
        al = alias.strip().lower()
        mapped_names.add(al)
        if city:
            mapped_names.add((al, city))

all_teams_by_city = defaultdict(set)
team_categories = defaultdict(set)

for fpath in cities_dir.glob("*.json"):
    with open(fpath, "r", encoding="utf-8") as f:
        cdata = json.load(f)
    city_name = cdata.get("city") or fpath.stem
    city_slug = fpath.stem.lower()
    for m in cdata.get("matches", []):
        h = m.get("home_team", "").strip()
        a = m.get("away_team", "").strip()
        cat = m.get("category", "").strip()
        if h:
            all_teams_by_city[city_slug].add(h)
            team_categories[(h, city_slug)].add(cat)
        if a:
            all_teams_by_city[city_slug].add(a)
            team_categories[(a, city_slug)].add(cat)
    for grp, tlist in cdata.get("standings", {}).items():
        for item in tlist:
            t = item.get("team", "").strip()
            if t:
                all_teams_by_city[city_slug].add(t)
                team_categories[(t, city_slug)].add(grp)

total_teams = sum(len(ts) for ts in all_teams_by_city.values())
unmapped = []

for city_slug, teams in sorted(all_teams_by_city.items()):
    for t in sorted(teams):
        tn = t.lower()
        if tn not in mapped_names and (tn, city_slug) not in mapped_names:
            cats = list(team_categories.get((t, city_slug), []))
            unmapped.append({"team": t, "city": city_slug, "categories": cats})

print(f"Total unique teams across all cities: {total_teams}")
print(f"Unmapped teams count: {len(unmapped)}")
print("\n--- UNMAPPED TEAMS ---")
for item in unmapped:
    cats_str = ", ".join(item["categories"])
    print(f"[{item['city']}] {item['team']} ({cats_str})")
