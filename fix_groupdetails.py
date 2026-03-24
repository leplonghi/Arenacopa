import re

FPATH = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\components\copa\GroupDetails.tsx'

with open(FPATH, encoding='utf-8') as fh:
    src = fh.read()

# The bad pattern: hook injected inside the parameter destructure block
# export function GroupDetails({
#   const { t } = useTranslation('copa'); groupId, onClose, viewMode = "real" }: GroupDetailsProps) {
BAD = ("export function GroupDetails({\n"
       "  const { t } = useTranslation('copa'); groupId, onClose, viewMode = \"real\" }: GroupDetailsProps) {")
GOOD = ("export function GroupDetails({\n"
        "  groupId, onClose, viewMode = \"real\" }: GroupDetailsProps) {\n"
        "    const { t } = useTranslation('copa');")

if BAD in src:
    src = src.replace(BAD, GOOD, 1)
    with open(FPATH, 'w', encoding='utf-8') as fh:
        fh.write(src)
    print('OK fixed GroupDetails hook placement')
else:
    # show the problematic section for debugging
    lines = src.splitlines()
    for i, l in enumerate(lines[14:25], 15):
        print(f'{i}: {l}'.encode('ascii', errors='replace').decode('ascii'))
    print('MISS pattern not found - check above')
