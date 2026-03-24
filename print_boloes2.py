import sys
c = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\boloes_read.txt', encoding='utf-8').read()
lines = c.splitlines()
# Print lines 400-600 of the file (the BolaoCard section + SimulacaoTab start)
output = '\n'.join(lines[400:750])
sys.stdout.buffer.write(output.encode('ascii', errors='replace'))
print('\n... total lines:', len(lines))
