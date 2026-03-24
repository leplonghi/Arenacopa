import sys
c = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\boloes_read.txt', encoding='utf-8').read()
# Print first 400 lines only to avoid overflow
lines = c.splitlines()
output = '\n'.join(lines[:400])
sys.stdout.buffer.write(output.encode('ascii', errors='replace'))
print('\n... (truncated, total lines:', len(lines), ')')
