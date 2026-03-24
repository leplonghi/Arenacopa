import re, json, os

BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa'
JOGOS = BASE + r'\src\components\copa\bolao\JogosTab.tsx'
LOCALES = BASE + r'\public\locales'

results = []

# ── 1. Read file ──────────────────────────────────────────────────────────────
with open(JOGOS, encoding='utf-8') as fh:
    src = fh.read()

original = src

# ── 2. Add CheckCircle2 to lucide imports ─────────────────────────────────────
OLD_LUCIDE = 'import { CircleHelp, Lock, Share2, Download, Copy, MessageCircle } from "lucide-react";'
NEW_LUCIDE = 'import { CircleHelp, Lock, Share2, Download, Copy, MessageCircle, CheckCircle2 } from "lucide-react";'
if NEW_LUCIDE in src:
    results.append('SKIP lucide already has CheckCircle2')
elif OLD_LUCIDE in src:
    src = src.replace(OLD_LUCIDE, NEW_LUCIDE, 1)
    results.append('OK added CheckCircle2 to lucide imports')
else:
    results.append('MISS lucide import line not found')

# ── 3. Add savedFlashMatchIds state after savingMatchId state ─────────────────
OLD_STATE = '    const [savingMatchId, setSavingMatchId] = useState<string | null>(null);'
NEW_STATE = ('    const [savingMatchId, setSavingMatchId] = useState<string | null>(null);\n'
             '    const [savedFlashMatchIds, setSavedFlashMatchIds] = useState<Set<string>>(new Set());')
if 'savedFlashMatchIds' in src:
    results.append('SKIP savedFlashMatchIds already exists')
elif OLD_STATE in src:
    src = src.replace(OLD_STATE, NEW_STATE, 1)
    results.append('OK added savedFlashMatchIds state')
else:
    results.append('MISS savingMatchId state line not found')

# ── 4. Add flash trigger after await Promise.all(tasks) ───────────────────────
OLD_AWAIT = '            await Promise.all(tasks);\n\n            setDraftPalpites'
NEW_AWAIT = ('            await Promise.all(tasks);\n\n'
             '            setSavedFlashMatchIds(prev => new Set([...prev, matchId]));\n'
             '            window.setTimeout(() => setSavedFlashMatchIds(prev => { const next = new Set(prev); next.delete(matchId); return next; }), 1500);\n\n'
             '            setDraftPalpites')
if 'setSavedFlashMatchIds(prev => new Set' in src:
    results.append('SKIP flash trigger already exists')
elif OLD_AWAIT in src:
    src = src.replace(OLD_AWAIT, NEW_AWAIT, 1)
    results.append('OK added flash trigger after Promise.all')
else:
    results.append('MISS await Promise.all block not found')

# ── 5. Add AnimatePresence flash overlay after isStarted lock overlay ──────────
OLD_LOCK_END = '                        </div>}\n\n                        <div className="flex justify-between'
NEW_LOCK_END = ('                        </div>}\n\n'
                '                        <AnimatePresence>\n'
                '                            {savedFlashMatchIds.has(m.id) && (\n'
                '                                <motion.div\n'
                '                                    key="save-flash"\n'
                '                                    initial={{ opacity: 0, scale: 0.8 }}\n'
                '                                    animate={{ opacity: 1, scale: 1 }}\n'
                '                                    exit={{ opacity: 0, scale: 1.1 }}\n'
                '                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}\n'
                '                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none rounded-[32px]"\n'
                '                                >\n'
                '                                    <CheckCircle2 className="w-14 h-14 text-primary mb-3" />\n'
                '                                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">{t(\'palpites.saved\')}</span>\n'
                '                                </motion.div>\n'
                '                            )}\n'
                '                        </AnimatePresence>\n\n'
                '                        <div className="flex justify-between')
if 'savedFlashMatchIds.has(m.id)' in src:
    results.append('SKIP flash overlay already exists')
elif OLD_LOCK_END in src:
    src = src.replace(OLD_LOCK_END, NEW_LOCK_END, 1)
    results.append('OK added AnimatePresence flash overlay')
else:
    results.append('MISS lock overlay end pattern not found')

# ── 6. Fix empty state hardcoded strings ─────────────────────────────────────
OLD_EMPTY = ('    if (!matches.length) {\n'
             '        return (\n'
             '            <EmptyState\n'
             '                icon="?"\n'
             '                title="Calend?rio ainda indispon?vel"\n'
             '                description="Assim que os jogos forem carregados, seus palpites aparecem aqui."\n'
             '            />\n'
             '        );\n'
             '    }')
NEW_EMPTY = ('    if (!matches.length) {\n'
             '        return (\n'
             '            <EmptyState\n'
             '                icon="?"\n'
             '                title={t(\'palpites.calendar_unavailable\')}\n'
             '                description={t(\'palpites.calendar_unavailable_desc\')}\n'
             '            />\n'
             '        );\n'
             '    }')

if "t('palpites.calendar_unavailable')" in src:
    results.append('SKIP empty state already i18n')
elif OLD_EMPTY in src:
    src = src.replace(OLD_EMPTY, NEW_EMPTY, 1)
    results.append('OK fixed empty state i18n')
else:
    # try a more flexible match
    pattern = r'if \(!matches\.length\) \{.*?<EmptyState[^/]*/>\s*\)\s*;\s*\}'
    m = re.search(pattern, src, re.DOTALL)
    if m:
        old_block = m.group(0)
        new_block = re.sub(r'title="[^"]*"', "title={t('palpites.calendar_unavailable')}", old_block)
        new_block = re.sub(r'description="[^"]*"', "description={t('palpites.calendar_unavailable_desc')}", new_block)
        src = src.replace(old_block, new_block, 1)
        results.append('OK fixed empty state via regex')
    else:
        results.append('MISS empty state block not found')

# ── 7. Write file if changed ──────────────────────────────────────────────────
if src != original:
    with open(JOGOS, 'w', encoding='utf-8') as fh:
        fh.write(src)
    results.append('WRITTEN JogosTab.tsx')
else:
    results.append('NO CHANGE JogosTab.tsx')

# ── 8. Add i18n keys to bolao.json ────────────────────────────────────────────
NEW_BOLAO_KEYS = {
    'palpites.calendar_unavailable': {
        'pt-BR': 'Calend\u00e1rio ainda indispon\u00edvel',
        'en': 'Schedule not available yet',
        'es': 'Calendario a\u00fan no disponible',
    },
    'palpites.calendar_unavailable_desc': {
        'pt-BR': 'Assim que os jogos forem carregados, seus palpites aparecem aqui.',
        'en': 'Once matches are loaded, your predictions will appear here.',
        'es': 'Una vez que los partidos est\u00e9n disponibles, tus predicciones aparecer\u00e1n aqu\u00ed.',
    },
}

for lang in ['pt-BR', 'en', 'es']:
    path = os.path.join(LOCALES, lang, 'bolao.json')
    with open(path, encoding='utf-8') as fh:
        data = json.load(fh)
    changed = False
    for dotkey, vals in NEW_BOLAO_KEYS.items():
        section, key = dotkey.split('.', 1)
        if section not in data:
            data[section] = {}
        if key not in data[section]:
            data[section][key] = vals[lang]
            changed = True
    if changed:
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        results.append(f'OK bolao.json {lang} updated')
    else:
        results.append(f'SKIP bolao.json {lang} already has keys')

# ── 9. Print results ──────────────────────────────────────────────────────────
for r in results:
    print(r.encode('ascii', errors='replace').decode('ascii'))
