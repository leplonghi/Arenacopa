BASE = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src'
results = []

# ══════════════════════════════════════════════════════════════════════════════
# FIX 1: FieldBackground.tsx — reduce overlay darkness so campo is visible
# ══════════════════════════════════════════════════════════════════════════════
fp = BASE + r'\components\FieldBackground.tsx'
with open(fp, encoding='utf-8') as fh:
    src = fh.read()

NEW_FIELD = '''const FieldBackground = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden"
  >
    {/* Base dark background */}
    <div className="absolute inset-0 bg-[#03100a]" />

    {/* Campo image — more visible */}
    <div
      className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.92] md:opacity-[0.95]"
      style={{ backgroundImage: "url('/images/campo-bg.png?v=20260316')" }}
    />

    {/* Radial vignette — lighter center */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(116,255,153,0.06)_0%,rgba(8,38,23,0.25)_38%,rgba(2,10,6,0.62)_100%)]" />

    {/* Vertical gradient — lighter so field shows through */}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.22)_20%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.28)_68%,rgba(0,0,0,0.68)_100%)]" />

    {/* Side vignettes */}
    <div className="absolute inset-y-0 left-0 w-[18%] bg-[linear-gradient(90deg,rgba(0,0,0,0.45)_0%,transparent_100%)]" />
    <div className="absolute inset-y-0 right-0 w-[18%] bg-[linear-gradient(270deg,rgba(0,0,0,0.45)_0%,transparent_100%)]" />
    <div className="absolute inset-x-0 top-0 h-[18%] bg-[linear-gradient(180deg,rgba(0,0,0,0.65)_0%,transparent_100%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[20%] bg-[linear-gradient(0deg,rgba(0,0,0,0.72)_0%,transparent_100%)]" />

    {/* Field lines overlay */}
    <div className="absolute inset-0 opacity-40">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute inset-x-[11%] top-[8%] bottom-[8%] rounded-[42px] border border-white/[0.06]" />
      <div className="absolute inset-x-[14%] top-[11%] bottom-[11%] rounded-[36px] border border-white/[0.03]" />
    </div>

    {/* Texture */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.018] mix-blend-overlay" />

    {/* Ambient glows */}
    <div className="absolute top-[-8%] left-[-10%] h-[52%] w-[58%] rounded-full bg-primary/6 blur-[140px]" />
    <div className="absolute bottom-[-8%] right-[-10%] h-[48%] w-[52%] rounded-full bg-copa-success/6 blur-[120px]" />

    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{ backgroundImage: "url('/noise.svg')" }}
    />
  </div>
);


export default FieldBackground;'''

with open(fp, 'w', encoding='utf-8') as fh:
    fh.write(NEW_FIELD)
results.append('OK FieldBackground.tsx rewritten with lighter overlays')

# ══════════════════════════════════════════════════════════════════════════════
# FIX 2: App.tsx — update LoadingScreen to show logo.png
# ══════════════════════════════════════════════════════════════════════════════
fp2 = BASE + r'\App.tsx'
with open(fp2, encoding='utf-8') as fh:
    src2 = fh.read()

OLD_LOADING = '''const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#082016] text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="animate-pulse font-medium text-primary">ArenaCUP</p>
    </div>
  </div>
);'''

NEW_LOADING = '''const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#061a10] text-white">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <img
          src="/logo.png?v=20260316"
          alt="ArenaCUP"
          className="h-20 w-20 object-contain drop-shadow-[0_0_24px_rgba(34,197,94,0.45)]"
        />
        <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 pointer-events-none" />
      </div>
      <div className="h-1 w-24 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      </div>
    </div>
  </div>
);'''

if OLD_LOADING in src2:
    src2 = src2.replace(OLD_LOADING, NEW_LOADING, 1)
    results.append('OK App.tsx LoadingScreen updated with logo.png')
else:
    results.append('MISS LoadingScreen pattern not found — check manually')

with open(fp2, 'w', encoding='utf-8') as fh:
    fh.write(src2)

# ══════════════════════════════════════════════════════════════════════════════
# FIX 3: Add shimmer keyframe to index.css if not already there
# ══════════════════════════════════════════════════════════════════════════════
import os
css_path = BASE + r'\index.css'
if os.path.exists(css_path):
    with open(css_path, encoding='utf-8') as fh:
        css = fh.read()
    if '@keyframes shimmer' not in css:
        css += '''
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
'''
        with open(css_path, 'w', encoding='utf-8') as fh:
            fh.write(css)
        results.append('OK index.css shimmer keyframe added')
    else:
        results.append('SKIP shimmer keyframe already exists')

for r in results:
    print(r.encode('ascii', errors='replace').decode('ascii'))
