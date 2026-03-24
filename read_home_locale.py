import json, os

base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\public\locales'

# Read home.json and noticias-related keys from copa.json and bolao.json
result = {}
for lang in ['pt-BR', 'en', 'es']:
    result[lang] = {}
    for ns in ['home', 'copa', 'bolao', 'common']:
        p = os.path.join(base, lang, f'{ns}.json')
        if os.path.exists(p):
            with open(p, encoding='utf-8') as f:
                result[lang][ns] = json.load(f)

# Print keys only (structure)
for lang in result:
    print(f'\n--- {lang} ---')
    for ns in result[lang]:
        print(f'  [{ns}]')
        data = result[lang][ns]
        def print_keys(d, prefix=''):
            for k, v in d.items():
                if isinstance(v, dict):
                    print_keys(v, prefix + k + '.')
                else:
                    val_preview = str(v)[:60].encode('ascii','replace').decode('ascii')
                    print(f'    {prefix}{k}: {val_preview}')
        print_keys(data)
