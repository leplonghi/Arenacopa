import sys
c = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\bg_logo_read.txt', encoding='utf-8').read()
sys.stdout.buffer.write(c.encode('ascii', errors='replace'))
