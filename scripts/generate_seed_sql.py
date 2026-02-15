import re
import os

MOCK_DATA_PATH = "src/data/mockData.ts"
OUTPUT_SQL_PATH = "supabase/seed.sql"

def parse_mock_data():
    with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Parse Teams
    teams = []
    # Pattern: { code: "MEX", name: "México", flag: "🇲🇽", group: "A", confederation: "CONCACAF" }
    team_pattern = re.compile(r'\{\s*code:\s*"(.*?)",\s*name:\s*"(.*?)",\s*flag:\s*"(.*?)",\s*group:\s*"(.*?)",\s*confederation:\s*"(.*?)"\s*\}')
    for match in team_pattern.finditer(content):
        teams.append(match.groups())

    # Parse Stadiums
    stadiums = []
    # Pattern: { id: "metlife", name: "MetLife Stadium", city: "East Rutherford", country: "EUA", capacity: 82500, lat: 40.8135, lng: -74.0745, timezone: "America/New_York", climaHint: "Quente e úmido no verão" }
    stadium_pattern = re.compile(r'\{\s*id:\s*"(.*?)",\s*name:\s*"(.*?)",\s*city:\s*"(.*?)",\s*country:\s*"(.*?)",\s*capacity:\s*(\d+),\s*lat:\s*(.*?),\s*lng:\s*(.*?),\s*timezone:\s*"(.*?)",\s*climaHint:\s*"(.*?)"\s*\}')
    for match in stadium_pattern.finditer(content):
        stadiums.append(match.groups())

    # Parse Matches
    matches = []
    # Pattern: { id: "a1", homeTeam: "MEX", awayTeam: "RSA", date: "2026-06-11T15:00:00-04:00", stadium: "azteca", status: "scheduled", phase: "groups", group: "A" }
    # Note: group is optional, but in mockData it seems present for group matches.
    # We need to handle optional fields.
    # Let's extract likely match blocks first.
    # Matches are inside `export const matches: Match[] = [` ... `];`
    match_section = re.search(r'export const matches: Match\[\] = \[(.*?)\];', content, re.DOTALL)
    if match_section:
        match_block = match_section.group(1)
        # Regex for individual match object
        # Example: { id: "a1", homeTeam: "MEX", awayTeam: "RSA", date: "...", stadium: "...", status: "...", phase: "...", group: "A" }
        # Simple parsing by splitting by "}," might be safer or using a relaxed regex.
        # Let's use regex for known key-values.
        
        # Matches can have "group" optional.
        # Let's simply iterate line by line or split by `{`
        raw_matches = match_block.split('  {')
        for raw in raw_matches:
            if not raw.strip() or 'id:' not in raw: continue
            
            m_id = re.search(r'id:\s*"(.*?)"', raw).group(1)
            home = re.search(r'homeTeam:\s*"(.*?)"', raw).group(1)
            away = re.search(r'awayTeam:\s*"(.*?)"', raw).group(1)
            date = re.search(r'date:\s*"(.*?)"', raw).group(1)
            stadium = re.search(r'stadium:\s*"(.*?)"', raw).group(1)
            status = re.search(r'status:\s*"(.*?)"', raw).group(1)
            phase = re.search(r'phase:\s*"(.*?)"', raw).group(1)
            
            group_match = re.search(r'group:\s*"(.*?)"', raw)
            group = group_match.group(1) if group_match else None
            
            matches.append((m_id, home, away, date, stadium, status, phase, group))

    return teams, stadiums, matches

def generate_sql(teams, stadiums, matches):
    sql = []
    
    # Teams
    sql.append("-- Seeding Teams")
    sql.append("INSERT INTO public.teams (code, name, flag, group_id, confederation) VALUES")
    team_values = []
    for t in teams:
        team_values.append(f"('{t[0]}', '{t[1]}', '{t[2]}', '{t[3]}', '{t[4]}')")
    sql.append(",\n".join(team_values) + ";")
    sql.append("")

    # Stadiums
    sql.append("-- Seeding Stadiums")
    sql.append("INSERT INTO public.stadiums (id, name, city, country, capacity, lat, lng, timezone, climate_hint) VALUES")
    stad_values = []
    for s in stadiums:
        # id, name, city, country, capacity, lat, lng, timezone, climaHint
        stad_values.append(f"('{s[0]}', '{s[1]}', '{s[2]}', '{s[3]}', {s[4]}, {s[5]}, {s[6]}, '{s[7]}', '{s[8]}')")
    sql.append(",\n".join(stad_values) + ";")
    sql.append("")

    # Matches
    sql.append("-- Seeding Matches")
    # Note: Phase needs to be mapped if needed, but text is fine.
    # Group can be null.
    sql.append("INSERT INTO public.matches (id, home_team_code, away_team_code, date, stadium_id, status, phase, group_id) VALUES")
    match_values = []
    for m in matches:
        # id, home, away, date, stadium, status, phase, group
        grp = f"'{m[7]}'" if m[7] else "NULL"
        match_values.append(f"('{m[0]}', '{m[1]}', '{m[2]}', '{m[3]}', '{m[4]}', '{m[5]}', '{m[6]}', {grp})")
    
    sql.append(",\n".join(match_values) + ";")
    
    return "\n".join(sql)

if __name__ == "__main__":
    teams, stadiums, matches = parse_mock_data()
    sql_content = generate_sql(teams, stadiums, matches)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_SQL_PATH), exist_ok=True)
    
    with open(OUTPUT_SQL_PATH, "w", encoding="utf-8") as f:
        f.write(sql_content)
    
    print(f"Generated seed SQL at {OUTPUT_SQL_PATH}")
    print(f"Teams: {len(teams)}, Stadiums: {len(stadiums)}, Matches: {len(matches)}")
