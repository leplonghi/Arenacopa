import sys
c = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\news_read.txt', encoding='utf-8').read()
lines = c.splitlines()
sys.stdout.buffer.write('\n'.join(lines[:300]).encode('ascii', errors='replace'))
print(f'\n... total {len(lines)} lines')
