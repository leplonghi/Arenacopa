import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Ticket } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { resolveCommercialCampaign } from "@/services/commercial/commercial-campaign.service";
import type { CommercialCampaign } from "@/types/commercial-campaign";

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
          <h1 className="font-display text-3xl font-black uppercase text-white">Campanha não encontrada</h1>
          <p className="mt-2 text-sm text-zinc-400">Confira o QR ou peça um novo link ao estabelecimento.</p>
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
        <div className="mt-4 rounded-[24px] border border-primary/20 bg-primary/10 p-5">
          <Ticket className="h-7 w-7 text-primary" />
          <p className="mt-3 text-sm leading-6 text-zinc-200">{campaign.benefitSummary}</p>
          <p className="mt-3 font-display text-3xl font-black uppercase text-white">{campaign.benefitCode}</p>
          {campaign.benefitTerms ? <p className="mt-3 text-xs leading-5 text-zinc-500">{campaign.benefitTerms}</p> : null}
        </div>
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
