import os, sys

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\news_read.txt', 'w', encoding='utf-8')

files = [
    BASE + r'\hooks\useRealtimeNews.ts',
    BASE + r'\hooks\useRealtimeNews.tsx',
    BASE + r'\components\copa\NoticiasTab.tsx',
    BASE + r'\components\copa\NewsFeed.tsx',
]

for fp in files:
    if os.path.exists(fp):
        out.write(f'=== {os.path.basename(fp)} ===\n{open(fp, encoding="utf-8").read()}\n\n')
    else:
        out.write(f'=== {os.path.basename(fp)} === NOT FOUND\n\n')

# Also search for news-related services
for root, dirs, files_list in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', '__pycache__']]
    for f in files_list:
        if 'news' in f.lower() or 'noticia' in f.lower():
            fp = os.path.join(root, f)
            out.write(f'=== {f} (found at {fp.replace(BASE,"")}) ===\n')
            out.write(open(fp, encoding='utf-8').read())
            out.write('\n\n')

out.close()
print('done')
