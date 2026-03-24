import os, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa'
out = open(BASE + r'\cards_read.txt', 'w', encoding='utf-8')

files = [
    BASE + r'\src\components\BolaoCard.tsx',
    BASE + r'\firebase.json',
    BASE + r'\src\pages\Index.tsx',
]

for fp in files:
    if os.path.exists(fp):
        content = open(fp, encoding='utf-8').read()
        out.write(f'\n\n=== {os.path.basename(fp)} ===\n{content}\n')
    else:
        out.write(f'\n\n=== {os.path.basename(fp)} === NOT FOUND\n')

out.close()
print('done')
