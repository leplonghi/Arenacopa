import asyncio
import aiohttp
import re
import json
import os

# Map FIFA codes to search queries for REST Countries API
# Some FIFA codes match ISO 3166-1 alpha-3, but not all.
TEAM_MAPPING = {
    "MEX": "Mexico", "RSA": "South Africa", "KOR": "South Korea",
    "CAN": "Canada", "QAT": "Qatar", "SUI": "Switzerland",
    "BRA": "Brazil", "MAR": "Morocco", "HAI": "Haiti", "SCO": "Scotland",
    "USA": "United States", "PAR": "Paraguay", "AUS": "Australia",
    "GER": "Germany", "CUR": "Curacao", "CIV": "Ivory Coast", "ECU": "Ecuador",
    "NED": "Netherlands", "JPN": "Japan", "TUN": "Tunisia",
    "BEL": "Belgium", "EGY": "Egypt", "IRN": "Iran", "NZL": "New Zealand",
    "ESP": "Spain", "CPV": "Cape Verde", "SAU": "Saudi Arabia", "URU": "Uruguay",
    "FRA": "France", "SEN": "Senegal", "NOR": "Norway",
    "ARG": "Argentina", "ALG": "Algeria", "AUT": "Austria", "JOR": "Jordan",
    "POR": "Portugal", "UZB": "Uzbekistan", "COL": "Colombia",
    "ENG": "United Kingdom", # England is part of UK
    "CRO": "Croatia", "GHA": "Ghana", "PAN": "Panama"
}

# Teams that are placeholders or special cases
IGNORE_CODES = ["EPD", "EPA", "EPC", "EPB", "FP2", "FP1"]

async def fetch_country_data(session, code, query):
    url = f"https://restcountries.com/v3.1/name/{query}?fullText=true"
    # Special case handling for "United Kingdom" to get specifics if needed, 
    # but REST countries returns generic UK info. 
    # For Scotland/England, we might need manual override or accept UK data.
    if code in ["SCO", "ENG", "WAL"]:
        url = "https://restcountries.com/v3.1/name/United Kingdom"

    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                country = data[0]
                
                # Extract simple data
                capital = country.get('capital', ['N/A'])[0]
                population = country.get('population', 0)
                
                currencies = country.get('currencies', {})
                currency = ", ".join([c['name'] for c in currencies.values()])
                
                languages = country.get('languages', {})
                language = ", ".join(languages.values())
                
                # Format population (e.g. 1000000 -> 1 milhão)
                pop_formatted = f"{population:,}"
                if population > 1000000:
                    pop_formatted = f"{population / 1000000:.1f} milhões"
                
                return {
                    "code": code,
                    "demographics": {
                        "capital": capital,
                        "population": pop_formatted,
                        "currency": currency,
                        "language": language
                    }
                }
            else:
                print(f"Error fetching {query} ({code}): Status {response.status}")
                return None
    except Exception as e:
        print(f"Exception fetching {query} ({code}): {e}")
        return None

async def main():
    # Read mockData.ts to get the list of teams dynamically (optional, but robust)
    # For now, we use the predefined MAPPING keys which match the file.
    
    results = {}
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for code, query in TEAM_MAPPING.items():
            if code in IGNORE_CODES:
                continue
            tasks.append(fetch_country_data(session, code, query))
        
        responses = await asyncio.gather(*tasks)
        
        for resp in responses:
            if resp:
                results[resp['code']] = resp['demographics']
                
    # Output the result as JSON
    output_path = "src/data/fetched_demographics.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Data saved to {output_path}")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
