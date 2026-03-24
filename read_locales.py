import os, json

base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\public\locales'
out_path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\locales_dump.txt'

out = open(out_path, 'w', encoding='utf-8')

for lang in ['pt-BR', 'en', 'es']:
    lang_dir = os.path.join(base, lang)
    if not os.path.exists(lang_dir):
        out.write(f'=== MISSING: {lang} ===\n')
        continue
    for fname in sorted(os.listdir(lang_dir)):
        path = os.path.join(lang_dir, fname)
        f = open(path, encoding='utf-8')
        content = f.read()
        f.close()
        out.write(f'\n=== {lang}/{fname} ===\n{content}\n')

out.close()
print('done')
