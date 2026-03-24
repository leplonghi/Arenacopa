import os

base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa'

files = [
    r'src\pages\Index.tsx',
    r'src\components\copa\NoticiasTab.tsx',
    r'src\pages\Boloes.tsx',
    r'src\components\copa\SimulacaoTab.tsx',
    r'src\components\copa\BolaoDetail.tsx',
    r'src\pages\Perfil.tsx',
    r'src\components\copa\CalendarioTab.tsx',
    r'src\components\copa\GruposTab.tsx',
    r'src\components\copa\RankingTab.tsx',
]

out = open(os.path.join(base, 'all_files_dump.txt'), 'w', encoding='utf-8')

for rel in files:
    path = os.path.join(base, rel)
    if not os.path.exists(path):
        out.write(f'\n\n=== FILE NOT FOUND: {rel} ===\n')
        continue
    f = open(path, encoding='utf-8')
    content = f.read()
    f.close()
    lines = content.split('\n')
    out.write(f'\n\n=== FILE: {rel} ({len(lines)} lines) ===\n')
    for i, l in enumerate(lines, 1):
        out.write(f'{i}: {l}\n')

out.close()
print('done')
