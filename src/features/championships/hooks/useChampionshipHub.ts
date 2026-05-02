import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { getChampionshipById } from "@/data/championships/definitions";

export type HubTab = "jogos" | "classificacao" | "noticias" | "boloes";

export function useChampionshipHub() {
  const { championshipId } = useParams<{ championshipId: string }>();
  const navigate = useNavigate();
  const { setChampionship } = useChampionship();
  const { t } = useTranslation(["championships", "common"]);
  const [tab, setTab] = useState<HubTab>("jogos");

  const championship = championshipId ? getChampionshipById(championshipId) : null;

  useEffect(() => {
    if (championship) setChampionship(championship.id);
  }, [championship, setChampionship]);

  useEffect(() => {
    if (championshipId === "wc2026") navigate("/copa", { replace: true });
  }, [championshipId, navigate]);

  if (!championship || championship.id === "wc2026") {
    return {
      championship: null,
      tab,
      setTab,
      t,
      navigate,
      statusLabel: "",
      statusColor: "",
      formatLabel: "",
      countdownDays: 0,
      timelineLabel: "",
      color: "",
      gradient: ["", ""] as [string, string],
    };
  }

  const [from, to] = championship.gradient;
  const { color } = championship;

  const statusLabel =
    championship.status === "live"
      ? t("championships:hub.status.live", { defaultValue: "Ao Vivo" })
      : championship.status === "upcoming"
        ? t("championships:hub.status.upcoming", { defaultValue: "Em breve" })
        : t("championships:hub.status.finished", { defaultValue: "Encerrado" });

  const statusColor = championship.status === "live"
    ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : championship.status === "upcoming"
    ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
    : "text-zinc-400 bg-white/10 border-white/20";

  const formatLabel =
    championship.format === "league"
      ? t("championships:hub.stats.format_league", { defaultValue: "Liga" })
      : championship.format === "mixed"
        ? t("championships:hub.stats.format_cup", { defaultValue: "Copa" })
        : t("championships:hub.stats.format_tournament", { defaultValue: "Torneio" });

  const startDate = new Date(`${championship.dateStart}T12:00:00`);
  const endDate = new Date(`${championship.dateEnd}T12:00:00`);
  const now = new Date();
  const countdownTarget = championship.status === "upcoming" ? startDate : endDate;
  const countdownDays = Math.max(Math.ceil((countdownTarget.getTime() - now.getTime()) / 86400000), 0);
  const timelineLabel = `${startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  return {
    championship,
    tab,
    setTab,
    t,
    navigate,
    statusLabel,
    statusColor,
    formatLabel,
    countdownDays,
    timelineLabel,
    color,
    gradient: [from, to] as [string, string],
  };
}
