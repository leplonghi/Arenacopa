import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useNavigate } from "react-router-dom";
import { Trophy, Lock, ChevronRight, Plus, Swords } from "lucide-react";
import type { BolaoData } from "@/types/bolao";
import type { getChampionshipById } from "@/data/championships/definitions";

function BolaoCard({ bolao, onPress }: { bolao: BolaoData; onPress: () => void }) {
  const { t } = useTranslation("championships");
  const isPrivate = bolao.category === "private";
  const statusLabel =
    bolao.status === "open"
      ? t("hub.pools.status_open", { defaultValue: "Aberto para entrar" })
      : bolao.status === "active"
        ? t("hub.pools.status_active", { defaultValue: "Em andamento" })
        : bolao.status;

  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-white/[0.06] border border-white/[0.08] overflow-hidden">
        {bolao.avatar_url ? (
          <img src={bolao.avatar_url} alt={bolao.name} className="w-full h-full object-cover" />
        ) : (
          <Trophy className="w-5 h-5 text-white/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate">{bolao.name}</p>
          {isPrivate && <Lock className="w-3 h-3 text-zinc-500 shrink-0" />}
        </div>
        <p className="text-xs text-zinc-500 capitalize">{statusLabel}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
    </button>
  );
}

export function BolõesTab({
  championshipId,
  championship,
  color,
}: {
  championshipId: string;
  championship: ReturnType<typeof getChampionshipById>;
  color: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation("championships");

  const { data: boloes, isLoading } = useQuery({
    queryKey: ["championship-boloes", championshipId],
    queryFn: async () => {
      const ref = collection(db, "boloes");
      const q = query(ref, where("championship_id", "==", championshipId), where("status", "in", ["active", "open"]), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BolaoData[];
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-3 mt-1">
      <button
        onClick={() => navigate("/boloes/criar", { state: { championship_id: championshipId } })}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-dashed transition-all hover:opacity-80"
        style={{ borderColor: `${color}50`, background: `${color}0d` }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}35` }}>
          <Plus className="w-5 h-5" style={{ color }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-white">{t("hub.pools.create_title", { defaultValue: "Criar bolão" })}</p>
          <p className="text-xs text-zinc-500">{championship?.shortName} · {championship?.season}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto shrink-0" />
      </button>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : boloes && boloes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 px-1">{t("hub.pools.active_count", { defaultValue: "Bolões ativos ({{count}})", count: boloes.length })}</p>
          {boloes.map((b) => <BolaoCard key={b.id} bolao={b} onPress={() => navigate(`/boloes/${b.id}`)} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center py-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
            <Swords className="w-7 h-7" style={{ color }} />
          </div>
          <p className="text-sm font-extrabold text-white/80">{t("hub.pools.empty_title", { defaultValue: "Nenhum bolão ainda" })}</p>
          <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">{t("hub.pools.empty_desc", { defaultValue: "Seja o primeiro a criar um bolão para este campeonato!" })}</p>
        </div>
      )}
    </div>
  );
}
