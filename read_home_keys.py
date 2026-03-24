import json, os

base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\public\locales'

for lang in ['pt-BR', 'en', 'es']:
    print(f'\n=== {lang} home.json ===')
    p = os.path.join(base, lang, 'home.json')
    if os.path.exists(p):
        with open(p, encoding='utf-8') as f:
            d = json.load(f)
        # flat print
        def pr(obj, pfx=''):
            for k, v in obj.items():
                if isinstance(v, dict): pr(v, pfx+k+'.')
                else: print(f'  {pfx}{k} = {str(v).encode("ascii","replace").decode()[:80]}')
        pr(d)
    else:
        print('  MISSING')
