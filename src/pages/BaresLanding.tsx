import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CheckCircle2, ImageDown, Megaphone, QrCode, Share2, Store, Ticket, Users2 } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import { commercialCampaignAudienceCopy, commercialCampaignPillars } from "@/lib/commercial-campaign-copy";
import { commercialPlanCatalog } from "@/lib/commercial-campaign-pricing";
import { useOpportunities } from "@/hooks/useOpportunities";

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

export default function BaresLanding() {
  const pillars = commercialCampaignPillars.map((pillar, index) => ({
    ...pillar,
    icon: pillarIcons[index] ?? Ticket,
  }));
  const opportunities = useOpportunities({
    surface: "negocios",
  });

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            <Store className="h-4 w-4" />
            {commercialCampaignAudienceCopy.eyebrow}
          </div>
          <h1 className="mt-5 font-display text-[3.4rem] font-black uppercase leading-[0.88] text-white sm:text-[4.5rem]">
            {commercialCampaignAudienceCopy.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
            {commercialCampaignAudienceCopy.description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/negocios/criar"
              className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-primary px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_28px_rgba(255,198,0,0.22)]"
            >
              Criar campanha
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/boloes/creator"
              className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.04] px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-white"
            >
              Creator Pro
            </Link>
          </div>
        </div>
      </ArenaPanel>

      <div className="mt-6">
        <OpportunityRail opportunities={opportunities} title="Oportunidades para negócios" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <ArenaPanel key={pillar.title} className="p-5">
            <pillar.icon className="h-7 w-7 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-black uppercase text-white">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{pillar.text}</p>
          </ArenaPanel>
        ))}
      </div>

      <ArenaPanel className="mt-6 p-5">
        <ArenaSectionHeader
          eyebrow="Como funciona"
          title="Sem aposta, sem carteira, sem sorteio"
          hint="O ArenaCup vende a plataforma de organização e engajamento. Benefícios são simples e conferidos pelo próprio negócio, empresa ou organizador."
        />
        <div className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
          {[
            "Crie a campanha em poucos minutos.",
            "Compartilhe por QR, WhatsApp, Instagram ou link.",
            "Participantes entram e marcam resultados.",
            "A equipe acompanha ranking e valida o código de benefício no local.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </ArenaPanel>

      <ArenaPanel className="mt-6 p-5">
        <ArenaSectionHeader
          eyebrow="Negócios"
          title="Landing, campanha, kit e visibilidade"
          hint="Primeira versão do caminho comercial sem mudar checkout, regras ou contratos. Os módulos avançados entram por etapas."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {businessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.title} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-xl font-black uppercase text-white">{tool.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{tool.text}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
          {["Card quadrado", "Story", "Cartaz", "Banner", "Card de ranking"].map((label) => (
            <div key={label} className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
              {label}
            </div>
          ))}
        </div>
      </ArenaPanel>

      <ArenaPanel className="mt-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Preço por campanha</p>
            <p className="mt-1 font-display text-4xl font-black uppercase text-white">
              {commercialPlanCatalog.single_match.priceLabel}
            </p>
            <p className="mt-1 text-sm text-zinc-400">A partir de {commercialCampaignAudienceCopy.priceNote.toLowerCase()}</p>
          </div>
          <Link
            to="/negocios/criar"
            className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-primary px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-black"
          >
            Começar agora
            <Share2 className="h-4 w-4" />
          </Link>
        </div>
      </ArenaPanel>
    </div>
  );
}
