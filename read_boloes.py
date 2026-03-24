import os, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\boloes_read.txt', 'w', encoding='utf-8')

files = [
    BASE + r'\pages\Boloes.tsx',
    BASE + r'\components\copa\SimulacaoTab.tsx',
]
for fp in files:
    content = open(fp, encoding='utf-8').read()
    out.write(f'\n\n=== {os.path.basename(fp)} ===\n{content}\n')
out.close()
print('done')
