import json
import os
from pathlib import Path

base = Path('public/locales')
langs = ['pt-BR', 'en', 'es']
namespaces = ['auth', 'bolao', 'common', 'copa', 'errors', 'guia', 'home', 'profile', 'ranking', 'sedes']

def get_keys(obj, prefix=''):
    keys = []
    for k, v in obj.items():
        full = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            keys.extend(get_keys(v, full))
        else:
            keys.append(full)
    return set(keys)

print('=== i18n KEY AUDIT ===\n')
total_missing = 0
all_issues = {}

for ns in namespaces:
    data = {}
    for lang in langs:
        fp = base / lang / f'{ns}.json'
        if fp.exists():
            with open(fp, encoding='utf-8') as f:
                data[lang] = get_keys(json.load(f))
        else:
            data[lang] = set()
            print(f'MISSING FILE: {lang}/{ns}.json')

    ref = data['pt-BR']
    ns_issues = []
    for lang in ['en', 'es']:
        missing = ref - data[lang]
        extra = data[lang] - ref
        if missing:
            ns_issues.append((lang, 'MISSING', sorted(missing)))
            total_missing += len(missing)
        if extra:
            ns_issues.append((lang, 'EXTRA', sorted(extra)))

    sizes = {lang: len(data[lang]) for lang in langs}
    status = 'OK' if not ns_issues else 'ISSUES'
    print(f'[{status}] {ns}: pt-BR={sizes["pt-BR"]} | en={sizes["en"]} | es={sizes["es"]}')
    for lang, kind, keys in ns_issues:
        print(f'  [{lang}] {kind} ({len(keys)}):')
        for k in keys[:10]:
            print(f'    - {k}')
        if len(keys) > 10:
            print(f'    ... and {len(keys)-10} more')
    if ns_issues:
        all_issues[ns] = ns_issues

print(f'\n=== TOTAL MISSING KEYS (en+es vs pt-BR): {total_missing} ===')
print(f'=== NAMESPACES WITH ISSUES: {list(all_issues.keys())} ===')
