import re

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
results = []

# ══════════════════════════════════════════════════════════════════════════════
# FIX 1: BolaoCard in Boloes.tsx — add useTranslation hook
# ══════════════════════════════════════════════════════════════════════════════
fp = BASE + r'\pages\Boloes.tsx'
with open(fp, encoding='utf-8') as fh:
    src = fh.read()

old = 'function BolaoCard({ bolao, href }: { bolao: BolaoRow; href: string }) {\n\n  return ('
new = ('function BolaoCard({ bolao, href }: { bolao: BolaoRow; href: string }) {\n'
       '  const { t } = useTranslation(\'bolao\');\n'
       '\n  return (')

if 'function BolaoCard' in src and "useTranslation('bolao')" not in src.split('function BolaoCard')[1][:200]:
    if old in src:
        src = src.replace(old, new, 1)
        results.append('OK BolaoCard: inserted useTranslation hook (exact match)')
    else:
        # flexible: find "function BolaoCard({" and insert hook after first {
        pattern = r'(function BolaoCard\([^)]+\)\s*\{)'
        match = re.search(pattern, src)
        if match:
            old_sig = match.group(1)
            new_sig = old_sig + "\n  const { t } = useTranslation('bolao');"
            src = src.replace(old_sig, new_sig, 1)
            results.append('OK BolaoCard: inserted useTranslation hook (regex match)')
        else:
            results.append('MISS BolaoCard function signature not found')
else:
    results.append('SKIP BolaoCard already has hook or not found')

with open(fp, 'w', encoding='utf-8') as fh:
    fh.write(src)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 2: CreateSimModal in SimulacaoTab.tsx — add useTranslation hook
# ══════════════════════════════════════════════════════════════════════════════
fp2 = BASE + r'\components\copa\SimulacaoTab.tsx'
with open(fp2, encoding='utf-8') as fh:
    src2 = fh.read()

# Check if CreateSimModal has its own hook
parts = src2.split('function CreateSimModal(')
if len(parts) > 1:
    modal_body = parts[1]
    # Find the opening { of the function body
    body_start = modal_body.find(') {')
    if body_start != -1:
        before_hook = modal_body[:body_start + 200]
        if "useTranslation('copa')" in before_hook:
            results.append('SKIP CreateSimModal already has hook')
        else:
            # Insert hook after the first state declaration
            old_state = ('  const [name, setName] = useState("");\n'
                        '  const [selected, setSelected] = useState<Set<string>>(new Set(allGroupsList));')
            new_state = ('  const { t } = useTranslation(\'copa\');\n'
                        '  const [name, setName] = useState("");\n'
                        '  const [selected, setSelected] = useState<Set<string>>(new Set(allGroupsList));')
            if old_state in src2:
                src2 = src2.replace(old_state, new_state, 1)
                results.append('OK CreateSimModal: inserted useTranslation hook')
            else:
                results.append('MISS CreateSimModal state block not found')
    else:
        results.append('MISS CreateSimModal body start not found')
else:
    results.append('MISS CreateSimModal function not found')

with open(fp2, 'w', encoding='utf-8') as fh:
    fh.write(src2)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 3: ActionOfDay in Index.tsx — replace <a href> with <Link to>
# ══════════════════════════════════════════════════════════════════════════════
fp3 = BASE + r'\pages\Index.tsx'
with open(fp3, encoding='utf-8') as fh:
    src3 = fh.read()

fixes = [
    # Pending palpites block
    (
        '<a href={firstBolaoWithPending ? `/boloes/${firstBolaoWithPending}` : "/boloes"}>',
        '<Link to={firstBolaoWithPending ? `/boloes/${firstBolaoWithPending}` : "/boloes"}>'
    ),
    # Close tag for pending block
    (
        '</a>\n    );\n  }\n\n  if (!hasAnyBolao)',
        '</Link>\n    );\n  }\n\n  if (!hasAnyBolao)'
    ),
    # No bolao block
    (
        '<a href="/boloes/criar">\n        <div className="flex items-center gap-4 rounded-[22px] bg-gradient-to-r from-blue-500',
        '<Link to="/boloes/criar">\n        <div className="flex items-center gap-4 rounded-[22px] bg-gradient-to-r from-blue-500'
    ),
    # Close tag for no bolao block
    (
        '</a>\n    );\n  }\n\n  if (hasTodayMatch)',
        '</Link>\n    );\n  }\n\n  if (hasTodayMatch)'
    ),
    # Today match block
    (
        '<a href="/copa/calendario">\n        <div className="flex items-center gap-4 rounded-[22px] bg-gradient-to-r from-orange-500',
        '<Link to="/copa/calendario">\n        <div className="flex items-center gap-4 rounded-[22px] bg-gradient-to-r from-orange-500'
    ),
    # Close tag for today match block
    (
        '</a>\n    );\n  }\n\n  return null;\n}',
        '</Link>\n    );\n  }\n\n  return null;\n}'
    ),
]

fix_count = 0
for old_str, new_str in fixes:
    if old_str in src3:
        src3 = src3.replace(old_str, new_str, 1)
        fix_count += 1

if fix_count > 0:
    results.append(f'OK ActionOfDay: fixed {fix_count} <a href> -> <Link to>')
else:
    # Try a broader regex approach
    # Replace all <a href="/boloes... and <a href="/copa... with <Link to=
    count = 0
    def replace_internal_a(m):
        global count
        tag = m.group(0)
        if 'href="/' in tag or "href={`/" in tag or 'href={firstBolao' in tag:
            count += 1
            return tag.replace('<a href=', '<Link to=')
        return tag
    # Only inside ActionOfDay function — find it
    if 'function ActionOfDay(' in src3:
        func_start = src3.index('function ActionOfDay(')
        func_end = src3.index('\nconst Index = ', func_start)
        func_body = src3[func_start:func_end]
        # Replace <a href with <Link to, and </a> with </Link> for internal links
        new_body = re.sub(r'<a href=(\{[^}]+\}|"[^"]*")', lambda m: '<Link to=' + m.group(1), func_body)
        new_body = new_body.replace('</a>', '</Link>')
        if new_body != func_body:
            src3 = src3[:func_start] + new_body + src3[func_end:]
            results.append('OK ActionOfDay: fixed <a href> -> <Link to> via regex')
        else:
            results.append('SKIP ActionOfDay: no <a href> found or already fixed')
    else:
        results.append('MISS ActionOfDay function not found')

with open(fp3, 'w', encoding='utf-8') as fh:
    fh.write(src3)

# ══════════════════════════════════════════════════════════════════════════════
# REPORT
# ══════════════════════════════════════════════════════════════════════════════
for r in results:
    print(r.encode('ascii', errors='replace').decode('ascii'))
