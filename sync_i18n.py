import json
from pathlib import Path

base = Path('public/locales')
langs = ['en', 'es']
namespaces = ['auth', 'bolao', 'common', 'copa', 'errors', 'guia', 'home', 'profile', 'ranking', 'sedes']

def deep_sync(source, target):
    """Sync keys from source to target, preserving existing target keys."""
    changes = 0
    for k, v in source.items():
        if isinstance(v, dict):
            if k not in target or not isinstance(target[k], dict):
                target[k] = {}
            changes += deep_sync(v, target[k])
        else:
            if k not in target:
                target[k] = v # Use pt-BR value as fallback
                changes += 1
    return changes

total = 0
for ns in namespaces:
    pt_path = base / 'pt-BR' / f'{ns}.json'
    if not pt_path.exists():
        continue
    
    with open(pt_path, encoding='utf-8') as f:
        pt_data = json.load(f)
        
    for lang in langs:
        tgt_path = base / lang / f'{ns}.json'
        if not tgt_path.exists():
            tgt_data = {}
        else:
            with open(tgt_path, encoding='utf-8') as f:
                tgt_data = json.load(f)
        
        added = deep_sync(pt_data, tgt_data)
        if added > 0:
            total += added
            with open(tgt_path, 'w', encoding='utf-8') as f:
                json.dump(tgt_data, f, indent=2, ensure_ascii=False)
            print(f'Sync {ns} -> {lang}: added {added} keys')

print(f'Total keys synced: {total}')
