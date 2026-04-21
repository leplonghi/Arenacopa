/**
 * BolaoRapido — Bolão de Jogo Único
 *
 * Fluxo simplificado:
 * 1. Usuário escolhe um jogo da lista (hoje / em breve)
 * 2. Dá um nome rápido (ou aceita o auto-gerado)
 * 3. Cria → recebe link para compartilhar
 *
 * Sem wizard, sem mercados complexos.
 * O app calcula tudo e entrega mastigado.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Share2, Zap } from "lucide-react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Share } from "@capacitor/share";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateBolao } from "@/hooks/useCreateBolao";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { getSiteUrl } from "@/utils/site-url";
import { getTeam } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// ─── Types ────────────────────────────────────────────────────
type MatchRow = {
  id: string;
  home_team_code: string;
  away_team_code: string;
  match_date: string;
  status: string;
  stage?: string | null;
  group_id?: string | null;
};

// ─── Match item card ──────────────────────────────────────────
function MatchItem({
  match,
  selected,
  onSelect,
}: {
  match: MatchRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, i18n } = useTranslation("bolao");
  const home = getTeam(match.home_team_code);
  const away = getTeam(match.away_team_code);
  const date = new Date(match.match_date);
  const timeStr = date.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
  const isLive = match.status === "live" || match.status === "in_progress";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(34,197,94,0.15)]"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/20"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
          <span className="text-2xl">{home?.flag ?? "🏳️"}</span>
          <span className="text-xs font-black text-white truncate max-w-full">{home?.name ?? match.home_team_code}</span>
        </div>

        {/* VS / Live */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          {isLive ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">{t("express.live_badge")}</span>
          ) : (
            <>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{timeStr}</span>
              <span className="text-sm font-black text-zinc-400">{t("express.versus")}</span>
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-1 flex-col items-center gap-1 min-w-0">
          <span className="text-2xl">{away?.flag ?? "🏳️"}</span>
          <span className="text-xs font-black text-white truncate max-w-full">{away?.name ?? match.away_team_code}</span>
        </div>
      </div>

      {selected && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary/15 py-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">{t("express.match_selected")}</span>
        </div>
      )}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function BolaoRapido() {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { current: championship } = useChampionship();
  const { createBolao, creating } = useCreateBolao();

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [createdBolaoId, setCreatedBolaoId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load today + next 3 days of matches
  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoadingMatches(true);
      try {
        const now = new Date();
        const cutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

        const snap = await getDocs(
          query(
            collection(db, "matches"),
            where("match_date", ">=", new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()), // include matches from 2h ago (may be live)
            where("match_date", "<=", cutoff),
            orderBy("match_date", "asc")
          )
        );
        if (mountedRef.current) {
          setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MatchRow)));
        }
      } catch {
        // fallback: show empty state
      } finally {
        if (mountedRef.current) setLoadingMatches(false);
      }
    };
    void fetchUpcoming();
  }, []);

  // Auto-fill name when match is selected
  const handleSelectMatch = (match: MatchRow) => {
    setSelectedMatchId(match.id);
    const home = getTeam(match.home_team_code);
    const away = getTeam(match.away_team_code);
    const homeName = home?.name ?? match.home_team_code;
    const awayName = away?.name ?? match.away_team_code;
    setName(`${homeName} x ${awayName}`);
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  const handleCreate = async () => {
    if (!selectedMatchId || !name.trim()) return;

    const result = await createBolao({
      name: name.trim(),
      description: "",
      emoji: "⚽",
      category: "private",
      formatId: "classic",
      selectedMarketIds: ["score"],
      scoringRules: { exact: 10, winner: 3, draw: 3, participation: 1 },
      champion: "",
      scoringMode: "default",
      championshipId: championship.id,
      matchId: selectedMatchId,
    });

    if (result) {
      setCreatedBolaoId(result.bolaoId);
      setInviteCode(result.inviteCode);
    }
  };

  // ─── Success screen ──────────────────────────────────────────
  if (createdBolaoId && inviteCode && selectedMatch) {
    const home = getTeam(selectedMatch.home_team_code);
    const away = getTeam(selectedMatch.away_team_code);
    const inviteUrl = `${getSiteUrl()}/b/${inviteCode}`;
    const msg = t("express.share_message", {
      home: home?.name ?? t("express.home_fallback"),
      away: away?.name ?? t("express.away_fallback"),
      code: inviteCode,
    });

    const handleShare = async () => {
      try {
        await Share.share({ title: t("express.share_title"), text: msg, url: inviteUrl });
      } catch {
        await navigator.clipboard.writeText(inviteUrl);
        toast({ title: t("bolao_detail.link_copied") });
      }
    };

    return (
      <div className="mx-auto max-w-md px-4 py-10 text-white">
        <div className="surface-card-strong rounded-[32px] p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-5xl">⚽</div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{t("express.created_title")}</p>
          <h1 className="mt-1 text-2xl font-black">{name}</h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-3xl">{home?.flag ?? "🏳️"}</span>
            <span className="text-sm font-black text-zinc-400">{t("express.versus")}</span>
            <span className="text-3xl">{away?.flag ?? "🏳️"}</span>
          </div>

          <div className="surface-card-soft mt-5 rounded-2xl p-4">
            <p className="text-xs text-zinc-400 mb-1">{t("wizard.success.invite_code")}</p>
            <p className="text-3xl font-black tracking-widest text-primary">{inviteCode}</p>
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            {t("express.created_desc")}
          </p>

          <div className="mt-5 grid gap-3">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${msg} ${inviteUrl}`)}`, "_blank")}
              className="rounded-2xl bg-[#25D366] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-white"
            >
              {t("wizard.success.whatsapp")}
            </button>
            <button
              onClick={handleShare}
              className="surface-card-soft inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em]"
            >
              <Share2 className="h-4 w-4" /> {t("wizard.success.more_options")}
            </button>
            <button
              onClick={() => navigate(`/boloes/${createdBolaoId}`)}
              className="mt-1 w-full rounded-[24px] bg-primary px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black"
            >
              {t("wizard.success.view_bolao")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main flow ───────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          aria-label={t("wizard.back")}
          onClick={() => navigate(-1)}
          className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t("express.title")}</p>
          </div>
          <h1 className="text-2xl font-black leading-tight">{t("express.pick_match_title")}</h1>
        </div>
      </div>

      {/* Instruction */}
      <p className="mb-5 text-sm text-zinc-400">
        {t("express.pick_match_desc")}
      </p>

      {/* Match list */}
      {loadingMatches ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="font-black text-white">{t("express.no_matches_soon")}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {t("express.no_matches_desc")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchItem
              key={m.id}
              match={m}
              selected={selectedMatchId === m.id}
              onSelect={() => handleSelectMatch(m)}
            />
          ))}
        </div>
      )}

      {/* Name field — appears after match selection */}
      {selectedMatchId && (
        <div className="mt-6 space-y-3">
          <div>
            <p className="mb-2 text-sm font-bold text-zinc-200">{t("wizard.name_step.name_label")}</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("express.name_placeholder")}
              maxLength={40}
              className="surface-input w-full rounded-[20px] px-5 py-4 text-lg font-black placeholder:text-zinc-500"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {creating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("wizard.creating")}</>
            ) : (
              <><Zap className="h-4 w-4" /> {t("express.create_and_share")}</>
            )}
          </button>
          <p className="text-center text-xs text-zinc-500">
            {t("express.footer_hint")}
          </p>
        </div>
      )}
    </div>
  );
}
