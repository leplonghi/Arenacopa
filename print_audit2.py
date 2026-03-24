import sys
c = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\link_audit2.txt', encoding='utf-8').read()
sys.stdout.buffer.write(c.encode('ascii', errors='replace'))
