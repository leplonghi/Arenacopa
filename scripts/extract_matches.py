
import re
import json

def extract_matches():
    file_path = r'c:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCUP\ArenaCUP\src\data\mockData.ts'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the matches array
    # It starts with export const matches: Match[] = [ and ends with ];
    start_match = re.search(r'export const matches: Match\[\] = \[', content)
    if not start_match:
        print("Could not find matches array")
        return []

    # Find the end of the array
    stack = 1
    i = start_match.end()
    while stack > 0 and i < len(content):
        if content[i] == '[':
            stack += 1
        elif content[i] == ']':
            stack -= 1
        i += 1
    
    matches_content = content[start_match.end():i-1].strip()
    
    # Simple regex to extract objects
    # This is tricky because objects can have nested objects (though matches don't seem to)
    # Each match is { id: "...", ... }
    match_objs = re.findall(r'\{([^{}]+)\}', matches_content)
    
    matches_data = []
    for obj_str in match_objs:
        data = {}
        # Simple kv pair extractor
        lines = obj_str.split(',')
        for line in lines:
            line = line.strip()
            if not line: continue
            if ':' in line:
                k, v = line.split(':', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k == 'homeScore' or k == 'awayScore':
                    try:
                        data[k] = int(v)
                    except:
                        data[k] = None
                else:
                    data[k] = v
        matches_data.append(data)
    
    return matches_data

def generate_sql():
    matches = extract_matches()
    if not matches:
        return

    phase_map = {
        'groups': 'group',
        'round-of-32': 'round_of_32',
        'round-of-16': 'round_of_16',
        'quarter': 'qf',
        'semi': 'sf',
        'third': 'third_place',
        'final': 'final'
    }

    sql_lines = []
    for m in matches:
        match_id = m.get('id', '')
        # Check for phase mapping
        raw_phase = m.get('phase', '')
        stage = phase_map.get(raw_phase, raw_phase)
        group_id = m.get('group', 'NULL')
        if group_id != 'NULL':
            group_id = f"'{group_id}'"
        
        match_date = m.get('date', '')
        home_team = m.get('homeTeam', '')
        away_team = m.get('awayTeam', '')
        
        home_score = m.get('homeScore')
        away_score = m.get('awayScore')
        
        home_score_str = str(home_score) if home_score is not None else 'NULL'
        away_score_str = str(away_score) if away_score is not None else 'NULL'
        
        stadium = m.get('stadium', '')
        status = m.get('status', 'scheduled')
        
        line = f"('{match_id}', '{stage}', {group_id}, '{match_date}', '{home_team}', '{away_team}', {home_score_str}, {away_score_str}, '{stadium}', '{status}')"
        sql_lines.append(line)

    sql = "INSERT INTO public.matches (id, stage, group_id, match_date, home_team_code, away_team_code, home_score, away_score, venue_id, status) VALUES\n"
    sql += ",\n".join(sql_lines)
    sql += ";"
    
    print(sql)

if __name__ == "__main__":
    generate_sql()
