import os, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa'
out = open(BASE + r'\manifest_read.txt', 'w', encoding='utf-8')

for f in ['manifest.json', 'sw.js', 'capacitor.config.ts', 'capacitor.config.json']:
    p = os.path.join(BASE, 'public', f)
    if not os.path.exists(p):
        p = os.path.join(BASE, f)
    if os.path.exists(p):
        out.write(f'=== {f} ===\n{open(p, encoding="utf-8", errors="replace").read()}\n\n')
    else:
        out.write(f'=== {f} === NOT FOUND\n\n')

# Also check if campo-bg.png exists in public/images
img_dir = os.path.join(BASE, 'public', 'images')
out.write('=== public/images/ ===\n')
if os.path.exists(img_dir):
    for f in os.listdir(img_dir):
        size = os.path.getsize(os.path.join(img_dir, f))
        out.write(f'  {f}  ({size} bytes)\n')
else:
    out.write('  (directory does not exist)\n')

out.close()
print('done')
