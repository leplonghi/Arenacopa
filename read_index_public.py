import os, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa'
out = open(BASE + r'\index_public_read.txt', 'w', encoding='utf-8')

# Read index.html
for p in [BASE + r'\index.html', BASE + r'\public\index.html']:
    if os.path.exists(p):
        out.write(f'=== {p} ===\n{open(p, encoding="utf-8").read()}\n\n')

# List public folder
out.write('\n=== PUBLIC FOLDER CONTENTS ===\n')
pub = BASE + r'\public'
for root, dirs, files in os.walk(pub):
    dirs[:] = [d for d in dirs if d not in ['locales', 'images']]
    rel = root.replace(pub, '')
    for f in files:
        size = os.path.getsize(os.path.join(root, f))
        out.write(f'  {rel}\\{f}  ({size} bytes)\n')

# Read LoadingScreen in App.tsx
app_src = open(BASE + r'\src\App.tsx', encoding='utf-8').read()
idx = app_src.find('LoadingScreen')
block = app_src[idx-20:idx+500]
out.write('\n=== App.tsx LoadingScreen ===\n')
out.write(block)

out.close()
print('done')
