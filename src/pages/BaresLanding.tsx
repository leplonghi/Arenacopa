import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ImageDown,
  Megaphone,
  QrCode,
  Share2,
  Store,
  Ticket,
  Trophy,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { commercialCampaignAudienceCopy, commercialCampaignPillars } from "@/lib/commercial-campaign-copy";
import { commercialPlanCatalog, commercialPlanOrder } from "@/lib/commercial-campaign-pricing";

const pillarIcons = [QrCode, Users2, Ticket];

const businessTools = [
  {
    title: "Perfil comercial",
    text: "Dados do negócio, cidade, bairro e canais ficam preparados para campanhas recorrentes.",
    icon: Store,
  },
  {
    title: "Kit de divulgação",
    text: "Link público, QR, WhatsApp e textos prontos para compartilhar em balcão, telão ou evento.",
    icon: ImageDown,
  },
  {
    title: "Sponsors",
    text: "Espaço preparado para marcas apoiadoras em bolões, rankings e cards de campanha.",
    icon: Megaphone,
  },
  {
    title: "Analytics",
    text: "Sinais simples de participação, entrada por QR e evolução da campanha entram nas próximas ondas.",
    icon: BarChart3,
  },
];

const howItWorksSteps = [
  {
    text: "Crie a campanha em poucos minutos.",
    icon: Store,
  },
  {
    text: "Compartilhe por QR, WhatsApp, Instagram ou link.",
    icon: QrCode,
  },
  {
    text: "Participantes entram e marcam resultados.",
    icon: Users2,
  },
  {
    text: "A equipe acompanha ranking e valida o código de benefício no local.",
    icon: Trophy,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function BaresLanding() {
  const pillars = commercialCampaignPillars.map((pillar, index) => ({
    ...pillar,
    icon: pillarIcons[index] ?? Ticket,
  }));

  const [activeTab, setActiveTab] = useState<"como" | "ferramentas" | "precos">("como");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="arena-screen relative space-y-6">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #22FF88 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[24px] border border-white/[0.06]",
            "bg-gradient-to-br from-[#0f1a12] via-[#0c1410] to-[#080f0a]",
            "p-6 sm:p-8 md:p-10"
          )}
          style={{
            boxShadow:
              "0 24px 80px -24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Stadium texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Side glow */}
          <div className="absolute right-[-100px] top-[-60px] h-72 w-72 rounded-full bg-[#FFC700]/[0.07] blur-[100px]" />
          <div className="absolute left-[-80px] bottom-[-40px] h-56 w-56 rounded-full bg-[#22FF88]/[0.05] blur-[80px]" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC700]/20 bg-[#FFC700]/[0.08] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFC700]">
                <Store className="h-3.5 w-3.5" />
                {commercialCampaignAudienceCopy.eyebrow}
              </div>

              {/* Title */}
              <h1 className="mt-5 font-display text-[2.8rem] font-black uppercase leading-[0.92] tracking-tight text-white sm:text-[3.6rem]">
                ArenaCup para{" "}
                <span className="text-[#FFC700]">Negócios</span>
              </h1>

              {/* Description */}
              <p className="mt-4 max-w-md text-[15px] leading-7 text-zinc-400">
                {commercialCampaignAudienceCopy.description}
              </p>

              {/* CTA */}
              <Link
                to="/negocios/criar"
                className={cn(
                  "group mt-6 inline-flex items-center gap-2.5 rounded-[16px]",
                  "bg-gradient-to-r from-[#FFC700] via-[#FFD84D] to-[#FFC700]",
                  "px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-black",
                  "transition-all duration-300",
                  "shadow-[0_8px_32px_-8px_rgba(255,199,0,0.35)]",
                  "hover:shadow-[0_12px_40px_-6px_rgba(255,199,0,0.5)]",
                  "hover:brightness-110 hover:-translate-y-0.5"
                )}
              >
                Criar campanha
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Decorative trophy element */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/[0.06] bg-gradient-to-br from-[#FFC700]/10 to-transparent">
                <div className="absolute inset-0 rounded-full bg-[#FFC700]/[0.03] blur-2xl" />
                <Trophy className="relative z-10 h-16 w-16 text-[#FFC700]/40" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PILARES (cards premium) ─────────────────────────────── */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
      >
        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.title}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
            className={cn(
              "group relative snap-start flex-shrink-0 w-[280px] cursor-pointer",
              "rounded-[20px] border p-5 transition-all duration-300",
              "bg-gradient-to-br from-[#0f1611] via-[#0c120e] to-[#080d09]",
              "border-white/[0.06] hover:border-[#22FF88]/20",
              "overflow-hidden"
            )}
            style={{
              boxShadow:
                hoveredCard === i
                  ? "0 12px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,255,136,0.08), inset 0 1px 0 0 rgba(255,255,255,0.04)"
                  : "0 4px 20px -10px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 0 rgba(255,255,255,0.03)",
              transform: hoveredCard === i ? "scale(1.02)" : "scale(1)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Hover glow */}
            <div
              className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-[#22FF88]/[0.06] blur-[40px] transition-opacity duration-500"
              style={{ opacity: hoveredCard === i ? 1 : 0 }}
            />

            <div className="relative z-10 flex items-start gap-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300",
                  "border-[#22FF88]/15 bg-[#22FF88]/[0.08]",
                  hoveredCard === i && "border-[#22FF88]/30 bg-[#22FF88]/[0.12] shadow-[0_0_20px_-6px_rgba(34,255,136,0.25)]"
                )}
              >
                <pillar.icon className="h-5 w-5 text-[#22FF88]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-black uppercase tracking-wide text-white">
                    {pillar.title}
                  </h3>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 text-white/20 transition-all duration-300",
                      hoveredCard === i && "text-[#22FF88]/60 translate-x-0.5"
                    )}
                  />
                </div>
                <p className="mt-1 text-[12px] leading-[1.6] text-zinc-500">
                  {pillar.text}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── TABS PREMIUM ────────────────────────────────────────── */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div
          className={cn(
            "overflow-hidden rounded-[20px] border border-white/[0.06]",
            "bg-gradient-to-br from-[#0d1310] via-[#0a0f0c] to-[#060a07]"
          )}
          style={{
            boxShadow: "0 8px 40px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Tab bar */}
          <div className="relative flex border-b border-white/[0.06] px-1">
            {[
              { key: "como", label: "Como funciona" },
              { key: "ferramentas", label: "Ferramentas" },
              { key: "precos", label: "Preços" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "relative flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] transition-colors duration-200",
                  activeTab === tab.key
                    ? "text-white"
                    : "text-zinc-600 hover:text-zinc-400"
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeBusinessTab"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#22FF88]"
                    style={{
                      boxShadow: "0 0 12px 1px rgba(34,255,136,0.35)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {activeTab === "como" && (
                <motion.div
                  key="como"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="relative">
                    {/* Timeline vertical line */}
                    <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-[#22FF88]/20 via-[#22FF88]/10 to-transparent" />

                    <div className="space-y-4">
                      {howItWorksSteps.map((step, i) => {
                        const StepIcon = step.icon;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.35 }}
                            className="group relative flex items-start gap-4"
                          >
                            {/* Icon circle */}
                            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#22FF88]/20 bg-[#0d1310] transition-all duration-300 group-hover:border-[#22FF88]/40 group-hover:shadow-[0_0_16px_-4px_rgba(34,255,136,0.25)]">
                              <StepIcon className="h-5 w-5 text-[#22FF88]" strokeWidth={1.6} />
                            </div>

                            {/* Card */}
                            <div
                              className={cn(
                                "relative flex-1 rounded-[16px] border p-4 transition-all duration-300",
                                "border-white/[0.05] bg-white/[0.02]",
                                "group-hover:border-white/[0.08] group-hover:bg-white/[0.04]"
                              )}
                            >
                              {/* Step number watermark */}
                              <span className="absolute right-3 top-2 font-display text-2xl font-black text-white/[0.03]">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <p className="relative z-10 text-sm leading-relaxed text-zinc-300">
                                {step.text}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "ferramentas" && (
                <motion.div
                  key="ferramentas"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {businessTools.map((tool, i) => {
                    const Icon = tool.icon;
                    return (
                      <motion.div
                        key={tool.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.35 }}
                        className={cn(
                          "group relative overflow-hidden rounded-[16px] border p-4 transition-all duration-300",
                          "border-white/[0.05] bg-gradient-to-br from-[#0e1511] via-[#0b100c] to-[#080b08]",
                          "hover:border-[#22FF88]/15 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]"
                        )}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition-all duration-300",
                              "border-[#22FF88]/15 bg-[#22FF88]/[0.06]",
                              "group-hover:border-[#22FF88]/30 group-hover:bg-[#22FF88]/[0.1] group-hover:shadow-[0_0_16px_-4px_rgba(34,255,136,0.2)]"
                            )}
                          >
                            <Icon className="h-4.5 w-4.5 text-[#22FF88]" strokeWidth={1.8} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-sm font-black uppercase tracking-wide text-white">
                              {tool.title}
                            </h3>
                            <p className="mt-0.5 text-[12px] leading-[1.6] text-zinc-500">
                              {tool.text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "precos" && (
                <motion.div
                  key="precos"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                    {commercialPlanOrder.map((planId, i) => {
                      const plan = commercialPlanCatalog[planId];
                      const isPopular = planId === "five_matches";
                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08, duration: 0.35 }}
                          className={cn(
                            "group relative snap-start flex-shrink-0 w-[210px] cursor-pointer",
                            "rounded-[20px] border p-5 transition-all duration-300 overflow-hidden",
                            isPopular
                              ? "border-[#FFC700]/25 bg-gradient-to-br from-[#1a1708] via-[#141008] to-[#0f0c04]"
                              : "border-white/[0.05] bg-gradient-to-br from-[#0f1611] via-[#0c120e] to-[#080d09]"
                          )}
                          style={{
                            boxShadow: isPopular
                              ? "0 8px 32px -12px rgba(255,199,0,0.15), 0 0 0 1px rgba(255,199,0,0.05)"
                              : "0 4px 20px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02)",
                          }}
                        >
                          {/* Popular glow */}
                          {isPopular && (
                            <div className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-[#FFC700]/[0.08] blur-[40px]" />
                          )}

                          <div className="relative z-10">
                            {isPopular && (
                              <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-[#FFC700]/25 bg-[#FFC700]/[0.1] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#FFC700]">
                                <Trophy className="h-3 w-3" />
                                Mais popular
                              </div>
                            )}
                            <h4 className="font-display text-sm font-black uppercase tracking-wide text-white">
                              {plan.title}
                            </h4>
                            <p className="mt-2 text-2xl font-black text-white tracking-tight">
                              {plan.priceLabel}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">{plan.shortTitle}</p>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#22FF88]/20 bg-[#22FF88]/[0.06]">
                                  <CheckCircle2 className="h-3 w-3 text-[#22FF88]" />
                                </div>
                                {plan.includedGames} {plan.includedGames === 1 ? "jogo" : "jogos"}
                              </div>
                              <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#22FF88]/20 bg-[#22FF88]/[0.06]">
                                  <Users2 className="h-3 w-3 text-[#22FF88]" />
                                </div>
                                Até {plan.participantLimit} participantes
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-[11px] text-zinc-600">
                    A partir de {commercialCampaignAudienceCopy.priceNote.toLowerCase()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── CTA FINAL PREMIUM ──────────────────────────────────── */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[20px] border border-white/[0.06]",
            "bg-gradient-to-br from-[#0f1611] via-[#0c120e] to-[#080d09]",
            "p-6 sm:p-8"
          )}
          style={{
            boxShadow: "0 8px 40px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute right-[-60px] top-[-40px] h-40 w-40 rounded-full bg-[#FFC700]/[0.06] blur-[60px]" />

          <div className="relative z-10 flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFC700]/70">
                Pronto para começar?
              </p>
              <p className="mt-1.5 font-display text-xl font-black uppercase tracking-wide text-white">
                Crie sua primeira campanha
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                Leva menos de 2 minutos e você já pode compartilhar.
              </p>
            </div>
            <Link
              to="/negocios/criar"
              className={cn(
                "group inline-flex shrink-0 items-center gap-2.5 rounded-[16px]",
                "bg-gradient-to-r from-[#FFC700] via-[#FFD84D] to-[#FFC700]",
                "px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-black",
                "transition-all duration-300",
                "shadow-[0_8px_32px_-8px_rgba(255,199,0,0.35)]",
                "hover:shadow-[0_12px_40px_-6px_rgba(255,199,0,0.5)]",
                "hover:brightness-110 hover:-translate-y-0.5"
              )}
            >
              Começar agora
              <Share2 className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
