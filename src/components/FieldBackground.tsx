const FieldBackground = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden"
  >
    <div className="absolute inset-0 bg-[#010705]" />

    <div
      className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.38] md:opacity-[0.5]"
      style={{ backgroundImage: "url('/images/campo-bg.png?v=20260316')" }}
    />

    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(124,255,98,0.11),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(255,191,0,0.18),transparent_18%),radial-gradient(circle_at_center,rgba(9,61,34,0.22)_0%,rgba(4,15,11,0.72)_48%,rgba(1,5,4,0.96)_100%)]" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.52)_18%,rgba(0,0,0,0.34)_45%,rgba(0,0,0,0.66)_72%,rgba(0,0,0,0.9)_100%)]" />
    <div className="absolute inset-y-0 left-0 w-[22%] bg-[linear-gradient(90deg,rgba(0,0,0,0.52)_0%,transparent_100%)]" />
    <div className="absolute inset-y-0 right-0 w-[22%] bg-[linear-gradient(270deg,rgba(0,0,0,0.52)_0%,transparent_100%)]" />

    <div className="absolute inset-0 opacity-[0.55]">
      <div className="absolute left-1/2 top-[9%] h-[16%] w-[112%] -translate-x-1/2 rounded-[50%] border border-white/[0.09]" />
      <div className="absolute left-1/2 top-[13%] h-[23%] w-[125%] -translate-x-1/2 rounded-[50%] border border-white/[0.06]" />
      <div className="absolute left-1/2 top-[18%] h-[31%] w-[140%] -translate-x-1/2 rounded-[50%] border border-white/[0.04]" />
    </div>

    <div className="absolute inset-0 opacity-35">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute inset-x-[11%] top-[8%] bottom-[8%] rounded-[42px] border border-white/[0.06]" />
      <div className="absolute inset-x-[14%] top-[11%] bottom-[11%] rounded-[36px] border border-white/[0.03]" />
    </div>

    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.018] mix-blend-overlay" />
    <div className="absolute top-[-10%] left-[-12%] h-[48%] w-[54%] rounded-full bg-primary/10 blur-[160px]" />
    <div className="absolute top-[8%] right-[-14%] h-[32%] w-[34%] rounded-full bg-yellow-400/10 blur-[120px]" />
    <div className="absolute bottom-[-8%] right-[-10%] h-[48%] w-[52%] rounded-full bg-emerald-400/8 blur-[120px]" />
    <div className="absolute bottom-[12%] left-[8%] h-[10rem] w-[10rem] rounded-full bg-primary/10 blur-[80px]" />

    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{ backgroundImage: "url('/noise.svg')" }}
    />
  </div>
);


export default FieldBackground;
