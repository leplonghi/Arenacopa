import os, re, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\link_audit3.txt', 'w', encoding='utf-8')

key_files = [
    r'\components\BolaoCard.tsx',
    r'\components\copa\bolao\BolaoTabs.tsx',
    r'\components\copa\bolao\RankingTab.tsx',
    r'\components\copa\bolao\JogosTab.tsx',
    r'\components\copa\ChavesTab.tsx',
    r'\components\copa\GruposTab.tsx',
]

for rel in key_files:
    fp = BASE + rel
    if os.path.exists(fp):
        content = open(fp, encoding='utf-8').read()
        out.write(f'\n\n=== {rel} ===\n')
        for i, line in enumerate(content.splitlines(), 1):
            if any(kw in line for kw in ['to="', "to='", 'to={`', 'navigate(', 'href=', 'Link ', 'NavLink', '<a ', 'useNavigate', 'window.location']):
                out.write(f'  {i}: {line.rstrip()}\n')
    else:
        out.write(f'\n\n=== {rel} === NOT FOUND\n')

# Also check all files for /copa/noticias, /copa/historia, /copa/sedes as those redirect
out.write('\n\n=== Search for specific broken patterns ===\n')
patterns_to_check = [
    '/copa/noticias',
    '/copa/historia', 
    '/copa/sedes',
    '/guia/noticias',
    '/guia/historia',
    'to="/grupos',
    'to="/guia',
    '/boloes/criar',
    '/regras',
]

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', '__pycache__']]
    for fname in files:
        if not fname.endswith(('.tsx', '.ts')): continue
        fp = os.path.join(root, fname)
        try:
            content = open(fp, encoding='utf-8').read()
            rel = fp.replace(BASE, '')
            for pat in patterns_to_check:
                if pat in content:
                    for i, line in enumerate(content.splitlines(), 1):
                        if pat in line:
                            out.write(f'  {rel}:{i}: {line.strip()}\n')
        except: pass

out.close()
print('done')
