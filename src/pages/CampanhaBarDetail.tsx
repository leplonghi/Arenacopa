import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, MessageCircle, Share2, Ticket, WalletCards } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildCommercialShareText } from "@/lib/commercial-campaign";
import { getCommercialPlanDefinition } from "@/lib/commercial-campaign-pricing";
import {
  createCommercialCampaignCheckout,
  getCommercialCampaign,
  syncCommercialCampaignCheckout,
} from "@/services/commercial/commercial-campaign.service";
import type { CommercialCampaign } from "@/types/commercial-campaign";

export default function CampanhaBarDetail() {
  const { campaignId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CommercialCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const shareUrl = campaign?.qrPayload || "";
  const selectedPlan = campaign ? getCommercialPlanDefinition(campaign.pricingPlan) : null;
  const shareText = useMemo(
    () =>
      campaign
        ? buildCommercialShareText({
            merchantName: campaign.merchant?.name || "ArenaCup",
            campaignTitle: campaign.title,
            benefitSummary: campaign.benefitSummary,
            shareUrl,
          })
        : "",
    [campaign, shareUrl],
  );

  const loadCampaign = useCallback(async () => {
    if (!campaignId || !session) return;
    setLoading(true);
    try {
      const token = await session.getIdToken();
      const loaded = await getCommercialCampaign({
        token,
        payload: { campaign_id: campaignId },
      });
      setCampaign(loaded);
    } catch (error) {
      toast({
        title: "Campanha não encontrada",
        description: "Confira o link ou volte para criar uma nova campanha.",
        variant: "destructive",
      });
      navigate("/bares");
    } finally {
      setLoading(false);
    }
  }, [campaignId, navigate, session, toast]);

  useEffect(() => {
    void loadCampaign();
  }, [loadCampaign]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (!checkout || !sessionId || !session) return;

    const clearParams = () => {
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      next.delete("session_id");
      setSearchParams(next, { replace: true });
    };

    if (checkout === "cancelled") {
      toast({ title: "Pagamento cancelado", description: "A campanha continua salva como rascunho." });
      clearParams();
      return;
    }

    void session.getIdToken()
      .then((token) =>
        syncCommercialCampaignCheckout({
          token,
          payload: { checkout_session_id: sessionId },
        }),
      )
      .then((synced) => {
        setCampaign(synced);
        toast({ title: "Campanha publicada", description: "Seu QR e link já podem ser compartilhados." });
      })
      .catch(() => {
        toast({
          title: "Pagamento ainda não confirmado",
          description: "Se você pagou, aguarde alguns instantes e atualize a página.",
          variant: "destructive",
        });
      })
      .finally(clearParams);
  }, [searchParams, session, setSearchParams, toast]);

  const startCheckout = async () => {
    if (!campaignId || !session) return;

    try {
      setCheckoutLoading(true);
      const token = await session.getIdToken();
      const checkout = await createCommercialCampaignCheckout({
        token,
        payload: {
          campaign_id: campaignId,
          site_url: window.location.origin,
        },
      });
      window.location.assign(checkout.url);
    } catch (error) {
      toast({
        title: "Checkout indisponível",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareText);
    toast({ title: "Texto copiado", description: "Agora é só colar no WhatsApp, Telegram ou Instagram." });
  };

  if (loading || !campaign) {
    return (
      <div className="arena-screen flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPublished = ["published", "live", "finished"].includes(campaign.status);

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="p-5 sm:p-7">
        <ArenaSectionHeader
          eyebrow={isPublished ? "Campanha publicada" : "Aguardando publicação"}
          title={campaign.title}
          hint={`${campaign.merchant?.name || "Seu bar"} · ${campaign.merchant?.neighborhood || ""}`}
        />
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.16em]">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
            {campaign.status}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
            Código: {campaign.benefitCode}
          </span>
        </div>
      </ArenaPanel>

      {!isPublished ? (
        <ArenaPanel className="mt-5 p-5">
          <ArenaSectionHeader
            eyebrow="Pagamento"
            title="Publique a campanha"
            hint="Depois do pagamento, o bolão vinculado é publicado e o QR fica pronto para uso no bar."
          />
          <button
            onClick={() => void startCheckout()}
            disabled={checkoutLoading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[20px] bg-primary px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
            Publicar por {selectedPlan?.priceLabel || "checkout"}
          </button>
        </ArenaPanel>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
        <ArenaPanel className="p-5">
          <ArenaSectionHeader eyebrow="QR do bar" title="Entrada rápida" hint="Imprima, mostre no telão ou deixe na mesa." />
          <div className="mt-5 flex justify-center rounded-[26px] border border-white/10 bg-white p-5">
            <QRCodeSVG value={shareUrl || window.location.href} size={220} />
          </div>
          <p className="mt-4 break-all rounded-[18px] border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
            {shareUrl}
          </p>
        </ArenaPanel>

        <ArenaPanel className="p-5">
          <ArenaSectionHeader eyebrow="Compartilhar" title="Kit da campanha" hint="Texto pronto para mandar para a turma." />
          <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-200 whitespace-pre-line">
            {shareText}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => void copyShare()}
              className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
            >
              <Share2 className="h-4 w-4" />
              Copiar texto
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </ArenaPanel>
      </div>

      <ArenaPanel className="mt-5 p-5">
        <ArenaSectionHeader eyebrow="Benefício" title="Conferência no balcão" hint="O estabelecimento valida manualmente. Não é aposta, sorteio ou prêmio financeiro." />
        <div className="mt-4 grid gap-3 sm:grid-cols-[0.8fr,1.2fr]">
          <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-5 text-center">
            <Ticket className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">Código</p>
            <p className="mt-1 font-display text-3xl font-black uppercase text-white">{campaign.benefitCode}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm leading-6 text-zinc-200">{campaign.benefitSummary}</p>
            {campaign.benefitTerms ? <p className="mt-3 text-xs leading-5 text-zinc-500">{campaign.benefitTerms}</p> : null}
          </div>
        </div>
      </ArenaPanel>

      {campaign.bolaoId ? (
        <Link
          to={`/boloes/${campaign.bolaoId}`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.04] px-5 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-white"
        >
          Abrir bolão vinculado
        </Link>
      ) : null}
    </div>
  );
}
