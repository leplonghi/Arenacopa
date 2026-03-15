/**
 * FieldBackground — Campo de futebol global, idêntico ao original do Auth.tsx.
 * Renderizado fixo atrás de todo conteúdo (z-index: -10).
 */
const FieldBackground = () => (
  <div
    aria-hidden="true"
    style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none", overflow: "hidden" }}
  >
    {/* Deep green base */}
    <div style={{ position: "absolute", inset: 0, background: "hsl(154 50% 8%)" }} />

    {/* Football field SVG — exato do original Auth.tsx (opacity 0.13) */}
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.13 }}
      viewBox="0 0 375 812"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Field stripes */}
      {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
        <rect key={i} x={0} y={i * 68} width={375} height={34}
          fill={i % 2 === 0 ? "#22c55e" : "#16a34a"} />
      ))}
      {/* Outer boundary */}
      <rect x="18" y="36" width="339" height="740" rx="4" stroke="white" strokeWidth="2.5" />
      {/* Halfway line */}
      <line x1="18" y1="406" x2="357" y2="406" stroke="white" strokeWidth="2" />
      {/* Centre circle */}
      <circle cx="187.5" cy="406" r="72" stroke="white" strokeWidth="2" />
      <circle cx="187.5" cy="406" r="3" fill="white" />
      {/* Top penalty area */}
      <rect x="85" y="36" width="205" height="100" rx="2" stroke="white" strokeWidth="2" />
      {/* Top goal area */}
      <rect x="132" y="36" width="111" height="44" rx="2" stroke="white" strokeWidth="2" />
      {/* Top goal */}
      <rect x="152" y="24" width="71" height="16" rx="2" stroke="white" strokeWidth="2" />
      {/* Top penalty spot */}
      <circle cx="187.5" cy="104" r="3" fill="white" />
      {/* Top penalty arc */}
      <path d="M140 136 Q187.5 88 235 136" stroke="white" strokeWidth="2" fill="none" />
      {/* Bottom penalty area */}
      <rect x="85" y="676" width="205" height="100" rx="2" stroke="white" strokeWidth="2" />
      {/* Bottom goal area */}
      <rect x="132" y="732" width="111" height="44" rx="2" stroke="white" strokeWidth="2" />
      {/* Bottom goal */}
      <rect x="152" y="772" width="71" height="16" rx="2" stroke="white" strokeWidth="2" />
      {/* Bottom penalty spot */}
      <circle cx="187.5" cy="708" r="3" fill="white" />
      {/* Bottom penalty arc */}
      <path d="M140 676 Q187.5 724 235 676" stroke="white" strokeWidth="2" fill="none" />
      {/* Corner arcs */}
      <path d="M18 36 Q30 36 30 48" stroke="white" strokeWidth="2" fill="none" />
      <path d="M357 36 Q345 36 345 48" stroke="white" strokeWidth="2" fill="none" />
      <path d="M18 776 Q30 776 30 764" stroke="white" strokeWidth="2" fill="none" />
      <path d="M357 776 Q345 776 345 764" stroke="white" strokeWidth="2" fill="none" />
    </svg>

    {/* Overlay gradients — exato do original Auth.tsx */}
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(to bottom, hsl(154 50% 8% / 0.55), hsl(154 50% 8% / 0.45), hsl(154 50% 8% / 0.7))"
    }} />
    {/* Gold glow top */}
    <div style={{
      position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
      width: 340, height: 340, borderRadius: "50%",
      background: "hsl(44 80% 46% / 0.12)", filter: "blur(80px)"
    }} />
    {/* Green glow bottom */}
    <div style={{
      position: "absolute", bottom: "-5%", left: "50%", transform: "translateX(-50%)",
      width: 300, height: 300, borderRadius: "50%",
      background: "hsl(145 60% 30% / 0.15)", filter: "blur(70px)"
    }} />
  </div>
);

export default FieldBackground;
