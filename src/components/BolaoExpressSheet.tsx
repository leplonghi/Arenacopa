import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Share2, X, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, query, orderBy, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreateBolao } from "@/hooks/useCreateBolao";
import { getSiteUrl } from "@/utils/site-url";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import { cn } from "@/lib/utils";
import { openWhatsAppShare } from "@/lib/security";

interface Match { id: string; home_team_code: string; away_team_code: string; match_date: string; }
const EMOJIS = ["⚽", "🔥", "🦁", "🎯", "💪", "🏅"];
const DEFAULT_RULES = { exact: 10, winner: 3, draw: 3, participation: 1 };

interface Props { open: boolean; onClose: () => void; }

export function BolaoExpressSheet({ open, onClose }: Props) {
  const { t, i18n } = useTranslation("bolao");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createBolao, creating } = useCreateBolao();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⚡");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingMatches(true);
      try {
        const snap = await getDocs(query(
          collection(db, "matches"),
          where("status", "in", ["upcoming", "scheduled"]),
          orderBy("match_date", "asc"),
          limit(6)
        ));
        const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Match, "id">) }));
        setMatches(rows);
        if (rows[0] && !selectedMatch) {
          setSelectedMatch(rows[0]);
          setName(`Bolão ${rows[0].home_team_code} x ${rows[0].away_team_code}`);
        }
      } catch (e) { console.error(e); }
      finally { setLoadingMatches(false); }
    };
    load();
  }, [open, selectedMatch]);

  const handleSelectMatch = (m: Match) => {
    setSelectedMatch(m);
    setName(t("express_sheet.default_name", { home: m.home_team_code, away: m.away_team_code }));
  };

  const handleCreate = async () => {
    if (!selectedMatch || !name.trim()) return;
    const result = await createBolao({
      name, description: "", emoji, category: "private",
      formatId: "strategic",
      selectedMarketIds: getDefaultMarketIdsForFormat("strategic"),
      scoringRules: DEFAULT_RULES, champion: "",
      matchId: selectedMatch.id,
    });
    if (result) {
      toast({ title: t("express_sheet.created_toast"), className: "bg-emerald-500 text-white font-black" });
      setCreatedId(result.bolaoId);
      setCreatedCode(result.inviteCode);
    }
  };

  const handleClose = () => { setCreatedId(null); setCreatedCode(null); setSelectedMatch(null); onClose(); };

  if (!open) return null;

  // Success view
  if (createdId && createdCode) {
    const url = `${getSiteUrl()}/b/${createdCode}`;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
        <div className="w-full max-w-lg rounded-t-[32px] bg-[#0f1f14] p-6 pb-10 text-white" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 text-center text-4xl">⚡</div>
          <p className="text-center text-xl font-black">{name}</p>
          <p className="mt-1 text-center text-sm text-zinc-400">{t("express_sheet.created_desc")}</p>
          <button onClick={() => {
            const opened = openWhatsAppShare(t("express_sheet.whatsapp_message", { name, url }));
            if (!opened) {
              navigator.clipboard.writeText(url);
              toast({ title: t("express_sheet.link_copied") });
            }
          }}
            className="mt-5 w-full rounded-2xl bg-primary py-4 text-[11px] font-black uppercase tracking-widest text-black">
            {t("express_sheet.share_whatsapp")}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(url); toast({ title: t("express_sheet.link_copied") }); }}
            className="mt-2 w-full truncate rounded-2xl bg-white/5 px-4 py-3 text-xs text-zinc-400">{url}</button>
          <button onClick={() => { handleClose(); navigate(`/boloes/${createdId}`); }}
            className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-sm font-bold">{t("express_sheet.open_pool")}</button>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-lg rounded-t-[32px] bg-[#0f1f14] p-6 pb-10 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-black">{t("express_sheet.title")}</span>
          </div>
          <button onClick={handleClose} className="rounded-full bg-white/10 p-2"><X className="h-4 w-4" /></button>
        </div>

        {/* Match picker */}
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">{t("express_sheet.pick_match")}</p>
        <div className="mb-4 flex flex-col gap-2 max-h-40 overflow-y-auto">
          {loadingMatches && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 rounded-2xl bg-white/5" />
              ))}
            </div>
          )}
          {!loadingMatches && matches.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 py-6 text-center">
              <span className="text-3xl">📅</span>
              <p className="text-sm font-bold text-zinc-300">{t("express_sheet.empty_title")}</p>
              <p className="text-xs text-zinc-500 px-4">{t("express_sheet.empty_desc")}</p>
              <button
                onClick={() => { onClose(); navigate("/boloes/criar"); }}
                className="mt-1 rounded-xl bg-primary/20 border border-primary/40 px-4 py-2 text-xs font-black text-primary hover:bg-primary/30 transition-colors">
                {t("express_sheet.create_custom")}
              </button>
            </div>
          )}
          {!loadingMatches && matches.map((m) => (
            <button key={m.id} onClick={() => handleSelectMatch(m)}
              className={cn("rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all",
                selectedMatch?.id === m.id ? "bg-primary/20 border border-primary" : "bg-white/5 hover:bg-white/10")}>
              {m.home_team_code} × {m.away_team_code}
              <span className="ml-2 text-xs font-normal text-zinc-400">
                {new Date(m.match_date).toLocaleDateString(i18n.language, { day: "2-digit", month: "short" })}
              </span>
            </button>
          ))}
        </div>

        {/* Name + emoji */}
        <div className="mb-3 flex gap-2">
          <div className="flex gap-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                className={cn("rounded-xl p-2 text-xl", emoji === e ? "bg-primary/20 border border-primary" : "bg-white/5")}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t("express_sheet.name_placeholder")}
          className="mb-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-base font-black placeholder:font-normal placeholder:text-zinc-500 outline-none" />

        <button onClick={handleCreate} disabled={!selectedMatch || !name.trim() || creating}
          className="w-full rounded-2xl bg-primary py-4 text-[11px] font-black uppercase tracking-widest text-black disabled:opacity-60">
          {creating ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t("express_sheet.creating")}</span> : t("express_sheet.create_now")}
        </button>
      </div>
    </div>
  );
}
