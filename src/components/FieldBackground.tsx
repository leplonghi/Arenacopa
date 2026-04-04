const FieldBackground = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden"
  >
    {/* Base dark background */}
    <div className="absolute inset-0 bg-[#03100a]" />

    {/* Campo image — darker to let contrast pop */}
    <div
      className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.55] md:opacity-[0.65]"
      style={{ backgroundImage: "url('/images/campo-bg.png?v=20260316')" }}
    />

    {/* Radial vignette — darker edges */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(116,255,153,0.05)_0%,rgba(8,38,23,0.32)_38%,rgba(2,10,6,0.75)_100%)]" />

    {/* Vertical gradient — much darker global contrast */}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.55)_20%,rgba(0,0,0,0.45)_42%,rgba(0,0,0,0.65)_68%,rgba(0,0,0,0.88)_100%)]" />

    {/* Side vignettes — slightly stronger */}
    <div className="absolute inset-y-0 left-0 w-[18%] bg-[linear-gradient(90deg,rgba(0,0,0,0.45)_0%,transparent_100%)]" />
    <div className="absolute inset-y-0 right-0 w-[18%] bg-[linear-gradient(270deg,rgba(0,0,0,0.45)_0%,transparent_100%)]" />
    <div className="absolute inset-x-0 top-0 h-[18%] bg-[linear-gradient(180deg,rgba(0,0,0,0.65)_0%,transparent_100%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[20%] bg-[linear-gradient(0deg,rgba(0,0,0,0.78)_0%,transparent_100%)]" />

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


export default FieldBackground;