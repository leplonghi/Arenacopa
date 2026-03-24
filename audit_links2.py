import os, re, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\link_audit2.txt', 'w', encoding='utf-8')

# ── Find App.tsx / router config ──────────────────────────────────────────────
for fp in [BASE + r'\App.tsx', BASE + r'\main.tsx', BASE + r'\router.tsx',
           BASE + r'\routes.tsx', BASE + r'\routing.tsx']:
    if os.path.exists(fp):
        content = open(fp, encoding='utf-8').read()
        out.write(f'=== {os.path.basename(fp)} ===\n{content}\n\n')

# ── Key pages: Boloes, BolaoDetail, SimulacaoTab, Copa ───────────────────────
key_files = [
    r'\pages\Boloes.tsx',
    r'\pages\BolaoDetail.tsx',
    r'\pages\Copa.tsx',
    r'\pages\Index.tsx',
    r'\components\copa\SimulacaoTab.tsx',
    r'\components\copa\CopaOverview.tsx',
    r'\components\Layout.tsx',
    r'\components\FabWithPending.tsx',
    r'\components\BolaoExpressSheet.tsx',
]

for rel in key_files:
    fp = BASE + rel
    if os.path.exists(fp):
        content = open(fp, encoding='utf-8').read()
        out.write(f'\n\n=== {rel} ===\n')
        # only print lines with navigation-related content
        for i, line in enumerate(content.splitlines(), 1):
            if any(kw in line for kw in ['to="', "to='", 'to={`', 'navigate(', 'href=', 'Link ', 'NavLink', 'useNavigate', 'window.location', '<Route', 'path=']):
                out.write(f'  {i}: {line.rstrip()}\n')
    else:
        out.write(f'\n\n=== {rel} === NOT FOUND\n')

out.close()
print('done')
