export type BolaoCardVisualIntent = "action" | "info" | "cta";

const baseCardClass = "min-w-0 rounded-[26px] border p-4 break-words backdrop-blur-xl [overflow-wrap:anywhere]";

export function getBolaoCardShellClass(intent: BolaoCardVisualIntent) {
  if (intent === "action") {
    return [
      baseCardClass,
      "cursor-pointer border-primary/25 bg-[linear-gradient(135deg,rgba(145,255,59,0.11),rgba(255,197,77,0.055))]",
      "shadow-[0_0_0_1px_rgba(145,255,59,0.06)] transition hover:border-primary/45 hover:bg-primary/[0.08]",
    ].join(" ");
  }

  if (intent === "cta") {
    return [
      baseCardClass,
      "cursor-default border-[#ffc54d]/20 bg-[#ffc54d]/[0.055]",
      "shadow-[0_0_0_1px_rgba(255,197,77,0.05)]",
    ].join(" ");
  }

  return [
    baseCardClass,
    "cursor-default border-white/10 bg-white/[0.035]",
  ].join(" ");
}
