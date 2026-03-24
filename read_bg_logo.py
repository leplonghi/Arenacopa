import os, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\bg_logo_read.txt', 'w', encoding='utf-8')

files = [
    BASE + r'\components\FieldBackground.tsx',
    BASE + r'\App.tsx',
    BASE + r'\pages\Index.tsx',
]

# Also search for logo references
logo_files = []
for root, dirs, files_list in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', '__pycache__']]
    for f in files_list:
        if f.endswith(('.tsx', '.ts', '.css')):
            fp = os.path.join(root, f)
            try:
                content = open(fp, encoding='utf-8').read()
                if any(kw in content for kw in ['logo', 'Logo', 'splash', 'LoadingScreen', 'favicon', '.svg', '.png']):
                    logo_files.append((fp, content))
            except:
                pass

out.write('=== FILES WITH LOGO/SVG/PNG REFERENCES ===\n')
for fp, content in logo_files:
    rel = fp.replace(BASE, '')
    out.write(f'\n--- {rel} ---\n')
    for i, line in enumerate(content.splitlines(), 1):
        if any(kw in line for kw in ['logo', 'Logo', 'splash', 'LoadingScreen', 'svg', '.png', 'favicon', 'icon', '/public']):
            out.write(f'  {i}: {line.rstrip()}\n')

# Read FieldBackground fully
fb_path = BASE + r'\components\FieldBackground.tsx'
if os.path.exists(fb_path):
    out.write('\n\n=== FieldBackground.tsx FULL ===\n')
    out.write(open(fb_path, encoding='utf-8').read())

out.close()
print('done')
