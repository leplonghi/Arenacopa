f = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\components\copa\bolao\JogosTab.tsx', encoding='utf-8')
lines = f.readlines()
f.close()
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\jogos_read.txt', 'w', encoding='utf-8')
out.write('--- LINES 1-60 ---\n')
for i, l in enumerate(lines[0:60], 1):
    out.write(f'{i}: {l}')
out.write('\n--- LINES 260-360 ---\n')
for i, l in enumerate(lines[260:360], 261):
    out.write(f'{i}: {l}')
out.write('\n--- LINES 460-510 ---\n')
for i, l in enumerate(lines[460:510], 461):
    out.write(f'{i}: {l}')
out.close()
print('done', len(lines), 'total lines')
