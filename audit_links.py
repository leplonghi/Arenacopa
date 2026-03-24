import os, re

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
ROUTER = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'

# ── 1. Collect all defined routes from App.tsx / router files ─────────────────
defined_routes = set()
route_files = []
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist']]
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            route_files.append(os.path.join(root, f))

route_pattern = re.compile(r'path=["\']([^"\']+)["\']')
navigate_pattern = re.compile(r'(?:to|navigate)\s*=?\s*["\'\`]([/][^"\'`\s{]+)["\'\`]')
link_pattern = re.compile(r'<(?:Link|NavLink)[^>]+to=["\'\{]([^"\'}\s]+)["\'\}]')

out = open(r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\link_audit.txt', 'w', encoding='utf-8')

# Collect routes
for fp in route_files:
    try:
        content = open(fp, encoding='utf-8').read()
        for m in route_pattern.finditer(content):
            r = m.group(1)
            if not r.startswith('http'):
                defined_routes.add(r)
    except:
        pass

out.write('=== DEFINED ROUTES ===\n')
for r in sorted(defined_routes):
    out.write(f'  {r}\n')

# Collect all Link/navigate usages
out.write('\n=== ALL LINK/NAVIGATE USAGES ===\n')
all_links = []
for fp in route_files:
    try:
        content = open(fp, encoding='utf-8').read()
        rel_path = fp.replace(BASE, '').replace('\\', '/')
        found = []
        for m in link_pattern.finditer(content):
            path = m.group(1)
            if path.startswith('/') and not path.startswith('//'):
                found.append(path)
        for m in navigate_pattern.finditer(content):
            path = m.group(1)
            if path.startswith('/'):
                found.append(path)
        if found:
            out.write(f'\n{rel_path}:\n')
            for p in sorted(set(found)):
                # strip query params and dynamic segments for matching
                base_path = p.split('?')[0]
                # normalize dynamic segments: /bolao/abc -> /bolao/:id
                norm = re.sub(r'/[a-zA-Z0-9_-]{10,}', '/:id', base_path)
                all_links.append((rel_path, p, base_path, norm))
                out.write(f'  {p}\n')
    except:
        pass

# Check for likely broken links
out.write('\n\n=== POTENTIALLY BROKEN LINKS ===\n')
broken = []
for rel_path, p, base_path, norm in all_links:
    # skip external
    if p.startswith('http'):
        continue
    # check if base_path matches any defined route
    matched = False
    for route in defined_routes:
        # convert route params :param to regex
        route_re = re.sub(r':[^/]+', '[^/]+', route)
        route_re = '^' + route_re + '(/.*)?$'
        if re.match(route_re, base_path):
            matched = True
            break
    if not matched:
        broken.append((rel_path, p))
        out.write(f'  {rel_path}: "{p}"\n')

out.close()
print(f'Done. {len(broken)} potentially broken links found.')
print(f'Defined routes: {len(defined_routes)}')
