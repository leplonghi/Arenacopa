// Color tokens for each step of the bolão creation wizard
// Each step gets a distinct tone so users don't confuse selections across stages

export type StepTone = "green" | "gold" | "cyan" | "rose" | "amber";

export const stepToneMap: Record<number, StepTone> = {
  1: "green",   // Quick / Identidade
  2: "gold",    // Catalog / Jogos
  3: "cyan",    // Context / Grupo
  4: "rose",    // Rules / Regras
  5: "amber",   // Admission / Acesso
};

export const toneClasses: Record<
  StepTone,
  {
    border: string;
    bg: string;
    bgHover: string;
    text: string;
    ring: string;
    shadow: string;
    checkBg: string;
    checkText: string;
    labelText: string;
  }
> = {
  green: {
    border: "border-primary/50",
    bg: "bg-primary/10",
    bgHover: "hover:bg-primary/[0.06]",
    text: "text-primary",
    ring: "ring-primary/20",
    shadow: "shadow-[0_0_20px_rgba(145,255,59,0.15)]",
    checkBg: "bg-primary",
    checkText: "text-black",
    labelText: "text-primary",
  },
  gold: {
    border: "border-[#ffc54d]/50",
    bg: "bg-[#ffc54d]/10",
    bgHover: "hover:bg-[#ffc54d]/[0.06]",
    text: "text-[#ffc54d]",
    ring: "ring-[#ffc54d]/20",
    shadow: "shadow-[0_0_20px_rgba(255,197,77,0.15)]",
    checkBg: "bg-[#ffc54d]",
    checkText: "text-black",
    labelText: "text-[#ffc54d]",
  },
  cyan: {
    border: "border-cyan-400/50",
    bg: "bg-cyan-400/10",
    bgHover: "hover:bg-cyan-400/[0.06]",
    text: "text-cyan-400",
    ring: "ring-cyan-400/20",
    shadow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
    checkBg: "bg-cyan-400",
    checkText: "text-black",
    labelText: "text-cyan-400",
  },
  rose: {
    border: "border-rose-400/50",
    bg: "bg-rose-400/10",
    bgHover: "hover:bg-rose-400/[0.06]",
    text: "text-rose-400",
    ring: "ring-rose-400/20",
    shadow: "shadow-[0_0_20px_rgba(251,113,133,0.15)]",
    checkBg: "bg-rose-400",
    checkText: "text-black",
    labelText: "text-rose-400",
  },
  amber: {
    border: "border-amber-400/50",
    bg: "bg-amber-400/10",
    bgHover: "hover:bg-amber-400/[0.06]",
    text: "text-amber-400",
    ring: "ring-amber-400/20",
    shadow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    checkBg: "bg-amber-400",
    checkText: "text-black",
    labelText: "text-amber-400",
  },
};

export function getToneClasses(stepNumber: number) {
  const tone = stepToneMap[stepNumber] ?? "green";
  return toneClasses[tone];
}
