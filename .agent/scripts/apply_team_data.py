import json
import re

def main():
    try:
        with open("src/data/fetched_demographics.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("fetched_demographics.json not found.")
        return

    with open("src/data/mockData.ts", "r", encoding="utf-8") as f:
        content = f.read()
    
    updated_count = 0
    
    for code, demo in data.items():
        # Prepare the demographics string
        # format: demographics: { capital: "X", population: "Y", currency: "Z", language: "W" }
        demo_str = f'demographics: {{ capital: "{demo["capital"]}", population: "{demo["population"]}", currency: "{demo["currency"]}", language: "{demo["language"]}" }}'
        
        # Regex for single-line team definitions without demographics
        # Matches: { code: "CODE", ... no demographics ... }
        # We look for the closing brace `}` and insert before it.
        # Be careful not to match if demographics already exists.
        
        # Pattern:
        # { code: "CODE", (anything except }) }
        
        pattern = r'(\{ code: "' + code + r'",(?:(?!demographics).)*?)(\s*\},?)'
        
        # Check if we find it
        match = re.search(pattern, content)
        
        if match:
            # Found a team without demographics (likely single line)
            # Group 1 is the part before closing brace
            # Group 2 is the closing brace part
            
            # We want to format it nicely.
            # Convert to multiline or just append?
            # Appending inline for now to be safe with TypeScript parsing, 
            # or maybe add a newline.
            
            # Formatted replacement:
            # { code: "CODE", ..., 
            #   demographics: { ... }
            # },
            
            # But converting to multiline with regex replace is tricky with indentation.
            # Let's just append inline first or try to match indentation.
            
            current_text = match.group(0)
            # If it keeps it single line:
            # new_text = match.group(1) + ", " + demo_str + match.group(2)
            
            # Let's try to make it look decent.
            # Insert a newline and indentation.
            new_text = f'{match.group(1)},\n    {demo_str}\n  {match.group(2).strip()}'
            
            # Replace only the first occurrence (should be unique by code)
            content = content.replace(current_text, new_text)
            updated_count += 1
            
    with open("src/data/mockData.ts", "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Updated {updated_count} teams in mockData.ts")

if __name__ == "__main__":
    main()
