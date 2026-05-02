import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Ticket } from "lucide-react";
import { resolveCommercialCampaign } from "@/services/commercial/commercial-campaign.service";
import type { CommercialCampaign } from "@/types/commercial-campaign";
import { RealtimeRankingTab } from "@/components/copa/bolao/RealtimeRankingTab";

export default function ArenaTV() {
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
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="font-display text-4xl font-black uppercase text-white">Campanha não encontrada</h1>
          <p className="mt-4 text-xl text-zinc-500">O código da TV pode estar incorreto ou expirado.</p>
        </div>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/c/${shareCode}`;

  return (
    <div className="flex min-h-screen w-full bg-black text-white font-sans overflow-hidden">
      {/* Left Area - QR Code and Merchant Info */}
      <div className="flex w-[35%] flex-col items-center justify-center border-r border-white/10 bg-zinc-950 p-12 overflow-y-auto">
        <div className="text-center mb-10">
          <p className="font-display text-2xl font-bold uppercase tracking-widest text-primary">
            {campaign.merchant?.name || "ArenaCup"}
          </p>
          <h1 className="mt-4 font-display text-5xl font-black uppercase leading-tight text-white">
            {campaign.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Escaneie para entrar no bolão e participar!
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-[0_0_60px_rgba(34,197,94,0.3)] shrink-0">
          <QRCodeSVG
            value={joinUrl}
            size={300}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="mt-8 text-center shrink-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Acesse também pelo link</p>
          <p className="mt-2 text-xl font-medium text-white">{joinUrl.replace('https://', '').replace('http://', '')}</p>
        </div>

        {campaign.benefitSummary && (
          <div className="mt-12 w-full rounded-3xl border border-primary/20 bg-primary/10 p-6 shadow-[0_0_40px_rgba(34,197,94,0.15)] text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mb-4">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-black uppercase tracking-wider text-primary mb-2">Prêmio da Rodada</h3>
            <p className="text-lg text-white font-medium">{campaign.benefitSummary}</p>
            {campaign.benefitTerms && (
              <p className="mt-3 text-xs text-zinc-500">{campaign.benefitTerms}</p>
            )}
          </div>
        )}
      </div>

      {/* Right Area - Live Content (Leaderboard / Matches) */}
      <div className="flex flex-1 flex-col p-12 overflow-y-auto">
        <div className="mb-12 flex items-center justify-between shrink-0">
          <h2 className="font-display text-4xl font-black uppercase tracking-wide text-white">
            Ao Vivo <span className="ml-2 inline-block h-3 w-3 animate-pulse rounded-full bg-red-500 align-middle"></span>
          </h2>
          <div className="rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-sm font-bold uppercase tracking-widest text-primary">
            Modo ArenaTV
          </div>
        </div>

        <div className="flex-1">
          {campaign.bolaoId ? (
            <div className="rounded-3xl border border-white/5 bg-zinc-900/50 p-6">
              <RealtimeRankingTab bolaoId={campaign.bolaoId} variant="tv" />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-3xl border border-white/5 bg-zinc-900/50 p-12 text-center">
              <div>
                <h3 className="font-display text-3xl font-bold uppercase text-zinc-600">Ranking em breve</h3>
                <p className="mt-4 max-w-md text-lg text-zinc-500">
                  O bolão vinculado ainda não foi configurado. Quando os palpites começarem, o ranking aparecerá aqui.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
