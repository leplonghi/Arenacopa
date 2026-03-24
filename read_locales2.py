import os, json

base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\public\locales'

# Write to the shared mnt path Claude can read
out_path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\locales_dump.txt'

lines = []
for lang in ['pt-BR', 'en', 'es']:
    lang_dir = os.path.join(base, lang)
    if not os.path.exists(lang_dir):
        lines.append(f'=== MISSING: {lang} ===')
        continue
    for fname in sorted(os.listdir(lang_dir)):
        path = os.path.join(lang_dir, fname)
        with open(path, encoding='utf-8') as f:
            content = f.read()
        lines.append(f'\n=== {lang}/{fname} ===')
        lines.append(content)

result = '\n'.join(lines)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(result)
print(f'Written {len(result)} chars, {result.count(chr(10))} lines')
