f = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\components\copa\bolao\JogosTab.tsx', encoding='utf-8')
lines = f.readlines()
f.close()
out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\jogos_read2.txt', 'w', encoding='utf-8')
out.write('--- LINES 100-160 (state declarations) ---\n')
for i, l in enumerate(lines[100:160], 101):
    out.write(f'{i}: {l}')
out.write('\n--- LINES 508-600 (match card JSX) ---\n')
for i, l in enumerate(lines[508:620], 509):
    out.write(f'{i}: {l}')
out.close()
print('done')
