import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Ticket, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { resolveCommercialCampaign } from "@/services/commercial/commercial-campaign.service";
import type { CommercialCampaign } from "@/types/commercial-campaign";
import { tStatic } from "@/i18n/staticText";

export default function PublicCommercialCampaign() {
  const { shareCode } = useParams();
  const [campaign, setCampaign] = useState<CommercialCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareCode) return;

    void resolveCommercialCampaign({ shareCode })
      .then(setCampaign)
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [shareCode]);

  if (loading) {
    return (
      <div className="arena-screen flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="arena-screen">
        <ArenaPanel className="p-6 text-center">
          <h1 className="font-display text-3xl font-black uppercase text-white">{tStatic("Campanha não encontrada")}</h1>
          <p className="mt-2 text-sm text-zinc-400">{tStatic("Confira o QR ou peça um novo link ao estabelecimento.")}</p>
        </ArenaPanel>
      </div>
    );
  }

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="p-6">
        <ArenaSectionHeader
          eyebrow={campaign.merchant?.name || "ArenaCup"}
          title={campaign.title}
          hint="Entre na rodada do bar, marque seus resultados e acompanhe a turma."
        />
      </ArenaPanel>

      <ArenaPanel className="mt-5 p-5">
        <ArenaSectionHeader eyebrow="Benefício" title="Mostre no balcão" hint="Benefício simples, conferido pelo estabelecimento." />
        <motion.div 
          className="mt-4 relative overflow-hidden rounded-[24px] border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
          animate={{
            boxShadow: ["0 0 20px rgba(34,197,94,0.1)", "0 0 40px rgba(34,197,94,0.3)", "0 0 20px rgba(34,197,94,0.1)"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shimmer Effect */}
          <motion.div 
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent w-full h-full skew-x-12"
            animate={{ translateX: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
          />
          
          {/* Background Noise */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-noise" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-full bg-primary/20 px-3 py-1 flex items-center gap-1.5 border border-primary/30"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{tStatic("Ativo Agora")}</span>
              </motion.div>
            </div>
            
            <p className="text-sm font-medium leading-6 text-zinc-300">{campaign.benefitSummary}</p>
            <div className="mt-4 flex items-center gap-3">
              <p className="font-display text-4xl font-black uppercase tracking-wider text-white drop-shadow-md">{campaign.benefitCode}</p>
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            
            {campaign.benefitTerms && (
              <div className="mt-5 pt-4 border-t border-primary/10">
                <p className="text-[11px] font-medium leading-5 text-zinc-500 uppercase tracking-wide">{campaign.benefitTerms}</p>
              </div>
            )}
          </div>
        </motion.div>
      </ArenaPanel>

      <Link
        to={campaign.bolaoInviteCode ? `/b/${campaign.bolaoInviteCode}` : campaign.bolaoId ? `/boloes/${campaign.bolaoId}` : "/boloes"}
        className="mt-5 inline-flex w-full items-center justify-center rounded-[20px] bg-primary px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-black"
      >
        Entrar na rodada
      </Link>

      <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-zinc-500">
        O ArenaCup organiza a rodada e o ranking. Não operamos aposta, carteira, sorteio ou prêmio financeiro.
      </p>
    </div>
  );
}
