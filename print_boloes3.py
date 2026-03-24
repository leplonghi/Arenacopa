import sys
c = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\boloes_read.txt', encoding='utf-8').read()
lines = c.splitlines()
# Print SimulacaoTab section (starts around line 580 in the combined file)
# Find where SimulacaoTab starts
for i, l in enumerate(lines):
    if 'SimulacaoTab.tsx' in l:
        sim_start = i
        break
output = '\n'.join(lines[sim_start:sim_start+200])
sys.stdout.buffer.write(output.encode('ascii', errors='replace'))
print('\n... sim_start line:', sim_start)
